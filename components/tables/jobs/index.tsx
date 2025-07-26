"use client";

import { useHotkeys } from "react-hotkeys-hook";
import { getShortcutKeySymbol } from "@/components/ui/keyboard-shortcut";
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
import { ChevronDown, Plus, Search, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@/trpc/routers/_app";
import { useMutation, useQuery } from "@tanstack/react-query";

import { columns } from "./columns";
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

export function JobsTable(props: JobsTableProps) {
  const { initialStatus, initialSort } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  const trpc = useTRPC();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const jobs = useMemo(() => {
    return data?.data ?? [];
  }, [data]);

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
    if (filterValue) {
      params.set("status", filterValue);
    } else {
      params.delete("status");
    }
    router.replace(`?${params.toString()}`);
  };

  const handleCreateJob = () => {
    router.push("/jobs/create");
  };

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelectedRows = selectedRows.length > 0;

  const handleBulkDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmBulkDelete = () => {
    console.log(
      "Deleting jobs:",
      selectedRows.map((row) => row.original.id),
    );
    setShowDeleteDialog(false);
    setRowSelection({});
  };

  const hasJobs = jobs.length > 0;
  const isLoadingContent = isLoading || createJobMutation.isPending;
  const totalJobs = table.getFilteredRowModel().rows.length;

  const createJobShortcut = ["mod", "j"].map(
    (key) => getShortcutKeySymbol(key).text,
  );

  useHotkeys(
    "meta+j,ctrl+j",
    () => {
      handleCreateJob();
    },
    {
      enableOnFormTags: true,
    },
  );

  if (isLoadingContent) {
    return <div>Loading...</div>;
  }

  return (
    <Container className="px-0 sm:px-4" fullWidth>
      <div className="space-y-4">
        <div className="flex gap-2 px-2 sm:px-0">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 !h-7.5"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Select
              value={statusFilter === "" ? "all" : statusFilter}
              onValueChange={handleStatusFilter}
            >
              <SelectTrigger className="w-full h-7.5 gap-3">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <div className="hidden lg:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
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
                    Actions <ChevronDown className="ml-2 size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleBulkDelete}
                    className="text-destructive"
                    disabled={!hasSelectedRows}
                    variant="destructive"
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete ({selectedRows.length})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <Button
                onClick={handleCreateJob}
                size="icon"
                tooltip="Create job"
                tooltipShortcut={createJobShortcut}
                className="lg:hidden h-7.5"
              >
                <Plus />
                <span className="sr-only">Create Job</span>
              </Button>

              <Button
                onClick={handleCreateJob}
                className="hidden lg:flex"
                tooltipShortcut={createJobShortcut}
              >
                <Plus className="mr-2 size-4" />
                Create Job
              </Button>
            </div>
          </div>
        </div>

        <div className="border overflow-hidden rounded-none sm:rounded-md">
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
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row, rowIndex) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="hover:bg-muted/50"
                      >
                        {row.getVisibleCells().map((cell, cellIndex) => (
                          <TableCell
                            key={cell.id}
                            className={`
                             px-4 py-3
                             ${
                               rowIndex ===
                                 table.getRowModel().rows.length - 1 &&
                               cellIndex === 0
                                 ? "rounded-bl-lg"
                                 : ""
                             }
                             ${
                               rowIndex ===
                                 table.getRowModel().rows.length - 1 &&
                               cellIndex === row.getVisibleCells().length - 1
                                 ? "rounded-br-lg"
                                 : ""
                             }
                             ${cell.column.columnDef.meta?.className || ""}
                           `}
                            onClick={
                              cell.column.id === "select" ||
                              cell.column.id === "actions"
                                ? undefined
                                : () =>
                                    router.push(
                                      `/jobs/create/${row.original.id}`,
                                    )
                            }
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={table.getAllColumns().length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="mx-auto max-w-lg py-12 text-center">
              <h3 className="text-lg font-semibold">No jobs yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first job posting.
              </p>
              <Button onClick={handleCreateJob}>
                <Plus className="mr-2 size-4" />
                Create Job
              </Button>
            </div>
          )}
        </div>

        {hasJobs && totalJobs > 10 && <DataTablePagination table={table} />}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Jobs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRows.length} job
              {selectedRows.length === 1 ? "" : "s"}? This action cannot be
              undone and will permanently delete the job posting
              {selectedRows.length === 1 ? "" : "s"}
              and all associated applications.
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
      </AlertDialog>
    </Container>
  );
}
