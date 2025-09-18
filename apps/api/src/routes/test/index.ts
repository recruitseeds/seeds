import { createOpenAPIApp } from "../../lib/openapi.js";
import { testPublicRoutes } from "./public/index.js";

const testRoutes = createOpenAPIApp();


testRoutes.use("*", async (c, next) => {
	await next();
	c.header("API-Version", "v1-test");
	c.header("Test-Environment", "true");
});

testRoutes.route("/public", testPublicRoutes);

export { testRoutes };