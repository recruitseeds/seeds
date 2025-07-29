import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "../init";
import { candidateRouter } from "./candidate";
import { invitationRouter } from "./invitation";
import { organizationRouter } from "./organization";

export const appRouter = createTRPCRouter({
	candidate: candidateRouter,
	organization: organizationRouter,
	invitation: invitationRouter,
});

export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
