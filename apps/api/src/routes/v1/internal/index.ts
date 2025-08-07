import { createOpenAPIApp } from "../../../lib/openapi.js";
import { internalAnalyticsRoutes } from "./analytics.js";
import { cronRoutes } from "./cron.js";

const internalRoutes = createOpenAPIApp();

internalRoutes.route("/analytics", internalAnalyticsRoutes);
internalRoutes.route("/cron", cronRoutes);

export { internalRoutes };
