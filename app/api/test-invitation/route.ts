import { NextResponse } from "next/server";
import { createClient } from "@/supabase/client/server";
import { createCallerFactory } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

export async function GET() {
	try {
		console.log("=== Testing tRPC Invitation Router ===");

		const supabase = await createClient();
		const context = {
			session: null,
			user: null,
			userRole: undefined,
			organizationId: undefined,
			supabase,
		};

		const createCaller = createCallerFactory(appRouter);
		const caller = createCaller(context);

		console.log("✅ Server caller created successfully");

		const availableRouters = Object.keys(caller);
		console.log("📋 Available routers:", availableRouters);

		const routerChecks = {
			organization: "organization" in caller,
			candidate: "candidate" in caller,
			invitation: "invitation" in caller,
		};

		console.log("🔍 Router existence check:", routerChecks);

		if ("invitation" in caller) {
			const invitationMethods = Object.keys(caller.invitation);
			console.log("📧 Invitation router methods:", invitationMethods);

			const expectedMethods = [
				"sendInvitation",
				"sendBulkInvitations",
				"listInvitations",
				"getInvitationStats",
				"resendInvitation",
				"cancelInvitation",
				"getInvitationByToken",
				"acceptInvitation",
			];

			const methodChecks = expectedMethods.reduce(
				(acc, method) => {
					acc[method] = invitationMethods.includes(method);
					return acc;
				},
				{} as Record<string, boolean>,
			);

			console.log("🎯 Method availability:", methodChecks);
		}

		const testResults: Record<string, any> = {};

		try {
			await caller.organization.listJobPostings({ page: 1, pageSize: 10 });
		} catch (error: any) {
			testResults.organization = {
				expectedError: error.code === "UNAUTHORIZED",
				actualError: error.code,
				message: error.message,
			};
		}

		try {
			await caller.invitation.getInvitationStats({ days: 30 });
		} catch (error: any) {
			testResults.invitation = {
				expectedError: error.code === "UNAUTHORIZED",
				actualError: error.code,
				message: error.message,
			};
		}

		try {
			await caller.invitation.listInvitations({ includeAccepted: false });
		} catch (error: any) {
			testResults.listInvitations = {
				expectedError: error.code === "UNAUTHORIZED",
				actualError: error.code,
				message: error.message,
			};
		}

		console.log("🧪 Test results:", testResults);

		const allTestsPassed = Object.values(testResults).every(
			(result) => result.expectedError === true,
		);

		return NextResponse.json({
			success: allTestsPassed,
			message: allTestsPassed
				? "✅ All tRPC routers are properly configured!"
				: "❌ Some routers have configuration issues",
			details: {
				availableRouters,
				routerChecks,
				testResults,
				invitationRouterExists: "invitation" in caller,
				invitationMethods:
					"invitation" in caller ? Object.keys(caller.invitation) : [],
			},
		});
	} catch (error: any) {
		console.error("❌ Server test error:", error);
		return NextResponse.json(
			{
				success: false,
				error: error.message,
				stack: error.stack,
				type: "SETUP_ERROR",
			},
			{ status: 500 },
		);
	}
}
