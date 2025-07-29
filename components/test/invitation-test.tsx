"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";

export function InvitationTest() {
	const trpc = useTRPC();
	const [loading, setLoading] = useState(false);

	const debugTRPC = () => {
		console.log("=== tRPC Debug Info ===");
		console.log("Full tRPC object:", trpc);
		console.log("Available routers:", Object.keys(trpc));
		console.log("Organization router exists:", !!trpc.organization);
		console.log("Candidate router exists:", !!trpc.candidate);
		console.log("Invitation router exists:", !!trpc.invitation);

		if (trpc.invitation) {
			console.log("Invitation router methods:", Object.keys(trpc.invitation));
			console.log("sendInvitation exists:", !!trpc.invitation.sendInvitation);
		}

		toast.success("Debug info logged to console");
	};

	const testOrganization = async () => {
		try {
			console.log("Testing organization router...");
			const result = await trpc.organization.listJobPostings.query({
				page: 1,
				pageSize: 10,
			});
			console.log("Organization router works:", result);
			toast.success("Organization router works!");
		} catch (error) {
			console.error("Organization router error:", error);
			toast.error(`Organization error: ${error.message}`);
		}
	};

	const testInvitation = async () => {
		setLoading(true);
		try {
			console.log("Testing invitation router...");
			console.log("trpc.invitation:", trpc.invitation);

			if (!trpc.invitation) {
				throw new Error("Invitation router not found");
			}

			if (!trpc.invitation.sendInvitation) {
				throw new Error("sendInvitation method not found");
			}

			const result = await trpc.invitation.sendInvitation.mutate({
				email: "test@example.com",
				role: "recruiter",
				organizationId: "test-org-id", // Replace with real org ID
			});

			toast.success(`Invitation sent! Email sent: ${result.emailSent}`);
			console.log("Invitation result:", result);
		} catch (error) {
			toast.error(`Failed to send invitation: ${error.message}`);
			console.error("Invitation error:", error);
		} finally {
			setLoading(false);
		}
	};

	const testServerSide = async () => {
		try {
			console.log("Testing server-side invitation router...");
			const response = await fetch("/api/test-invitation");
			const result = await response.json();

			console.log("Server test result:", result);

			if (result.success) {
				toast.success("Server-side invitation router works!");
			} else {
				toast.error(`Server test failed: ${result.error}`);
			}
		} catch (error) {
			console.error("Server test error:", error);
			toast.error(`Server test error: ${error.message}`);
		}
	};

	return (
		<div className="border rounded-lg p-4 bg-muted/20">
			<h3 className="font-semibold mb-4">🧪 Invitation System Debug</h3>
			<div className="flex gap-2 flex-wrap">
				<Button onClick={debugTRPC} variant="outline" size="sm">
					Debug tRPC
				</Button>

				<Button onClick={testServerSide} variant="outline" size="sm">
					Test Server Side
				</Button>

				<Button onClick={testOrganization} variant="outline" size="sm">
					Test Organization
				</Button>

				<Button
					onClick={testInvitation}
					disabled={loading}
					variant="outline"
					size="sm"
				>
					{loading ? "Sending..." : "Test Invitation"}
				</Button>
			</div>
			<p className="text-xs text-muted-foreground mt-2">
				Check browser console for detailed debug info.
			</p>
		</div>
	);
}
