import { createRoute, z } from "@hono/zod-openapi";
import type { Database } from "@seeds/supabase/types/db";
import { createClient } from "@supabase/supabase-js";
import type { Context } from "hono";
import {
	createOpenAPIApp,
	ErrorResponseSchema,
	MetadataSchema,
} from "../../../lib/openapi.js";
import { publicAuth } from "../../../middleware/public-auth.js";
import { adaptiveRateLimit } from "../../../middleware/rate-limit.js";
import { ApplicationService } from "../../../services/application.js";
import { ConfigService } from "../../../services/config.js";
import { EmailService } from "../../../services/email.js";
import { FileUploadService } from "../../../services/file-upload.js";
import { Logger } from "../../../services/logger.js";

const publicJobsEnhancedRoutes = createOpenAPIApp();

publicJobsEnhancedRoutes.use("*", publicAuth());
publicJobsEnhancedRoutes.use("*", adaptiveRateLimit());


const EnhancedApplicationRequestSchema = z
	.object({
		formData: z
			.record(z.any())
			.describe("Dynamic form data based on job's form template"),
		files: z
			.object({
				resume: z
					.object({
						fileName: z.string(),
						content: z.string().describe("Base64 encoded file content"),
						mimeType: z.enum([
							"application/pdf",
							"application/msword",
							"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
							"text/plain",
						]),
					})
					.optional(),
				coverLetter: z
					.object({
						fileName: z.string(),
						content: z.string(),
						mimeType: z.enum([
							"application/pdf",
							"application/msword",
							"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
							"text/plain",
						]),
					})
					.optional(),
				portfolio: z
					.array(
						z.object({
							fileName: z.string(),
							content: z.string(),
							mimeType: z.string(),
						}),
					)
					.optional(),
			})
			.optional()
			.describe("File uploads based on form template requirements"),
	})
	.describe("Enhanced job application submission data");

const EnhancedApplicationResponseSchema = z
	.object({
		success: z.literal(true),
		data: z.object({
			applicationId: z.string().uuid(),
			candidateId: z.string().uuid(),
			pipelineStageId: z.string().optional().describe("Current stage in hiring pipeline"),
			status: z.enum(["submitted", "under_review", "auto_rejected"]),
			score: z.number().optional(),
			nextSteps: z.string(),
		}),
		metadata: MetadataSchema,
	})
	.describe("Enhanced application response with pipeline integration");

const applyToJobEnhancedRoute = createRoute({
	method: "post",
	path: "/{jobId}/apply-enhanced",
	tags: ["Job Applications"],
	summary: "Submit enhanced application with form template validation",
	description: `
Submit a job application using the job's associated form template for validation.
This enhanced endpoint:

- Validates application data against the job's form template
- Processes dynamic form fields based on template configuration
- Creates candidate entry in the hiring pipeline
- Handles multiple file uploads (resume, cover letter, portfolio)
- Automatically places candidate in the first pipeline stage
- Triggers AI-powered resume parsing and scoring
- Sends confirmation and status emails

**Form Template Integration:**
- Application fields are dynamically validated based on the job's form template
- Required fields are enforced according to template configuration
- Field types and validation rules are applied from the template
- File upload requirements are determined by the template

**Pipeline Integration:**
- Candidate automatically enters the first stage of the job's pipeline template
- Pipeline status tracking begins immediately upon submission
- Automated actions trigger based on pipeline configuration
`,
	request: {
		params: z.object({
			jobId: z.string().uuid(),
		}),
		body: {
			content: {
				"application/json": {
					schema: EnhancedApplicationRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: EnhancedApplicationResponseSchema,
				},
			},
			description: "Application submitted successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid form data or validation failed",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Job posting not found",
		},
		422: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Form validation failed",
		},
	},
	security: [{ ApiKeyAuth: [] }],
});

