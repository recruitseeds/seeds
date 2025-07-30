"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@seeds/ui/button";
import { Input } from "@seeds/ui/input";
import { Label } from "@seeds/ui/label";
import type { InvitationWithInviter } from "@/supabase/queries/invitation";
import { useTRPC } from "@/trpc/client";

interface InvitationAcceptanceFormProps {
	token: string;
	invitation: InvitationWithInviter;
}

export function InvitationAcceptanceForm({
	token,
	invitation,
}: InvitationAcceptanceFormProps) {
	const router = useRouter();
	const trpc = useTRPC();

	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		password: "",
		confirmPassword: "",
	});

	const acceptInvitationMutation = useMutation({
		...trpc.invitation.acceptInvitation.mutationOptions(),
		onSuccess: () => {
			toast.success("Welcome to the team! You can now log in.");
			router.push("/login?message=invitation-accepted");
		},
		onError: (error: any) => {
			toast.error(`Failed to accept invitation: ${error.message}`);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.firstName.trim() || !formData.lastName.trim()) {
			toast.error("Please enter your first and last name");
			return;
		}

		if (formData.password.length < 8) {
			toast.error("Password must be at least 8 characters");
			return;
		}

		if (formData.password !== formData.confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		acceptInvitationMutation.mutate({
			token,
			firstName: formData.firstName,
			lastName: formData.lastName,
			password: formData.password,
		});
	};

	const handleInputChange =
		(field: keyof typeof formData) =>
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setFormData((prev) => ({
				...prev,
				[field]: e.target.value,
			}));
		};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="space-y-4">
				<div className="bg-blue-50 p-4 rounded-lg">
					<div className="flex items-center space-x-2">
						<div className="w-2 h-2 bg-blue-600 rounded-full"></div>
						<p className="text-sm font-medium text-blue-900">
							Invitation Details
						</p>
					</div>
					<div className="mt-2 text-sm text-blue-800">
						<p>
							<strong>Email:</strong> {invitation.email}
						</p>
						<p>
							<strong>Role:</strong>{" "}
							{invitation.role
								.split("_")
								.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
								.join(" ")}
						</p>
						<p>
							<strong>Organization:</strong> {invitation.organization_name}
						</p>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<Label htmlFor="firstName">First Name</Label>
						<Input
							id="firstName"
							type="text"
							value={formData.firstName}
							onChange={handleInputChange("firstName")}
							required
						/>
					</div>
					<div>
						<Label htmlFor="lastName">Last Name</Label>
						<Input
							id="lastName"
							type="text"
							value={formData.lastName}
							onChange={handleInputChange("lastName")}
							required
						/>
					</div>
				</div>

				<div>
					<Label htmlFor="password">Password</Label>
					<Input
						id="password"
						type="password"
						value={formData.password}
						onChange={handleInputChange("password")}
						required
						minLength={8}
					/>
					<p className="text-xs text-gray-600 mt-1">
						Must be at least 8 characters long
					</p>
				</div>

				<div>
					<Label htmlFor="confirmPassword">Confirm Password</Label>
					<Input
						id="confirmPassword"
						type="password"
						value={formData.confirmPassword}
						onChange={handleInputChange("confirmPassword")}
						required
					/>
				</div>
			</div>

			<Button
				type="submit"
				className="w-full"
				disabled={acceptInvitationMutation.isPending}
			>
				{acceptInvitationMutation.isPending ? (
					<>
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
						Creating Account...
					</>
				) : (
					"Accept Invitation & Create Account"
				)}
			</Button>

			<p className="text-xs text-gray-600 text-center">
				By accepting this invitation, you'll create an account and join{" "}
				{invitation.organization_name}
			</p>
		</form>
	);
}
