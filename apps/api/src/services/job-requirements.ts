import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../../packages/supabase/types/db.js";
import { ConfigService } from "./config.js";
import type { Logger } from "./logger.js";

export interface JobRequirements {
	id: string;
	title: string;
	required_skills: string[];
	nice_to_have_skills: string[];
	min_experience_years: number;
	education_requirements: string[];
	experience_requirements: string[];
}

export class JobRequirementsService {
	private supabase: SupabaseClient<Database>;
	private logger: Logger;

	constructor(logger: Logger) {
		const config = ConfigService.getInstance().getConfig();
		this.supabase = createClient<Database>(
			config.supabaseUrl,
			config.supabaseServiceRoleKey,
		);
		this.logger = logger;
	}

	async getJobRequirements(jobId: string): Promise<JobRequirements> {
		try {
			const { data: jobs, error } = await this.supabase
				.from("job_postings")
				.select("id, title, content")
				.eq("id", jobId);

			if (error) {
				this.logger.warn(
					"Database query failed, using fallback job requirements",
					{ error: error.message, jobId },
				);
				return this.getFallbackJobRequirements(jobId);
			}

			if (!jobs || jobs.length === 0) {
				this.logger.warn("Job posting not found, using fallback requirements", {
					jobId,
				});
				return this.getFallbackJobRequirements(jobId);
			}

			const job = jobs[0];

			const content = job.content as Record<string, unknown>;

			return {
				id: job.id,
				title: job.title,
				required_skills: this.extractSkillsFromContent(
					content,
					"required_skills",
				) || ["JavaScript", "TypeScript", "React", "Node.js", "Git"],
				nice_to_have_skills: this.extractSkillsFromContent(
					content,
					"nice_to_have_skills",
				) || ["AWS", "Docker", "GraphQL", "MongoDB"],
				min_experience_years:
					this.extractNumberFromContent(content, "min_experience_years") || 3,
				education_requirements: this.extractArrayFromContent(
					content,
					"education_requirements",
				) || ["Bachelor's degree in Computer Science or related field"],
				experience_requirements: this.extractArrayFromContent(
					content,
					"experience_requirements",
				) || [
					"Experience with modern web frameworks",
					"Full-stack development experience",
				],
			};
		} catch (error) {
			this.logger.error("Failed to get job requirements", error, { jobId });
			return this.getFallbackJobRequirements(jobId);
		}
	}

	private getFallbackJobRequirements(jobId: string): JobRequirements {
		return {
			id: jobId,
			title: "Software Engineer",
			required_skills: [
				"JavaScript",
				"TypeScript",
				"React",
				"Node.js",
				"Git",
				"SQL",
			],
			nice_to_have_skills: [
				"AWS",
				"Docker",
				"GraphQL",
				"MongoDB",
				"Kubernetes",
				"CI/CD",
			],
			min_experience_years: 3,
			education_requirements: [
				"Bachelor's degree in Computer Science or related field",
			],
			experience_requirements: [
				"Experience with modern web frameworks",
				"Full-stack development experience",
				"Experience with RESTful APIs",
			],
		};
	}

	private extractSkillsFromContent(
		content: Record<string, unknown>,
		key: string,
	): string[] | null {
		const value = content[key];
		if (
			Array.isArray(value) &&
			value.every((item) => typeof item === "string")
		) {
			return value as string[];
		}
		return null;
	}

	private extractNumberFromContent(
		content: Record<string, unknown>,
		key: string,
	): number | null {
		const value = content[key];
		if (typeof value === "number") {
			return value;
		}
		return null;
	}

	private extractArrayFromContent(
		content: Record<string, unknown>,
		key: string,
	): string[] | null {
		const value = content[key];
		if (
			Array.isArray(value) &&
			value.every((item) => typeof item === "string")
		) {
			return value as string[];
		}
		return null;
	}
}
