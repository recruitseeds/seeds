import { Table as ReactTable } from "@tanstack/react-table";
import { ChevronDown, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@seeds/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@seeds/ui/dropdown-menu";
import { Input } from "@seeds/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@seeds/ui/select";

interface JobsTableToolbarProps {
  table: ReactTable<any>;
  searchTerm: string;
  statusFilter: string;
  hasSelectedRows: boolean;
  selectedRowsCount: number;
  actionsDropdownOpen: boolean;
  setActionsDropdownOpen: (open: boolean) => void;
  onSearch: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onCreateJob: () => void;
  onBulkDeleteClick: () => void;
}

export function JobsTableToolbar({
  table,
  searchTerm,
  statusFilter,
  hasSelectedRows,
  selectedRowsCount,
  actionsDropdownOpen,
  setActionsDropdownOpen,
  onSearch,
  onStatusFilter,
  onCreateJob,
  onBulkDeleteClick,
}: JobsTableToolbarProps) {
  return (
    <div className="flex gap-2 flex-row items-center">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search jobs"
            value={searchTerm}
            onChange={(event) => onSearch(event.target.value)}
            className="pl-9 h-7.5"
          />
        </div>
        <Select value={statusFilter || "all"} onValueChange={onStatusFilter}>
          <SelectTrigger className="w-[180px] h-7.5">
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
          <DropdownMenu
            open={actionsDropdownOpen}
            onOpenChange={setActionsDropdownOpen}
          >
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
                className="text-destructive"
                onClick={onBulkDeleteClick}
                disabled={!hasSelectedRows}
                variant="destructive"
              >
                <Trash2 className="mr-2 size-4" />
                Delete ({selectedRowsCount})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div>
          <Button
            onClick={onCreateJob}
            size="icon"
            className="lg:hidden h-7.5"
            tooltip="Create job"
            tooltipShortcut={["Mod", "J"]}
          >
            <Plus />
            <span className="sr-only">Create Job</span>
          </Button>
          <Button
            onClick={onCreateJob}
            className="hidden lg:flex"
            tooltipShortcut={["Mod", "J"]}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </div>
      </div>
    </div>
  );
}
