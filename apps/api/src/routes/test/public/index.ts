import { createOpenAPIApp } from "../../../lib/openapi.js";
import { testJobsRoutes } from "./jobs.js";
import { testCandidatesRoutes } from "./candidates.js";
import { testSavedJobsRoutes } from "./saved-jobs.js";

const testPublicRoutes = createOpenAPIApp();

testPublicRoutes.route("/jobs", testJobsRoutes);
testPublicRoutes.route("/candidates", testCandidatesRoutes);
testPublicRoutes.route("/saved-jobs", testSavedJobsRoutes);

export { testPublicRoutes };