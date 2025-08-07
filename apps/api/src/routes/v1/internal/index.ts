import { createOpenAPIApp } from "../../../lib/openapi.js";
import { internalAnalyticsRoutes } from "./analytics.js";
import { cronRoutes } from "./cron.js";
import pipelines from "./pipelines.js";
import forms from "./forms.js";
import orgSettings from "./org-settings.js";

const internalRoutes = createOpenAPIApp();

internalRoutes.route("/analytics", internalAnalyticsRoutes);
internalRoutes.route("/cron", cronRoutes);
internalRoutes.route("/pipelines", pipelines);
internalRoutes.route("/forms", forms);
internalRoutes.route("/org-settings", orgSettings);

export { internalRoutes };
