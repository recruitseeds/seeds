import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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

		const maxSizeBytes = 5 * 1024 * 1024; // 5MB
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
				error: error?.message || "Unknown database error",
			});
			throw new Error("Failed to save file metadata");
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
}
