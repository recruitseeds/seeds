"use client";

import { useHotkeys } from "react-hotkeys-hook";
import { Container } from "@/components/container";
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  Plus,
  Search,
  Trash2,
  BriefcaseIcon,
  ClockIcon,
  AlertCircleIcon,
  TrendingUpIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, forwardRef } from "react";

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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@/trpc/routers/_app";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { columns, type JobPost } from "./columns";
import { DataTablePagination } from "./pagination";

interface JobsTablePropsWithData {
  initialJobsData: RouterOutputs["organization"]["listJobPostings"];
  initialStatus?: "draft" | "published" | "archived" | "closed";
  initialSort?: [string, string];
}

interface JobsTablePropsWithoutData {
  initialStatus?: "draft" | "published" | "archived" | "closed";
  initialSort?: [string, string];
}

type JobsTableProps = JobsTablePropsWithData | JobsTablePropsWithoutData;

function hasData(props: JobsTableProps): props is JobsTablePropsWithData {
  return "initialJobsData" in props;
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p
            className={`text-xs ${
              trend === "up"
                ? "text-green-600"
                : trend === "down"
                  ? "text-red-600"
                  : "text-muted-foreground"
            }`}
          >
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

const AlertDialogItem = forwardRef<
  React.ElementRef<typeof DropdownMenuItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuItem> & {
    triggerChildren: React.ReactNode;
    onSelect?: (event: Event) => void;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
  }
>(
  (
    { triggerChildren, children, onSelect, onOpenChange, ...itemProps },
    forwardedRef,
  ) => {
    return (
      <AlertDialog onOpenChange={onOpenChange}>
        <AlertDialogTrigger asChild>
          <DropdownMenuItem
            {...itemProps}
            ref={forwardedRef}
            onSelect={(event) => {
              event.preventDefault();
              onSelect?.(event);
            }}
          >
            {triggerChildren}
          </DropdownMenuItem>
        </AlertDialogTrigger>
        {children}
      </AlertDialog>
    );
  },
);

AlertDialogItem.displayName = "AlertDialogItem";

export function JobsTable(props: JobsTableProps) {
  const { initialStatus, initialSort } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const queryInput = {
    status: initialStatus,
    page: 1,
    pageSize: 50,
  };

  const queryOptionsObj = trpc.organization.listJobPostings.queryOptions(
    queryInput,
    hasData(props) ? { initialData: props.initialJobsData } : undefined,
  );

  const { data, isLoading } = useQuery(queryOptionsObj);

  const createJobMutation = useMutation(
    trpc.organization.createJobPosting.mutationOptions({
      onSuccess: (newJob) => {
        router.push(`/jobs/create/${newJob.id}`);
      },
      onError: (error) => {
        console.error("Failed to create job:", error);
      },
    }),
  );

  const getJobListingQueryKeys = () => {
    return [
      trpc.organization.listJobPostings.queryFilter(),
      trpc.organization.listJobPostings.queryFilter({ page: 1, pageSize: 50 }),
      trpc.organization.listJobPostings.queryFilter({
        status: "draft",
        page: 1,
        pageSize: 50,
      }),
      trpc.organization.listJobPostings.queryFilter({
        status: "published",
        page: 1,
        pageSize: 50,
      }),
      trpc.organization.listJobPostings.queryFilter({
        status: "closed",
        page: 1,
        pageSize: 50,
      }),
    ];
  };

  const bulkDeleteMutation = useMutation(
    trpc.organization.deleteJobPosting.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: [["organization", "listJobPostings"]],
        });

        const previousQueries = new Map();

        getJobListingQueryKeys().forEach((queryKey) => {
          const data = queryClient.getQueryData(queryKey);
          if (data) {
            previousQueries.set(JSON.stringify(queryKey), data);
          }
        });

        getJobListingQueryKeys().forEach((queryKey) => {
          queryClient.setQueryData(queryKey, (old: any) => {
            if (!old?.data) return old;
            return {
              ...old,
              data: old.data.filter((j: JobPost) => j.id !== variables.id),
              count: old.count ? old.count - 1 : old.count,
            };
          });
        });

        return { previousQueries };
      },
      onSuccess: () => {
        setRowSelection({});
      },
      onError: (error, variables, context) => {
        if (context?.previousQueries) {
          context.previousQueries.forEach((data, queryKeyStr) => {
            const queryKey = JSON.parse(queryKeyStr);
            queryClient.setQueryData(queryKey, data);
          });
        }
        console.error("Failed to delete jobs:", error);
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: [["organization", "listJobPostings"]],
        });
      },
    }),
  );

  const jobs = useMemo(() => {
    return data?.data ?? [];
  }, [data]);

  const metrics = useMemo(() => {
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter((job) => job.status === "published").length;
    const draftJobs = jobs.filter((job) => job.status === "draft").length;

    const publishedJobs = jobs.filter(
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
  }, [jobs]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: jobs,
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
  const hasJobs = jobs.length > 0;
  const shouldShowPagination = jobs.length > 10;

  const confirmBulkDelete = async () => {
    for (const rowIndex of selectedRows) {
      const job = jobs[parseInt(rowIndex)];
      if (job) {
        await bulkDeleteMutation.mutateAsync({ id: job.id });
      }
    }
  };

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
          value={`${metrics.avgTimeOpen}d`}
          subtitle="Published to offer"
          icon={ClockIcon}
        />
        <MetricCard
          title="Total Applications"
          value={jobs.reduce((sum, job) => sum + (job.applicant_count || 0), 0)}
          subtitle="Across all jobs"
          icon={TrendingUpIcon}
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(event) => handleSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter || "all"}
            onValueChange={handleStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <div className="hidden lg:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden lg:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={!hasSelectedRows}
                  className="w-full sm:w-auto"
                >
                  Actions <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <AlertDialogItem
                  triggerChildren={
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete ({selectedRows.length})
                    </>
                  }
                  className="text-destructive"
                  disabled={!hasSelectedRows}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete {selectedRows.length} job
                        posting{selectedRows.length === 1 ? "" : "s"}? This
                        action cannot be undone and will permanently delete the
                        job posting
                        {selectedRows.length === 1 ? "" : "s"} and all
                        associated applications.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={confirmBulkDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialogItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <Button
              onClick={handleCreateJob}
              size="icon"
              tooltip="Create job"
              tooltipShortcut={["Mod", "J"]}
              className="lg:hidden h-7.5"
            >
              <Plus />
              <span className="sr-only">Create Job</span>
            </Button>

            <Button
              onClick={handleCreateJob}
              className="hidden lg:flex"
              tooltipShortcut={["Mod", "J"]}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Job
            </Button>
          </div>
        </div>
      </div>

      <div className="border overflow-hidden rounded-md">
        {hasJobs ? (
          <div className="w-full overflow-x-auto">
            <Table className="w-full min-w-[800px]">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="hover:bg-transparent"
                  >
                    {headerGroup.headers.map((header, index) => (
                      <TableHead
                        key={header.id}
                        className={`
                         bg-muted/50 px-4 py-3
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
