import { createOpenAPIApp } from "../../../lib/openapi.js";
import { testJobsRoutes } from "./jobs.js";
import { testCandidatesRoutes } from "./candidates.js";

const testPublicRoutes = createOpenAPIApp();

testPublicRoutes.route("/jobs", testJobsRoutes);
testPublicRoutes.route("/candidates", testCandidatesRoutes);

export { testPublicRoutes };