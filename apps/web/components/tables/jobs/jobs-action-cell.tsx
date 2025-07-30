import {
  Copy,
  Edit,
  Users,
  EyeOff,
  Archive,
  Trash2,
  Share,
  MoreHorizontal,
  Eye,
  CopyPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { Button } from "@seeds/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@seeds/ui/dropdown-menu";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { JobPost } from "./types";
import { JobDeleteDialog } from "./jobs-delete-dialog";
import { JobShareDialog } from "./jobs-share-dialog";

interface JobActionsCellProps {
  job: JobPost;
}

export function JobActionsCell({ job }: JobActionsCellProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getJobListingQueryKeys = () => {
    return [
      [["organization", "listJobPostings"]],
      [
        ["organization", "listJobPostings"],
        { input: { page: 1, pageSize: 50 } },
      ],
      [
        ["organization", "listJobPostings"],
        { input: { status: "draft", page: 1, pageSize: 50 } },
      ],
      [
        ["organization", "listJobPostings"],
        { input: { status: "published", page: 1, pageSize: 50 } },
      ],
      [
        ["organization", "listJobPostings"],
        { input: { status: "closed", page: 1, pageSize: 50 } },
      ],
    ];
  };

  const deleteMutation = useMutation(
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
      onError: (err, variables, context) => {
        if (context?.previousQueries) {
          context.previousQueries.forEach((data, queryKeyStr) => {
            const queryKey = JSON.parse(queryKeyStr);
            queryClient.setQueryData(queryKey, data);
          });
        }
        console.error("Failed to delete job:", err);
      },
      onSuccess: () => {
        setDropdownOpen(false);
        setShowDeleteDialog(false);
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: [["organization", "listJobPostings"]],
        });
      },
    }),
  );

  const updateStatusMutation = useMutation(
    trpc.organization.updateJobPosting.mutationOptions({
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
              data: old.data.map((j: JobPost) =>
                j.id === variables.id
                  ? {
                      ...j,
                      status: variables.status,
                      updated_at: new Date().toISOString(),
                      ...(variables.status === "published" &&
                      j.status !== "published"
                        ? { published_at: new Date().toISOString() }
                        : {}),
                    }
                  : j,
              ),
            };
          });
        });

        return { previousQueries };
      },
      onError: (err, variables, context) => {
        if (context?.previousQueries) {
          context.previousQueries.forEach((data, queryKeyStr) => {
            const queryKey = JSON.parse(queryKeyStr);
            queryClient.setQueryData(queryKey, data);
          });
        }
        console.error("Failed to update job status:", err);
      },
      onSuccess: () => {
        setDropdownOpen(false);
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: [["organization", "listJobPostings"]],
        });
      },
    }),
  );

  const duplicateJobMutation = useMutation(
    trpc.organization.duplicateJobPosting.mutationOptions({
      onSuccess: (newJob) => {
        setDropdownOpen(false);
        // Navigate and scroll to top
        window.scrollTo(0, 0);
        router.push(`/jobs/create/${newJob.id}`);
      },
      onError: (error) => {
        console.error("Failed to duplicate job:", error);
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: [["organization", "listJobPostings"]],
        });
      },
    }),
  );

  const handleEdit = useCallback(() => {
    // Scroll to top before navigation
    window.scrollTo(0, 0);
    router.push(`/jobs/create/${job.id}`);
  }, [router, job.id]);

  const handleViewApplicants = useCallback(() => {
    window.scrollTo(0, 0);
    router.push(`/jobs/${job.id}/applicants`);
  }, [router, job.id]);

  const handleCopyUrl = useCallback(async () => {
    try {
      const url = `${window.location.origin}/jobs/${job.id}`;
      await navigator.clipboard.writeText(url);
    } catch (error) {
      console.error("Failed to copy URL to clipboard:", error);
    }
  }, [job.id]);

  const handlePublish = useCallback(() => {
    updateStatusMutation.mutate({
      id: job.id,
      status: "published",
    });
  }, [updateStatusMutation, job.id]);

  const handleUnpublish = useCallback(() => {
    updateStatusMutation.mutate({
      id: job.id,
      status: "draft",
    });
  }, [updateStatusMutation, job.id]);

  const handleClose = useCallback(() => {
    updateStatusMutation.mutate({
      id: job.id,
      status: "closed",
    });
  }, [updateStatusMutation, job.id]);

  const handleDuplicate = useCallback(() => {
    duplicateJobMutation.mutate({ id: job.id });
  }, [duplicateJobMutation, job.id]);

  const handleDeleteClick = useCallback(() => {
    setDropdownOpen(false);
    setShowDeleteDialog(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    deleteMutation.mutate({ id: job.id });
  }, [deleteMutation, job.id]);

  const canPublish = job.status === "draft" || job.status === "closed";
  const canUnpublish = job.status === "published";
  const canClose = job.status === "published" || job.status === "draft";

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleViewApplicants}>
            <Users className="mr-2 h-4 w-4" />
            View Applicants ({job.applicant_count || 0})
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyUrl}>
            <Copy className="mr-2 h-4 w-4" />
            Copy URL
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
            <Share className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate}>
            <CopyPlus className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {canPublish && (
            <DropdownMenuItem onClick={handlePublish}>
              <Eye className="mr-2 h-4 w-4" />
              Publish
            </DropdownMenuItem>
          )}
          {canUnpublish && (
            <DropdownMenuItem onClick={handleUnpublish}>
              <EyeOff className="mr-2 h-4 w-4" />
              Unpublish
            </DropdownMenuItem>
          )}
          {canClose && (
            <DropdownMenuItem onClick={handleClose}>
              <Archive className="mr-2 h-4 w-4" />
              Close Posting
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDeleteClick} variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <JobDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        jobTitle={job.title}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />

      <JobShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        job={job}
      />
    </>
  );
}
