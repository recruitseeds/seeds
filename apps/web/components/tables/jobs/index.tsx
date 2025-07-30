"use client";

import type { RouterOutputs } from "@/trpc/routers/_app";
import { useJobsTable } from "./use-jobs-table";
import { JobMetrics } from "./jobs-metrics";
import { JobsTableToolbar } from "./jobs-toolbar";
import { JobsTableCore } from "./jobs-table-core";
import { BulkDeleteDialog } from "./bulk-delete-dialog";

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

export function JobsTable(props: JobsTableProps) {
  const {
    metrics,
    table,
    searchTerm,
    statusFilter,
    hasSelectedRows,
    selectedRows,
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
  } = useJobsTable({
    initialJobsData: hasData(props) ? props.initialJobsData : undefined,
    initialStatus: props.initialStatus,
    initialSort: props.initialSort,
  });

  return (
    <>
      <JobMetrics metrics={metrics} />

      <JobsTableToolbar
        table={table}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        hasSelectedRows={hasSelectedRows}
        selectedRowsCount={selectedRows.length}
        actionsDropdownOpen={actionsDropdownOpen}
        setActionsDropdownOpen={setActionsDropdownOpen}
        onSearch={handleSearch}
        onStatusFilter={handleStatusFilter}
        onCreateJob={handleCreateJob}
        onBulkDeleteClick={handleBulkDeleteClick}
      />

      <JobsTableCore
        table={table}
        hasJobs={hasJobs}
        shouldShowPagination={shouldShowPagination}
        onCreateJob={handleCreateJob}
      />

      <BulkDeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        selectedCount={selectedRows.length}
        onConfirm={confirmBulkDelete}
        isLoading={bulkDeleteMutation.isPending}
      />
    </>
  );
}
