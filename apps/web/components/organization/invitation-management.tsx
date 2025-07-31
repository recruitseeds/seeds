"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	CheckCircle,
	Clock,
	Mail,
	Plus,
	RotateCcw,
	Send,
	Trash2,
	Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../ui/table";
import { useTRPC } from "@/trpc/client";

export function InvitationManagement() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
	const [inviteForm, setInviteForm] = useState({
		email: "",
		role: "member" as "admin" | "recruiter" | "hiring_manager" | "member",
	});

	const { data: stats, isLoading: statsLoading } = useQuery({
		...trpc.invitation.getInvitationStats.queryOptions({ days: 30 }),
	});

	const { data: invitations, isLoading: invitationsLoading } = useQuery({
		...trpc.invitation.listInvitations.queryOptions({ includeAccepted: false }),
	});

	const sendInvitationMutation = useMutation({
		...trpc.invitation.sendInvitation.mutationOptions(),
		onSuccess: (data) => {
			toast.success(`Invitation sent to ${inviteForm.email}!`);
			setInviteForm({ email: "", role: "member" });
			setIsInviteDialogOpen(false);
			queryClient.invalidateQueries({
				queryKey: [["invitation", "listInvitations"]],
			});
			queryClient.invalidateQueries({
				queryKey: [["invitation", "getInvitationStats"]],
			});
		},
		onError: (error: any) => {
			toast.error(`Failed to send invitation: ${error.message}`);
		},
	});

	const resendInvitationMutation = useMutation({
		...trpc.invitation.resendInvitation.mutationOptions(),
		onSuccess: () => {
			toast.success("Invitation resent successfully!");
			queryClient.invalidateQueries({
				queryKey: [["invitation", "listInvitations"]],
			});
		},
		onError: (error: any) => {
			toast.error(`Failed to resend invitation: ${error.message}`);
		},
	});

	const cancelInvitationMutation = useMutation({
		...trpc.invitation.cancelInvitation.mutationOptions(),
		onSuccess: () => {
			toast.success("Invitation cancelled successfully!");
			queryClient.invalidateQueries({
				queryKey: [["invitation", "listInvitations"]],
			});
			queryClient.invalidateQueries({
				queryKey: [["invitation", "getInvitationStats"]],
			});
		},
		onError: (error: any) => {
			toast.error(`Failed to cancel invitation: ${error.message}`);
		},
	});

	const handleSendInvitation = () => {
		if (!inviteForm.email.trim()) {
			toast.error("Please enter an email address");
			return;
		}

		sendInvitationMutation.mutate({
			email: inviteForm.email,
			role: inviteForm.role,
		});
	};

	const handleResendInvitation = (
		invitationId: string,
		organizationId: string,
	) => {
		resendInvitationMutation.mutate({
			invitationId,
			organizationId,
		});
	};

	const handleCancelInvitation = (invitationId: string) => {
		if (confirm("Are you sure you want to cancel this invitation?")) {
			cancelInvitationMutation.mutate({
				invitationId,
			});
		}
	};

	const getRoleBadgeColor = (role: string) => {
		switch (role) {
			case "admin":
				return "bg-red-100 text-red-800";
			case "recruiter":
				return "bg-blue-100 text-blue-800";
			case "hiring_manager":
				return "bg-green-100 text-green-800";
			case "member":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const formatRole = (role: string) => {
		return role
			.split("_")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const isExpired = (expiresAt: string) => {
		return new Date() > new Date(expiresAt);
	};

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<Users className="h-4 w-4 text-blue-600" />
							<div>
								<p className="text-2xl font-bold">{stats?.total || 0}</p>
								<p className="text-xs text-gray-600">Total Sent</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<Clock className="h-4 w-4 text-yellow-600" />
							<div>
								<p className="text-2xl font-bold">{stats?.pending || 0}</p>
								<p className="text-xs text-gray-600">Pending</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<CheckCircle className="h-4 w-4 text-green-600" />
							<div>
								<p className="text-2xl font-bold">{stats?.accepted || 0}</p>
								<p className="text-xs text-gray-600">Accepted</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<Mail className="h-4 w-4 text-purple-600" />
							<div>
								<p className="text-2xl font-bold">{stats?.recent || 0}</p>
								<p className="text-xs text-gray-600">This Month</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Invitations Management */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Team Invitations</CardTitle>
							<CardDescription>
								Invite team members to join your organization
							</CardDescription>
						</div>
						<Dialog
							open={isInviteDialogOpen}
							onOpenChange={setIsInviteDialogOpen}
						>
							<DialogTrigger asChild>
								<Button>
									<Plus className="h-4 w-4 mr-2" />
									Invite Member
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Invite Team Member</DialogTitle>
									<DialogDescription>
										Send an invitation to join your organization
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4">
									<div>
										<Label htmlFor="email">Email Address</Label>
										<Input
											id="email"
											type="email"
											placeholder="colleague@company.com"
											value={inviteForm.email}
											onChange={(e) =>
												setInviteForm((prev) => ({
													...prev,
													email: e.target.value,
												}))
											}
										/>
									</div>
									<div>
										<Label htmlFor="role">Role</Label>
										<Select
											value={inviteForm.role}
											onValueChange={(value: any) =>
												setInviteForm((prev) => ({
													...prev,
													role: value,
												}))
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="admin">Admin</SelectItem>
												<SelectItem value="recruiter">Recruiter</SelectItem>
												<SelectItem value="hiring_manager">
													Hiring Manager
												</SelectItem>
												<SelectItem value="member">Member</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
								<DialogFooter>
									<Button
										variant="outline"
										onClick={() => setIsInviteDialogOpen(false)}
									>
										Cancel
									</Button>
									<Button
										onClick={handleSendInvitation}
										disabled={sendInvitationMutation.isPending}
									>
										{sendInvitationMutation.isPending ? (
											<>
												<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
												Sending...
											</>
										) : (
											<>
												<Send className="h-4 w-4 mr-2" />
												Send Invitation
											</>
										)}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				</CardHeader>
				<CardContent>
					{invitationsLoading ? (
						<div className="flex items-center justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						</div>
					) : invitations && invitations.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Email</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Invited By</TableHead>
									<TableHead>Sent</TableHead>
									<TableHead>Expires</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{invitations.map((invitation) => (
									<TableRow key={invitation.id}>
										<TableCell className="font-medium">
											{invitation.email}
										</TableCell>
										<TableCell>
											<Badge className={getRoleBadgeColor(invitation.role)}>
												{formatRole(invitation.role)}
											</Badge>
										</TableCell>
										<TableCell>
											{invitation.inviter_name || "Unknown"}
										</TableCell>
										<TableCell>
											{formatDate(invitation.created_at || "")}
										</TableCell>
										<TableCell>{formatDate(invitation.expires_at)}</TableCell>
										<TableCell>
											{isExpired(invitation.expires_at) ? (
												<Badge variant="destructive">Expired</Badge>
											) : (
												<Badge variant="outline">Pending</Badge>
											)}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end space-x-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														handleResendInvitation(
															invitation.id,
															invitation.organization_id,
														)
													}
													disabled={resendInvitationMutation.isPending}
												>
													<RotateCcw className="h-3 w-3" />
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleCancelInvitation(invitation.id)}
													disabled={cancelInvitationMutation.isPending}
												>
													<Trash2 className="h-3 w-3" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<div className="text-center py-8">
							<Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								No pending invitations
							</h3>
							<p className="text-gray-600 mb-4">
								Start building your team by inviting members to your
								organization.
							</p>
							<Button onClick={() => setIsInviteDialogOpen(true)}>
								<Plus className="h-4 w-4 mr-2" />
								Send First Invitation
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
