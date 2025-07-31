import { initTRPC, TRPCError } from "@trpc/server";
import { cache } from "react";
import superjson from "superjson";
import { createClient } from "@seeds/supabase/client/server";

interface UserMetadata {
	role?: "candidate" | "organization";
	organization_id?: string;
}

export const createTRPCContext = cache(async () => {
	const supabase = await createClient();
	const {
		data: { session },
	} = await supabase.auth.getSession();

	let userRole: UserMetadata["role"] | undefined;
	let organizationId: string | undefined;

	if (session?.user?.user_metadata) {
		const metadata = session.user.user_metadata as UserMetadata;
		userRole = metadata.role;

		if (userRole === "organization") {
			organizationId = metadata.organization_id;
		}
	}

	return {
		session,
		user: session?.user,
		userRole,
		organizationId,
		supabase,
	};
});

const t = initTRPC
	.context<Awaited<ReturnType<typeof createTRPCContext>>>()
	.create({
		transformer: superjson,
		errorFormatter({ shape }) {
			return shape;
		},
	});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

export const protectedProcedure = t.procedure.use(async (opts) => {
	const { session, user } = opts.ctx;

	if (!session || !user) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
	}

	return opts.next({
		ctx: {
			...opts.ctx,
			session: session,
			user: user,
		},
	});
});

export const candidateProcedure = protectedProcedure.use(async (opts) => {
	const { userRole } = opts.ctx;

	if (userRole !== "candidate") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Access restricted to candidates.",
		});
	}
	return opts.next(opts);
});

export const organizationProcedure = protectedProcedure.use(async (opts) => {
	const { userRole, organizationId, user, supabase } = opts.ctx;

	if (userRole !== "organization") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Access restricted to organization representatives.",
		});
	}

	let finalOrganizationId = organizationId;

	if (!finalOrganizationId) {
		const { data: orgUser, error } = await supabase
			.from("organization_users")
			.select("organization_id")
			.eq("user_id", user.id)
			.single();

		if (error) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message:
					"Organization information is not fully set up for this account.",
			});
		}

		if (orgUser?.organization_id) {
			finalOrganizationId = orgUser.organization_id;
		}
	}

	if (!finalOrganizationId) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: "Organization information is not fully set up for this account.",
		});
	}

	return opts.next({
		ctx: {
			...opts.ctx,
			organizationId: finalOrganizationId,
		},
	});
});
