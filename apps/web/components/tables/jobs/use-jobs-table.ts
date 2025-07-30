import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@/trpc/routers/_app";
import { columns, type JobPost } from "./columns";

interface UseJobsTableProps {
  initialJobsData?: RouterOutputs["organization"]["listJobPostings"];
  initialStatus?: "draft" | "published" | "archived" | "closed";
  initialSort?: [string, string];
}

export function useJobsTable({
  initialJobsData,
  initialStatus,
  initialSort,
}: UseJobsTableProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const queryInput = {
    status: initialStatus,
    page: 1,
    pageSize: 1000,
  };

  const queryOptionsObj = trpc.organization.listJobPostings.queryOptions(
    queryInput,
    initialJobsData ? { initialData: initialJobsData } : undefined,
  );

  const { data, isLoading } = useQuery(queryOptionsObj);

  const jobs = useMemo(() => {
    return data?.data ?? [];
  }, [data]);

  const getJobListingQueryKeys = () => {
    return [
      trpc.organization.listJobPostings.queryKey(),
      trpc.organization.listJobPostings.queryKey({
        page: 1,
        pageSize: 1000,
      }),
      trpc.organization.listJobPostings.queryKey({
        status: "draft",
        page: 1,
        pageSize: 1000,
      }),
      trpc.organization.listJobPostings.queryKey({
        status: "published",
        page: 1,
        pageSize: 1000,
      }),
      trpc.organization.listJobPostings.queryKey({
        status: "closed",
        page: 1,
        pageSize: 1000,
      }),
    ];
  };

  const bulkDeleteMutation = useMutation(
    trpc.organization.deleteJobPosting.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: trpc.organization.listJobPostings.queryKey(),
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
        setActionsDropdownOpen(false);
        setShowBulkDeleteDialog(false);
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
          queryKey: trpc.organization.listJobPostings.queryKey(),
        });
      },
    }),
  );

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
      totalApplications: jobs.reduce(
        (sum, job) => sum + (job.applicant_count || 0),
        0,
      ),
    };
  }, [jobs]);

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
    router.push("/jobs/create");
  };

  const handleBulkDeleteClick = () => {
    setActionsDropdownOpen(false);
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    const selectedRows = Object.keys(rowSelection);
    for (const rowIndex of selectedRows) {
      const job = jobs[parseInt(rowIndex)];
      if (job) {
        await bulkDeleteMutation.mutateAsync({ id: job.id });
      }
    }
  };

  useHotkeys("mod+j", handleCreateJob, {
    enableOnFormTags: true,
  });

  const searchTerm =
    (table.getColumn("title")?.getFilterValue() as string) ?? "";
  const statusFilter =
    (table.getColumn("status")?.getFilterValue() as string) ?? "all";
  const selectedRows = Object.keys(rowSelection);
  const hasSelectedRows = selectedRows.length > 0;
  const hasJobs = jobs.length > 0;
  const shouldShowPagination = jobs.length > 10;

  return {
    jobs,
    metrics,
    isLoading,
    table,
    searchTerm,
    statusFilter,
    selectedRows,
    hasSelectedRows,
    rowSelection,
    setRowSelection,
    actionsDropdownOpen,
    setActionsDropdownOpen,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
    hasJobs,
    shouldShowPagination,
    handleSearch,
    handleStatusFilter,
    handleCreateJob,
    handleBulkDeleteClick,
    confirmBulkDelete,
    bulkDeleteMutation,
  };
}
