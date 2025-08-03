import type { Database } from "@seeds/supabase/types/db";
import type { SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import type { Logger } from "./logger.js";

export interface CreateApplicationRequest {
	jobPostingId: string;
	candidateData: {
		name: string;
		email: string;
		phone?: string;
	};
	resumeFileId: string;
}

export interface ApplicationResult {
	applicationId: string;
	candidateId: string;
	status: "under_review" | "auto_rejected";
	score?: number;
	nextSteps: string;
}

export class ApplicationService {
	private supabase: SupabaseClient<Database>;
	private logger: Logger;

	constructor(supabase: SupabaseClient<Database>, logger: Logger) {
		this.supabase = supabase;
		this.logger = logger;
	}

	async createApplication(
		request: CreateApplicationRequest,
	): Promise<ApplicationResult> {
		this.logger.info("Starting application creation", {
			jobPostingId: request.jobPostingId,
			candidateEmail: request.candidateData.email,
		});

		await this.validateJobPosting(request.jobPostingId);

		const candidateId = await this.createOrUpdateCandidate(
			request.candidateData,
		);

		const applicationId = await this.createJobApplication(
			request.jobPostingId,
			candidateId,
			request.candidateData.email,
			request.resumeFileId,
		);

		this.logger.info("Application created successfully", {
			applicationId,
			candidateId,
			jobPostingId: request.jobPostingId,
		});

		return {
			applicationId,
			candidateId,
			status: "under_review",
			nextSteps:
				"Your application has been received. You'll hear back within 7 business days.",
		};
	}

	private async validateJobPosting(jobPostingId: string): Promise<void> {
		const { data: jobPosting, error } = await this.supabase
			.from("job_postings")
			.select("id, status, published_at")
			.eq("id", jobPostingId)
			.single();

		if (error || !jobPosting) {
			this.logger.error("Job posting not found", {
				jobPostingId,
				error: error?.message,
			});
			throw new Error("Job posting not found");
		}

		if (jobPosting.status !== "published") {
			this.logger.error("Job posting is not published", {
				jobPostingId,
				status: jobPosting.status,
			});
			throw new Error("Job posting is not accepting applications");
		}

		if (!jobPosting.published_at) {
			this.logger.error("Job posting has no published date", {
				jobPostingId,
			});
			throw new Error("Job posting is not accepting applications");
		}
	}

	private async createOrUpdateCandidate(candidateData: {
		name: string;
		email: string;
		phone?: string;
	}): Promise<string> {
		const { data: existingApplication } = await this.supabase
			.from("job_applications")
			.select("candidate_id")
			.eq("candidate_email", candidateData.email)
			.limit(1)
			.single();

		if (existingApplication?.candidate_id) {
			this.logger.info("Found existing candidate from previous application", {
				candidateId: existingApplication.candidate_id,
				candidateEmail: candidateData.email,
			});

			await this.updateCandidateIfNeeded(
				existingApplication.candidate_id,
				candidateData,
			);
			return existingApplication.candidate_id;
		}

		const { data: authUser } = await this.supabase.auth.admin.listUsers();
		const existingUser = authUser?.users?.find(
			(u) => u.email === candidateData.email,
		);

		if (existingUser) {
			this.logger.info("Found existing auth user for email", {
				userId: existingUser.id,
				email: candidateData.email,
			});

			const { data: existingProfile } = await this.supabase
				.from("candidate_profiles")
				.select("id")
				.eq("id", existingUser.id)
				.single();

			if (existingProfile) {
				this.logger.info("Using existing candidate profile", {
					candidateId: existingProfile.id,
					email: candidateData.email,
				});
				await this.updateCandidateIfNeeded(existingProfile.id, candidateData);
				return existingProfile.id;
			}

			return await this.createCandidateProfileForUser(
				existingUser.id,
				candidateData,
			);
		}

		this.logger.info("Creating anonymous auth user for external application", {
			candidateEmail: candidateData.email,
		});

		const { data: newAuthUser, error: authError } =
			await this.supabase.auth.admin.createUser({
				email: candidateData.email,
				email_confirm: true,
				user_metadata: {
					full_name: candidateData.name,
					phone: candidateData.phone,
					source: "api_application",
				},
			});

		if (authError || !newAuthUser?.user) {
			this.logger.error("Failed to create auth user for candidate", {
				email: candidateData.email,
				error: authError?.message,
			});
			throw new Error(
				`Failed to create candidate account: ${authError?.message || "Unknown error"}`,
			);
		}

		return await this.createCandidateProfileForUser(
			newAuthUser.user.id,
			candidateData,
		);
	}

	private async createCandidateProfileForUser(
		userId: string,
		candidateData: { name: string; email: string; phone?: string },
	): Promise<string> {
		const [firstName, ...lastNameParts] = candidateData.name.split(" ");
		const lastName = lastNameParts.join(" ");

		const newCandidate: Database["public"]["Tables"]["candidate_profiles"]["Insert"] =
			{
				id: userId,
				first_name: firstName,
				last_name: lastName || null,
				phone_number: candidateData.phone || null,
				is_onboarded: false,
			};

		const { error } = await this.supabase
			.from("candidate_profiles")
			.insert(newCandidate);

		if (error) {
			this.logger.error("Failed to create candidate profile", {
				userId,
				candidateData,
				error: error.message,
				errorCode: error.code,
				errorDetails: error.details,
				errorHint: error.hint,
			});
			throw new Error(`Failed to create candidate profile: ${error.message}`);
		}

		this.logger.info("Created new candidate profile for user", {
			candidateId: userId,
			email: candidateData.email,
		});

		return userId;
	}

	private async updateCandidateIfNeeded(
		candidateId: string,
		candidateData: { name: string; email: string; phone?: string },
	): Promise<void> {
		const [firstName, ...lastNameParts] = candidateData.name.split(" ");
		const lastName = lastNameParts.join(" ");

		const updates: Partial<
			Database["public"]["Tables"]["candidate_profiles"]["Update"]
		> = {};

		if (firstName) {
			updates.first_name = firstName;
		}
		if (lastName) {
			updates.last_name = lastName;
		}
		if (candidateData.phone) {
			updates.phone_number = candidateData.phone;
		}

		if (Object.keys(updates).length > 0) {
			const { error } = await this.supabase
				.from("candidate_profiles")
				.update(updates)
				.eq("id", candidateId);

			if (error) {
				this.logger.warn("Failed to update candidate profile", {
					candidateId,
					error: error.message,
				});
			}
		}
	}

	private async createJobApplication(
		jobPostingId: string,
		candidateId: string,
		candidateEmail: string,
		resumeFileId: string,
	): Promise<string> {
		const applicationId = uuidv4();

		const applicationData: Database["public"]["Tables"]["job_applications"]["Insert"] =
			{
				id: applicationId,
				job_posting_id: jobPostingId,
				candidate_id: candidateId,
				candidate_email: candidateEmail,
				status: "active",
				applied_at: new Date().toISOString(),
			};

		const { error } = await this.supabase
			.from("job_applications")
			.insert(applicationData);

		if (error) {
			this.logger.error("Failed to create job application", {
				jobPostingId,
				candidateId,
				candidateEmail,
				resumeFileId,
				error: error.message,
				errorCode: error.code,
				errorDetails: error.details,
				errorHint: error.hint,
			});
			throw new Error(`Failed to create job application: ${error.message}`);
		}

		return applicationId;
	}
}
