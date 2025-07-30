import { Table as ReactTable, flexRender } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Button } from "@seeds/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@seeds/ui/table";
import { DataTablePagination } from "./pagination";

interface JobsTableCoreProps {
  table: ReactTable<any>;
  hasJobs: boolean;
  shouldShowPagination: boolean;
  onCreateJob: () => void;
}

export function JobsTableCore({
  table,
  hasJobs,
  shouldShowPagination,
  onCreateJob,
}: JobsTableCoreProps) {
  if (!hasJobs) {
    return (
      <div className="border overflow-hidden rounded-md">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium">No jobs found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Get started by creating your first job posting.
            </p>
            <Button onClick={onCreateJob} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Job
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border overflow-hidden rounded-md">
        <div className="w-full overflow-x-auto">
          <Table className="w-full min-w-[800px]">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
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
      </div>
      {shouldShowPagination && <DataTablePagination table={table} />}
    </>
  );
}
