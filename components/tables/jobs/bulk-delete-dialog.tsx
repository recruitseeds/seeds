import { DeleteConfirmationDialog } from "./jobs-delete-confirmation-dialog";

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isLoading = false,
}: BulkDeleteDialogProps) {
  const description = `This will permanently delete ${selectedCount} job posting${
    selectedCount === 1 ? "" : "s"
  }. This action cannot be undone and will permanently delete the job posting${
    selectedCount === 1 ? "" : "s"
  } and all associated applications.`;

  return (
    <DeleteConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      description={description}
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}
