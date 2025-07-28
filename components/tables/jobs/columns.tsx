"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { JobActionsCell } from "./jobs-action-cell";
import type { JobPost } from "./types";
import { formatDisplayText } from "./utils";

export type { JobPost };

export const columns: ColumnDef<JobPost>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Job Title" />
    ),
    cell: ({ row }) => {
      const job = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{job.title}</div>
          {job.department && (
            <div className="text-sm text-muted-foreground">
              {job.department}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === "published"
              ? "default"
              : status === "draft"
                ? "secondary"
                : status === "closed"
                  ? "destructive"
                  : "outline"
          }
        >
          {formatDisplayText(status)}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "job_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const jobType = row.getValue("job_type") as string;
      return <Badge variant="outline">{formatDisplayText(jobType)}</Badge>;
    },
  },
  {
    id: "location",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Location" />
    ),
    cell: ({ row }) => {
      const job = row.original;
      return <div className="text-sm">{job.location || "Remote"}</div>;
    },
  },
  {
    id: "applicants",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Applicants" />
    ),
    cell: ({ row }) => {
      const job = row.original;
      const applicantCount = job.applicant_count ?? job.applicantCount ?? 0;
      return <div className="text-sm font-medium">{applicantCount}</div>;
    },
  },
  {
    id: "hiring_manager",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Hiring Manager" />
    ),
    cell: ({ row }) => {
      const job = row.original;

      if (!job.hiring_manager_name) {
        return (
          <div className="text-sm text-muted-foreground">Not assigned</div>
        );
      }

      return <div className="text-sm">{job.hiring_manager_name}</div>;
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date Posted" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string;
      return (
        <div className="text-sm">{new Date(date).toLocaleDateString()}</div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const job = row.original;
      return <JobActionsCell job={job} />;
    },
    enableSorting: false,
    enableHiding: false,
  },
];
