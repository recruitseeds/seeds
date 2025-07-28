"use client";

import { useMemo, useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@rocicorp/zero/react";
import { useZero } from "@rocicorp/zero/react";
import { useHotkeys } from "react-hotkeys-hook";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircleIcon,
  BriefcaseIcon,
  ClockIcon,
  TrendingUpIcon,
  Plus,
} from "lucide-react";
import type { Schema } from "@/lib/schema";

import { columns } from "./columns";
import { DataTableHeader } from "./data-table-header";
import { DataTableRow } from "./data-table-row";
import { DataTablePagination } from "./pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";

type JobPosting = Schema["tables"]["job_postings"]["Row"];

interface MetricCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: any;
  trend?: "up" | "down" | "neutral";
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = "neutral",
}: MetricCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

interface JobsTableProps {
  organizationId: string;
  initialStatus?: string;
  initialSort?: [string, string];
}

export function JobsTable({
  organizationId,
  initialStatus,
  initialSort,
}: JobsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const z = useZero();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [jobs] = useQuery(
    z.query.job_postings
      .where("organization_id", "=", organizationId)
      .orderBy("created_at", "desc"),
  );

  const createJobMutation = useMutation(
    trpc.organization.createJob.mutationOptions({
      onSuccess: (data) => {
        router.push(`/jobs/create/${data.id}`);
      },
    }),
  );

  const bulkDeleteMutation = useMutation(
    trpc.organization.deleteJob.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        setRowSelection({});
      },
    }),
  );

  const transformedJobs = useMemo(() => {
    if (!jobs) return [];

    return jobs.map((job) => ({
      id: job.id,
      title: job.title,
      department: job.department,
      job_type: job.job_type,
      experience_level: job.experience_level,
      status: job.status,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_type: job.salary_type,
      location: "Remote",
      created_at: job.created_at || "",
      updated_at: job.updated_at,
      hiring_manager_id: job.hiring_manager_id,
      applicant_count: 0,
      organization_id: job.organization_id,
      content: job.content,
      published_at: job.published_at,
    }));
  }, [jobs]);

  const metrics = useMemo(() => {
    const totalJobs = transformedJobs.length;
    const activeJobs = transformedJobs.filter(
      (job) => job.status === "published",
    ).length;
    const draftJobs = transformedJobs.filter(
      (job) => job.status === "draft",
    ).length;

    const publishedJobs = transformedJobs.filter(
      (job) => job.status === "published" && job.published_at,
    );
    const avgTimeOpen =
      publishedJobs.length > 0
        ? publishedJobs.reduce((acc, job) => {
            const publishedDate = new Date(job.published_at!);
            const daysDiff = Math.floor(
              (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24),
            );
            return acc + daysDiff;
          }, 0) / publishedJobs.length
        : 0;

    const jobsRequiringAction =
      draftJobs +
      publishedJobs.filter((job) => {
        const publishedDate = new Date(job.published_at!);
        const daysDiff = Math.floor(
          (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        return daysDiff > 30;
      }).length;

    return {
      totalJobs,
      activeJobs,
      jobsRequiringAction,
      avgTimeOpen: Math.round(avgTimeOpen),
    };
  }, [transformedJobs]);

  const [sorting, setSorting] = useState<SortingState>(
    initialSort
      ? [{ id: initialSort[0], desc: initialSort[1] === "desc" }]
      : [],
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialStatus ? [{ id: "status", value: initialStatus }] : [],
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: transformedJobs,
    columns: columns as any,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const searchTerm =
    (table.getColumn("title")?.getFilterValue() as string) ?? "";
  const statusFilter =
    (table.getColumn("status")?.getFilterValue() as string) ?? "all";

  const handleSearch = (value: string) => {
    table.getColumn("title")?.setFilterValue(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    router.replace(`?${params.toString()}`);
  };

  const handleStatusFilter = (value: string) => {
    const filterValue = value === "all" ? "" : value;
    table.getColumn("status")?.setFilterValue(filterValue);
    const params = new URLSearchParams(searchParams.toString());
    if (value !== "all") {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    router.replace(`?${params.toString()}`);
  };

  const handleCreateJob = () => {
    createJobMutation.mutate({
      title: "Untitled",
      job_type: "full-time",
      status: "draft",
    });
  };

  useHotkeys("mod+j", handleCreateJob, {
    enableOnFormTags: true,
  });

  const selectedRows = Object.keys(rowSelection);
  const hasSelectedRows = selectedRows.length > 0;
  const hasJobs = transformedJobs.length > 0;
  const shouldShowPagination = transformedJobs.length > 10;

  const confirmBulkDelete = async () => {
    for (const rowIndex of selectedRows) {
      const job = transformedJobs[parseInt(rowIndex)];
      if (job) {
        await bulkDeleteMutation.mutateAsync({ id: job.id });
      }
    }
  };

  if (!jobs) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: 8 }).map((_, index) => (
                  <TableHead key={index}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 8 }).map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Jobs"
          value={metrics.totalJobs}
          subtitle={`${metrics.activeJobs} active`}
          icon={BriefcaseIcon}
        />
        <MetricCard
          title="Requiring Action"
          value={metrics.jobsRequiringAction}
          subtitle="Draft + stale postings"
          icon={AlertCircleIcon}
          trend={metrics.jobsRequiringAction > 0 ? "up" : "neutral"}
        />
        <MetricCard
          title="Avg. Time Open"
          value={metrics.avgTimeOpen}
          subtitle="Days since published"
          icon={ClockIcon}
        />
        <MetricCard
          title="This Month"
          value={0}
          subtitle="New applications"
          icon={TrendingUpIcon}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(event) => handleSearch(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="h-8 w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          {hasSelectedRows && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete Selected ({selectedRows.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {selectedRows.length} job
                    posting(s). This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmBulkDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            onClick={handleCreateJob}
            size="sm"
            disabled={createJobMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {hasJobs ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header, index) => (
                      <TableHead
                        key={header.id}
                        className={`
                         ${index === 0 ? "rounded-tl-lg" : ""}
                         ${index === headerGroup.headers.length - 1 ? "rounded-tr-lg" : ""}
                         ${header.column.columnDef.meta?.className || ""}
                       `}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium">No jobs found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Get started by creating your first job posting.
              </p>
              <Button onClick={handleCreateJob} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Job
              </Button>
            </div>
          </div>
        )}
      </div>

      {hasJobs && shouldShowPagination && <DataTablePagination table={table} />}
    </>
  );
}
