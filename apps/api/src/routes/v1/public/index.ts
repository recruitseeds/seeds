import { createOpenAPIApp } from "../../../lib/openapi.js";
import { publicCandidatesRoutes } from "./candidates.js";
import { publicJobsRoutes } from "./jobs.js";
import { publicJobsEnhancedRoutes } from "./jobs-enhanced.js";
import { publicJobManagementRoutes } from "./job-management.js";
import { publicNotificationsRoutes } from "./notifications.js";
import { publicPipelinesRoutes } from "./pipelines.js";
import { publicFormTemplatesRoutes } from "./form-templates.js";
import { publicPipelineTemplatesRoutes } from "./pipeline-templates.js";

const publicRoutes = createOpenAPIApp();

publicRoutes.route("/candidates", publicCandidatesRoutes);
publicRoutes.route("/jobs", publicJobsRoutes);
publicRoutes.route("/jobs-enhanced", publicJobsEnhancedRoutes);
publicRoutes.route("/manage", publicJobManagementRoutes);
publicRoutes.route("/manage/forms", publicFormTemplatesRoutes);
publicRoutes.route("/manage/pipelines", publicPipelineTemplatesRoutes);
publicRoutes.route("/notifications", publicNotificationsRoutes);
publicRoutes.route("/", publicPipelinesRoutes);

export { publicRoutes };