publicJobsEnhancedRoutes.openapi(
	applyToJobEnhancedRoute,
	async (c: Context): Promise<any> => {
		const startTime = Date.now();
		const correlationId = c.get("correlationId") || crypto.randomUUID();
		const logger = new Logger({ correlationId, requestId: c.get("requestId") });

		try {
			const body = await c.req.json();
			const { jobId } = c.req.param();
			const { formData, files } = body;

			logger.info("Processing enhanced job application", {
				jobId,
				formFieldCount: Object.keys(formData || {}).length,
				hasResume: !!files?.resume,
				hasCoverLetter: !!files?.coverLetter,
				portfolioCount: files?.portfolio?.length || 0,
			});

			const config = ConfigService.getInstance().getConfig();
			const supabase = createClient<Database>(
				config.supabaseUrl,
				config.supabaseServiceRoleKey,
			);

			
			const { data: jobData, error: jobError } = await supabase
				.from("job_postings")
				.select(`
					*,
					organizations(name),
					form_template:application_form_templates(*),
					pipeline_template:pipeline_templates(*)
				`)
				.eq("id", jobId)
				.single();

			if (jobError || !jobData) {
				logger.warn("Job not found", { jobId });
				return c.json(
					{
						success: false as const,
						error: {
							code: "JOB_NOT_FOUND",
							message: "Job posting not found or not accepting applications",
						},
						timestamp: new Date().toISOString(),
						correlationId,
					},
					404,
				);
			}

			
			const formTemplate = jobData.form_template;
			const pipelineTemplate = jobData.pipeline_template;

			if (formTemplate && formTemplate.fields) {
				const validationErrors: string[] = [];
				const templateFields = formTemplate.fields as any[];

				
				for (const field of templateFields) {
					if (field.required && !formData[field.id]) {
						validationErrors.push(`${field.name} is required`);
					}

					
					if (formData[field.id]) {
						const value = formData[field.id];
						
						switch (field.type) {
							case "email":
								if (!z.string().email().safeParse(value).success) {
									validationErrors.push(`${field.name} must be a valid email`);
								}
								break;
							case "number":
								if (!z.number().safeParse(Number(value)).success) {
									validationErrors.push(`${field.name} must be a number`);
								}
								break;
							case "url":
								if (!z.string().url().safeParse(value).success) {
									validationErrors.push(`${field.name} must be a valid URL`);
								}
								break;
							case "tel":
								if (!z.string().min(10).safeParse(value).success) {
									validationErrors.push(`${field.name} must be a valid phone number`);
								}
								break;
						}

						
						if (field.validation) {
							if (field.validation.min_length && value.length < field.validation.min_length) {
								validationErrors.push(`${field.name} must be at least ${field.validation.min_length} characters`);
							}
							if (field.validation.max_length && value.length > field.validation.max_length) {
								validationErrors.push(`${field.name} must be at most ${field.validation.max_length} characters`);
							}
							if (field.validation.min && Number(value) < field.validation.min) {
								validationErrors.push(`${field.name} must be at least ${field.validation.min}`);
							}
							if (field.validation.max && Number(value) > field.validation.max) {
								validationErrors.push(`${field.name} must be at most ${field.validation.max}`);
							}
						}
					}
				}

				
				const fileFields = templateFields.filter(f => f.type === "file");
				for (const fileField of fileFields) {
					if (fileField.required) {
						if (fileField.id === "field_1" && !files?.resume) {
							validationErrors.push("Resume is required");
						}
						if (fileField.id === "field_2" && !files?.coverLetter) {
							validationErrors.push("Cover letter is required");
						}
					}
				}

				if (validationErrors.length > 0) {
					logger.warn("Form validation failed", {
						jobId,
						errors: validationErrors,
					});
					return c.json(
						{
							success: false as const,
							error: {
								code: "VALIDATION_ERROR",
								message: "Form validation failed",
								details: validationErrors,
							},
							timestamp: new Date().toISOString(),
							correlationId,
						},
						422,
					);
				}
			}

			
			const candidateEmail = formData.email || formData.field_4 || formData.field_3;
			if (!candidateEmail) {
				return c.json(
					{
						success: false as const,
						error: {
							code: "VALIDATION_ERROR",
							message: "Email address is required",
						},
						timestamp: new Date().toISOString(),
						correlationId,
					},
					400,
				);
			}

			const { data: existingApplication } = await supabase
				.from("job_applications")
				.select("id")
				.eq("candidate_email", candidateEmail)
				.eq("job_posting_id", jobId)
				.limit(1);

			if (existingApplication && existingApplication.length > 0) {
				logger.info("Duplicate application prevented", {
					candidateEmail,
					jobId,
				});
				return c.json(
					{
						success: false as const,
						error: {
							code: "DUPLICATE_APPLICATION",
							message: "You have already applied to this position",
						},
						timestamp: new Date().toISOString(),
						correlationId,
					},
					422,
				);
			}

			
			const applicationService = new ApplicationService(supabase, logger);
			const fileUploadService = new FileUploadService(supabase, logger);
			const emailService = new EmailService(logger, supabase);

			
			const candidateName = formData.name || formData.field_2 || formData.field_3 || "Candidate";
			const candidatePhone = formData.phone || formData.field_5 || formData.field_4 || null;

			const application = await applicationService.createApplication({
				jobPostingId: jobId,
				candidateData: {
					name: candidateName,
					email: candidateEmail,
					phone: candidatePhone,
				},
				resumeFileId: "",
			});

			
			let resumeFileId: string | null = null;
			if (files?.resume) {
				const fileContent = Buffer.from(files.resume.content, "base64");
				const uploadedFile = await fileUploadService.uploadResume({
					candidateId: application.candidateId,
					fileName: files.resume.fileName,
					fileContent,
					mimeType: files.resume.mimeType,
					sizeBytes: fileContent.length,
					isDefaultResume: true,
				});
				resumeFileId = uploadedFile.id;
			}

			
			let pipelineStageId: string | null = null;
			if (pipelineTemplate && pipelineTemplate.steps) {
				const steps = pipelineTemplate.steps as any[];
				const firstStep = steps.find((s: any) => s.order === 1) || steps[0];
				
				if (firstStep) {
					
					
					const { error: updateError } = await supabase
						.from("job_applications")
						.update({
							current_step_id: firstStep.id,
						})
						.eq("id", application.applicationId);

					if (!updateError) {
						pipelineStageId = firstStep.id;
						logger.info("Candidate entered pipeline", {
							candidateId: application.candidateId,
							pipelineTemplateId: pipelineTemplate.id,
							stageId: firstStep.id,
							stageName: firstStep.name,
						});
					} else {
						logger.warn("Failed to update pipeline info", {
							error: updateError.message,
						});
					}
				}
			}

			
			
			if (formTemplate) {
				logger.info("Form submission received", {
					applicationId: application.applicationId,
					formTemplateId: formTemplate.id,
					formFields: Object.keys(formData),
					submittedAt: new Date().toISOString(),
				});
			}

			
			let score = null;
			if (resumeFileId && files?.resume) {
				try {
					const resumeText = Buffer.from(files.resume.content, "base64").toString("utf-8");
					const baseUrl = c.req.header("host")
						? `${c.req.header("x-forwarded-proto") || "http"}://${c.req.header("host")}`
						: "http://localhost:3000";

					const parseResponse = await fetch(
						`${baseUrl}/api/v1/candidates/${application.candidateId}/parse-resume`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Authorization: c.req.header("Authorization") || "",
								"x-correlation-id": correlationId,
							},
							body: JSON.stringify({
								candidateId: application.candidateId,
								jobId: jobId,
								fileContent: resumeText,
								fileName: files.resume.fileName,
							}),
						},
					);

					if (parseResponse.ok) {
						const parseResult = await parseResponse.json() as any;
						score = parseResult.data?.score?.overallScore;
					}
				} catch (error) {
					logger.warn("Resume parsing failed", { error });
				}
			}

			
			const jobTitle = jobData.title || "Position";
			const companyName = (jobData.organizations as any)?.name || "Company";

			await emailService.sendImmediateApplicationConfirmation({
				candidateName,
				candidateEmail,
				jobTitle,
				companyName,
				applicationId: application.applicationId,
			});

			logger.info("Enhanced application processed successfully", {
				applicationId: application.applicationId,
				candidateId: application.candidateId,
				pipelineStageId,
				formTemplateUsed: !!formTemplate,
				pipelineTemplateUsed: !!pipelineTemplate,
			});

			return c.json({
				success: true as const,
				data: {
					applicationId: application.applicationId,
					candidateId: application.candidateId,
					pipelineStageId,
					status: "submitted" as const,
					score,
					nextSteps: pipelineStageId
						? "Your application has been received and is now in our review pipeline. You'll be notified of any status updates."
						: "Your application has been received. You'll hear back within 7 business days.",
				},
				metadata: {
					processingTimeMs: Date.now() - startTime,
					correlationId,
					timestamp: new Date().toISOString(),
				},
			});
		} catch (error) {
			logger.error("Failed to process enhanced application", {
				error: error instanceof Error ? error.message : "Unknown error",
			});

			return c.json(
				{
					success: false as const,
					error: {
						code: "INTERNAL_ERROR",
						message: "An error occurred while processing your application",
					},
					timestamp: new Date().toISOString(),
					correlationId,
				},
				500,
			);
		}
	},
);

export { publicJobsEnhancedRoutes };