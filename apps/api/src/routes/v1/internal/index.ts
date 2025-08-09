import { createOpenAPIApp } from "../../../lib/openapi.js";
import { internalAnalyticsRoutes } from "./analytics.js";
import { cronRoutes } from "./cron.js";
import { internalFormsRoutes } from "./forms.js";

const internalRoutes = createOpenAPIApp();

internalRoutes.route("/analytics", internalAnalyticsRoutes);
internalRoutes.route("/cron", cronRoutes);
internalRoutes.route("/forms", internalFormsRoutes);

export { internalRoutes };
