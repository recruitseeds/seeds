import { createOpenAPIApp, healthRoute } from "../../lib/openapi.js";
import { apiKeyAuth } from "../../middleware/api-auth.js";
import { candidatesRoutes } from "./candidates.js";
import { internalRoutes } from "./internal/index.js";
import { publicRoutes } from "./public/index.js";

const v1Routes = createOpenAPIApp();

v1Routes.use("*", async (c, next) => {
	await next();
	c.header("API-Version", "v1");
	c.header("Supported-Versions", "v1");
});

v1Routes.openapi(healthRoute, (c) => {
	return c.json({
		status: "ok" as const,
		version: "v1",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		environment: process.env.NODE_ENV || "development",
	});
});


v1Routes.use("/candidates/*", apiKeyAuth());
v1Routes.use("/public/*", apiKeyAuth());

v1Routes.route("/candidates", candidatesRoutes);
v1Routes.route("/internal", internalRoutes);
v1Routes.route("/public", publicRoutes);

export { v1Routes };
