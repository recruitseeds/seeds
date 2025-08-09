import { createOpenAPIApp } from "../../../lib/openapi.js";
import { publicCandidatesRoutes } from "./candidates.js";
import { publicJobsRoutes } from "./jobs.js";
import { publicJobManagementRoutes } from "./job-management.js";
import { publicNotificationsRoutes } from "./notifications.js";
import { publicPipelinesRoutes } from "./pipelines.js";

const publicRoutes = createOpenAPIApp();

publicRoutes.route("/candidates", publicCandidatesRoutes);
publicRoutes.route("/jobs", publicJobsRoutes);
publicRoutes.route("/", publicJobManagementRoutes);
publicRoutes.route("/notifications", publicNotificationsRoutes);
publicRoutes.route("/", publicPipelinesRoutes);

export { publicRoutes };
