import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/db";

type Client = SupabaseClient<Database>;

export async function ensureOrganizationSetup(
	supabase: Client,
	userId: string,
	organizationId: string,
	userEmail: string,
	role: string = "admin",
): Promise<{ success: boolean; error?: string }> {
	console.log("⚠️ ensureOrganizationSetup called (THIS CREATES NEW ORGS):", {
		userId,
		organizationId,
		userEmail,
		role,
	});

	try {
		const { data: existingOrg, error: orgCheckError } = await supabase
			.from("organizations")
			.select("id")
			.eq("id", organizationId)
			.single();

		if (orgCheckError && orgCheckError.code !== "PGRST116") {
			console.error("Error checking organization:", orgCheckError);
			return { success: false, error: orgCheckError.message };
		}

		if (!existingOrg) {
			console.log("⚠️ Creating NEW organization because org not found!");
			const { error: createOrgError } = await supabase
				.from("organizations")
				.insert({
					id: organizationId,
					name: `${userEmail.split("@")[0]}'s Organization`,
					created_at: new Date().toISOString(),
				});

			if (createOrgError) {
				console.error("Error creating organization:", createOrgError);
				return { success: false, error: createOrgError.message };
			}
		}

		const { data: existingOrgUser, error: orgUserCheckError } = await supabase
			.from("organization_users")
			.select("id")
			.eq("user_id", userId)
			.eq("organization_id", organizationId)
			.single();

		if (orgUserCheckError && orgUserCheckError.code !== "PGRST116") {
			console.error("Error checking organization user:", orgUserCheckError);
			return { success: false, error: orgUserCheckError.message };
		}

		if (!existingOrgUser) {
			const { error: createOrgUserError } = await supabase
				.from("organization_users")
				.insert({
					user_id: userId,
					organization_id: organizationId,
					role: role,
					status: "active",
					joined_at: new Date().toISOString(),
					created_at: new Date().toISOString(),
				});

			if (createOrgUserError) {
				console.error("Error creating organization user:", createOrgUserError);
				return { success: false, error: createOrgUserError.message };
			}
		}

		return { success: true };
	} catch (error) {
		console.error("Unexpected error in ensureOrganizationSetup:", error);
		return {
			success: false,
			error: "Unexpected error during organization setup",
		};
	}
}

export async function addUserToExistingOrganization(
	supabase: Client,
	userId: string,
	organizationId: string,
	userEmail: string,
	role: string,
): Promise<{ success: boolean; error?: string }> {
	console.log("🔥 addUserToExistingOrganization called with:", {
		userId,
		organizationId,
		userEmail,
		role,
	});

	try {
		const { data: existingOrg, error: orgCheckError } = await supabase
			.from("organizations")
			.select("id, name")
			.eq("id", organizationId)
			.single();

		console.log("🔍 Organization lookup result:", {
			existingOrg,
			orgCheckError,
		});

		if (orgCheckError || !existingOrg) {
			console.error("Organization not found:", orgCheckError);
			return { success: false, error: "Organization not found" };
		}

		console.log("✅ Found existing organization:", existingOrg.name);

		const { data: existingOrgUser, error: orgUserCheckError } = await supabase
			.from("organization_users")
			.select("id")
			.eq("user_id", userId)
			.eq("organization_id", organizationId)
			.single();

		if (orgUserCheckError && orgUserCheckError.code !== "PGRST116") {
			console.error("Error checking organization user:", orgUserCheckError);
			return { success: false, error: orgUserCheckError.message };
		}

		if (!existingOrgUser) {
			console.log("🔥 Creating organization_users record...");
			const { error: createOrgUserError } = await supabase
				.from("organization_users")
				.insert({
					user_id: userId,
					organization_id: organizationId,
					role: role,
					status: "active",
					email: userEmail,
					joined_at: new Date().toISOString(),
					created_at: new Date().toISOString(),
				});

			if (createOrgUserError) {
				console.error("Error creating organization user:", createOrgUserError);
				return { success: false, error: createOrgUserError.message };
			}
			console.log("✅ Successfully created organization_users record");
		} else {
			console.log("ℹ️ User already exists in organization");
		}

		return { success: true };
	} catch (error) {
		console.error("Unexpected error in addUserToExistingOrganization:", error);
		return {
			success: false,
			error: "Unexpected error during organization setup",
		};
	}
}
