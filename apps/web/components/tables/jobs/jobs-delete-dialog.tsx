import { DeleteConfirmationDialog } from "./jobs-delete-confirmation-dialog";

interface JobDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function JobDeleteDialog({
  open,
  onOpenChange,
  jobTitle,
  onConfirm,
  isLoading = false,
}: JobDeleteDialogProps) {
  const description = `This action cannot be undone. This will permanently delete the job posting "${jobTitle}" and all associated applications.`;

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
