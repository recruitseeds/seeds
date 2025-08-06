import { PutObjectCommand, S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import type { Database } from "@seeds/supabase/types/db";
import type { SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import { ConfigService } from "./config.js";
import type { Logger } from "./logger.js";

export interface UploadedFile {
	id: string;
	candidateId: string;
	fileName: string;
	fileType: Database["public"]["Enums"]["candidate_file_type"];
	mimeType: string | null;
	sizeBytes: number;
	storagePath: string;
	isDefaultResume: boolean | null;
	tags: string[] | null;
}

export interface FileUploadRequest {
	candidateId: string;
	fileName: string;
	fileContent: Buffer;
	mimeType: string;
	sizeBytes: number;
	tags?: string[];
	isDefaultResume?: boolean;
}

export class FileUploadService {
	private s3Client: S3Client;
	private supabase: SupabaseClient<Database>;
	private logger: Logger;
	private bucketName: string;

	constructor(supabase: SupabaseClient<Database>, logger: Logger) {
		this.supabase = supabase;
		this.logger = logger;

		const config = ConfigService.getInstance().getConfig();

		if (
			!config.cloudflareR2.accountId ||
			!config.cloudflareR2.accessKeyId ||
			!config.cloudflareR2.secretAccessKey ||
			!config.cloudflareR2.bucketName
		) {
			throw new Error("Cloudflare R2 configuration is incomplete");
		}

		this.s3Client = new S3Client({
			region: "auto",
			endpoint: `https://${config.cloudflareR2.accountId}.r2.cloudflarestorage.com`,
			credentials: {
				accessKeyId: config.cloudflareR2.accessKeyId,
				secretAccessKey: config.cloudflareR2.secretAccessKey,
			},
		});

		this.bucketName = config.cloudflareR2.bucketName;
	}

	async uploadResume(request: FileUploadRequest): Promise<UploadedFile> {
		this.logger.info("Starting resume upload", {
			candidateId: request.candidateId,
			fileName: request.fileName,
			sizeBytes: request.sizeBytes,
		});

		this.validateFile(request);

		const storagePath = this.generateStoragePath(
			request.candidateId,
			request.fileName,
		);

		await this.uploadToR2(storagePath, request.fileContent, request.mimeType);

		const fileRecord = await this.createFileRecord(request, storagePath);

		if (request.isDefaultResume) {
			await this.setAsDefaultResume(request.candidateId, fileRecord.id);
		}

		this.logger.info("Resume upload completed successfully", {
			candidateId: request.candidateId,
			fileId: fileRecord.id,
			storagePath,
		});

		return fileRecord;
	}

	private validateFile(request: FileUploadRequest): void {
		const allowedMimeTypes = [
			"application/pdf",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"text/plain",
		];

		if (!allowedMimeTypes.includes(request.mimeType)) {
			throw new Error(
				`Unsupported file type: ${request.mimeType}. Allowed types: ${allowedMimeTypes.join(", ")}`,
			);
		}

		const maxSizeBytes = 5 * 1024 * 1024;
		if (request.sizeBytes > maxSizeBytes) {
			throw new Error(
				`File size ${request.sizeBytes} bytes exceeds maximum allowed size of ${maxSizeBytes} bytes`,
			);
		}

		if (request.sizeBytes === 0) {
			throw new Error("File cannot be empty");
		}
	}

	private generateStoragePath(candidateId: string, fileName: string): string {
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const sanitizedFileName = fileName
			.toLowerCase()
			.replace(/[^a-z0-9.-]/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "");

		return `candidates/${candidateId}/resumes/${timestamp}_${sanitizedFileName}`;
	}

	private async uploadToR2(
		storagePath: string,
		fileContent: Buffer,
		mimeType: string,
	): Promise<void> {
		try {
			await this.s3Client.send(
				new PutObjectCommand({
					Bucket: this.bucketName,
					Key: storagePath,
					Body: fileContent,
					ContentType: mimeType,
				}),
			);
		} catch (error) {
			this.logger.error("Failed to upload file to R2", {
				storagePath,
				error: error instanceof Error ? error.message : "Unknown error",
			});
			throw new Error("Failed to upload file to storage");
		}
	}

	private async createFileRecord(
		request: FileUploadRequest,
		storagePath: string,
	): Promise<UploadedFile> {
		const fileRecord: Database["public"]["Tables"]["candidate_files"]["Insert"] =
			{
				candidate_id: request.candidateId,
				file_name: request.fileName,
				file_type: "resume",
				mime_type: request.mimeType,
				size_bytes: request.sizeBytes,
				storage_path: storagePath,
				tags: request.tags || null,
				is_default_resume: request.isDefaultResume || false,
			};

		const { data, error } = await this.supabase
			.from("candidate_files")
			.insert(fileRecord)
			.select(
				"id, candidate_id, file_name, file_type, mime_type, size_bytes, storage_path, is_default_resume, tags",
			)
			.single();

		if (error || !data) {
			this.logger.error("Failed to create file record in database", {
				candidateId: request.candidateId,
				storagePath,
				error: error,
				errorMessage: error?.message,
				errorDetails: error?.details,
				errorHint: error?.hint,
				insertedData: fileRecord,
			});
			throw new Error(
				`Failed to save file metadata: ${error?.message || "Unknown database error"}`,
			);
		}

		return {
			id: data.id,
			candidateId: data.candidate_id,
			fileName: data.file_name,
			fileType: data.file_type,
			mimeType: data.mime_type,
			sizeBytes: data.size_bytes || 0,
			storagePath: data.storage_path,
			isDefaultResume: data.is_default_resume,
			tags: data.tags,
		};
	}

	private async setAsDefaultResume(
		candidateId: string,
		fileId: string,
	): Promise<void> {
		const { error } = await this.supabase.rpc(
			"set_default_resume_for_candidate",
			{
				p_candidate_id: candidateId,
				p_file_id: fileId,
			},
		);

		if (error) {
			this.logger.error("Failed to set default resume", {
				candidateId,
				fileId,
				error: error.message,
			});
			throw new Error("Failed to set default resume");
		}
	}

	async deleteFile(fileId: string): Promise<void> {
		this.logger.info("Starting file deletion", { fileId });

		// First, get the file record to get storage path
		const { data: fileRecord, error: fetchError } = await this.supabase
			.from("candidate_files")
			.select("storage_path, file_name")
			.eq("id", fileId)
			.single();

		if (fetchError || !fileRecord) {
			this.logger.error("File record not found for deletion", {
				fileId,
				error: fetchError?.message,
			});
			throw new Error("File not found");
		}

		// Delete from Cloudflare R2
		try {
			await this.s3Client.send(
				new DeleteObjectCommand({
					Bucket: this.bucketName,
					Key: fileRecord.storage_path,
				})
			);
			
			this.logger.info("File deleted from R2 storage", {
				fileId,
				storagePath: fileRecord.storage_path,
			});
		} catch (error) {
			this.logger.error("Failed to delete file from R2", {
				fileId,
				storagePath: fileRecord.storage_path,
				error: error instanceof Error ? error.message : "Unknown error",
			});
			// Continue with database deletion even if R2 deletion fails
		}

		// Delete from database
		const { error: deleteError } = await this.supabase
			.from("candidate_files")
			.delete()
			.eq("id", fileId);

		if (deleteError) {
			this.logger.error("Failed to delete file record from database", {
				fileId,
				error: deleteError.message,
			});
			throw new Error(`Failed to delete file record: ${deleteError.message}`);
		}

		this.logger.info("File deletion completed successfully", { fileId });
	}

	async deleteFilesByCandidate(candidateId: string): Promise<number> {
		this.logger.info("Starting bulk file deletion for candidate", { candidateId });

		// Get all files for the candidate
		const { data: fileRecords, error: fetchError } = await this.supabase
			.from("candidate_files")
			.select("id, storage_path, file_name")
			.eq("candidate_id", candidateId);

		if (fetchError) {
			this.logger.error("Failed to fetch files for candidate", {
				candidateId,
				error: fetchError.message,
			});
			throw new Error(`Failed to fetch candidate files: ${fetchError.message}`);
		}

		if (!fileRecords || fileRecords.length === 0) {
			this.logger.info("No files found for candidate", { candidateId });
			return 0;
		}

		let deletedCount = 0;
		const errors: string[] = [];

		// Delete each file from R2
		for (const file of fileRecords) {
			try {
				await this.s3Client.send(
					new DeleteObjectCommand({
						Bucket: this.bucketName,
						Key: file.storage_path,
					})
				);
				deletedCount++;
			} catch (error) {
				const errorMsg = `Failed to delete ${file.file_name} from R2: ${error instanceof Error ? error.message : "Unknown error"}`;
				errors.push(errorMsg);
				this.logger.error("R2 deletion failed for file", {
					fileId: file.id,
					storagePath: file.storage_path,
					error: errorMsg,
				});
			}
		}

		// Delete all file records from database in one operation
		const { error: bulkDeleteError } = await this.supabase
			.from("candidate_files")
			.delete()
			.eq("candidate_id", candidateId);

		if (bulkDeleteError) {
			this.logger.error("Failed to bulk delete file records from database", {
				candidateId,
				error: bulkDeleteError.message,
			});
			throw new Error(`Failed to delete file records: ${bulkDeleteError.message}`);
		}

		this.logger.info("Bulk file deletion completed", {
			candidateId,
			totalFiles: fileRecords.length,
			r2DeletedCount: deletedCount,
			errorCount: errors.length,
			errors: errors.length > 0 ? errors : undefined,
		});

		return fileRecords.length;
	}
}
