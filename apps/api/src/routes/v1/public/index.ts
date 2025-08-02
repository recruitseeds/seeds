import { createOpenAPIApp } from "../../../lib/openapi.js";
import { publicCandidatesRoutes } from "./candidates.js";
import { publicJobsRoutes } from "./jobs.js";
import { publicNotificationsRoutes } from "./notifications.js";

const publicRoutes = createOpenAPIApp();

publicRoutes.route("/candidates", publicCandidatesRoutes);
publicRoutes.route("/jobs", publicJobsRoutes);
publicRoutes.route("/notifications", publicNotificationsRoutes);

export { publicRoutes };
