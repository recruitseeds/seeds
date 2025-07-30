import type { Metadata } from "next";
import { Container } from "@/components/container";
import { JobsTable } from "@/components/tables/jobs/index";
import { Button } from "@seeds/ui/button";
import { getServerTRPCCaller, HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Job Postings | Seeds ATS",
};

interface JobsPageProps {
	searchParams: Promise<{
		page?: string;
		search?: string;
		status?: string;
		sort?: string;
	}>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
	const params = await searchParams;
	const caller = await getServerTRPCCaller();

	const page = params.page ? Number.parseInt(params.page, 10) : 1;
	const status = params.status as
		| "draft"
		| "published"
		| "archived"
		| "closed"
		| undefined;
	const sort = params.sort
		? (params.sort.split(",") as [string, string])
		: undefined;

	const jobsData = await caller.organization.listJobPostings({
		page,
		pageSize: 1000,
		status,
	});

	return (
		<Container className="space-y-6 py-8">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Job Postings</h1>
					<p className="text-muted-foreground">
						Manage your organization's job postings and track applications.
					</p>
				</div>

				<HydrateClient>
					<JobsTable
						initialStatus={status}
						initialSort={sort}
						initialJobsData={jobsData}
					/>
				</HydrateClient>
			</div>
		</Container>
	);
}
