"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  Check,
  Copy,
  ExternalLink,
  Facebook,
  ImageIcon,
  Linkedin,
  Loader2,
  MoreHorizontal,
  Twitter,
  X,
  Edit,
  Users,
  EyeOff,
  Archive,
  Trash2,
  Share,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, forwardRef } from "react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DismissibleLayer } from "@/components/ui/dismissible-layer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { DataTableColumnHeader } from "@/components/data-table/column-header";

export interface JobPost {
  id: string;
  title: string;
  company?: string;
  department?: string | null;
  job_type?: string | null;
  experience_level?: string | null;
  status: string;
  salary?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_type?: string | null;
  location?: string | null;
  created_at: string;
  updated_at?: string | null;
  hiring_manager_id?: string | null;
  hiring_manager?: {
    id: string;
    first_name: string;
    last_name?: string;
    email: string;
  } | null;
  applicant_count?: number;
  applicantCount?: number;
  organization_id?: string;
  content?: any;
  published_at?: string | null;
}

// Custom AlertDialogItem component to handle portal conflicts
// Custom AlertDialogItem component to handle portal conflicts
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

function ActionsCell({ job }: { job: JobPost }) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const [imageOptions, setImageOptions] = useState({
    title: true,
    company: true,
    salary: true,
    location: true,
    template: "modern" as "modern" | "minimal" | "corporate",
  });
  const [imageKey, setImageKey] = useState(0);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showShareDialog) {
        setShowShareDialog(false);
      }
    };

    if (showShareDialog) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [showShareDialog]);

  const deleteMutation = useMutation(
    trpc.organization.deleteJobPosting.mutationOptions({
      onMutate: async (variables) => {
        setIsDeleting(true);

        // Cancel any outgoing refetches
        await queryClient.cancelQueries({
          queryKey: ["organization", "listJobPostings"],
        });

        // Snapshot the previous value
        const previousJobs = queryClient.getQueryData([
          "organization",
          "listJobPostings",
        ]);

        // Optimistically remove the job
        queryClient.setQueryData(
          ["organization", "listJobPostings"],
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              data: old.data.filter((j: JobPost) => j.id !== variables.id),
            };
          },
        );

        return { previousJobs };
      },
      onError: (err, variables, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        if (context?.previousJobs) {
          queryClient.setQueryData(
            ["organization", "listJobPostings"],
            context.previousJobs,
          );
        }
        console.error("Failed to delete job:", err);
      },
      onSettled: () => {
        setIsDeleting(false);
        // Always refetch after error or success to ensure we have correct data
        queryClient.invalidateQueries({
          queryKey: ["organization", "listJobPostings"],
        });
      },
    }),
  );

  const updateStatusMutation = useMutation(
    trpc.organization.updateJobPosting.mutationOptions({
      onMutate: async (variables) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({
          queryKey: ["organization", "listJobPostings"],
        });

        // Snapshot the previous value
        const previousJobs = queryClient.getQueryData([
          "organization",
          "listJobPostings",
        ]);

        // Optimistically update the job status
        queryClient.setQueryData(
          ["organization", "listJobPostings"],
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              data: old.data.map((j: JobPost) =>
                j.id === variables.id
                  ? {
                      ...j,
                      status: variables.status,
                      updated_at: new Date().toISOString(),
                      // Update published_at if we're publishing
                      ...(variables.status === "published" &&
                      j.status === "draft"
                        ? { published_at: new Date().toISOString() }
                        : {}),
                    }
                  : j,
              ),
            };
          },
        );

        return { previousJobs };
      },
      onError: (err, variables, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        if (context?.previousJobs) {
          queryClient.setQueryData(
            ["organization", "listJobPostings"],
            context.previousJobs,
          );
        }
        console.error("Failed to update job status:", err);
      },
      onSettled: () => {
        // Always refetch after error or success to ensure we have correct data
        queryClient.invalidateQueries({
          queryKey: ["organization", "listJobPostings"],
        });
      },
    }),
  );

  const getJobUrl = () => {
    return `${window.location.origin}/jobs/${job.id}`;
  };

  const getOGImageUrl = () => {
    const params = new URLSearchParams({
      title: imageOptions.title.toString(),
      company: imageOptions.company.toString(),
      salary: imageOptions.salary.toString(),
      location: imageOptions.location.toString(),
      template: imageOptions.template,
      v: imageKey.toString(),
    });
    return `/api/job/${job.id}/og?${params.toString()}`;
  };

  const updateImageOption = (key: keyof typeof imageOptions, value: any) => {
    setImageOptions((prev) => ({ ...prev, [key]: value }));
    setImageKey((prev) => prev + 1);
    setImageLoading(true);
    setImageError(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    console.error("Failed to load OG image preview for job:", job.id);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getJobUrl());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleShare = (platform: string) => {
    const jobUrl = getJobUrl();
    const shareText = `Check out this job opportunity: ${job.title} at ${job.company || "Our Company"}`;

    let shareUrl = "";
    switch (platform) {
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(jobUrl)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(jobUrl)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  const handleEdit = useCallback(() => {
    router.push(`/jobs/create/${job.id}`);
  }, [router, job.id]);

  const handleViewApplicants = useCallback(() => {
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

  const handleDelete = useCallback(() => {
    deleteMutation.mutate({ id: job.id });
  }, [deleteMutation, job.id]);

  const canUnpublish = job.status === "published";
  const canClose = job.status === "published" || job.status === "draft";

  return (
    <>
      <DropdownMenu>
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

          <DropdownMenuSeparator />

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

          <AlertDialogItem
            triggerChildren={
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            }
            className="text-destructive"
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  job posting "{job.title}" and all associated applications.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showShareDialog && (
        <DismissibleLayer onDismiss={() => setShowShareDialog(false)}>
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="fixed inset-0 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
              onClick={() => setShowShareDialog(false)}
            />

            <div
              className="relative bg-background border rounded-lg p-4 sm:p-6 w-full max-w-4xl mx-4 shadow-lg z-50 max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "900px" }}
            >
              <button
                onClick={() => setShowShareDialog(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-10"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>

              <div className="mb-6">
                <h2 className="text-lg font-semibold leading-none tracking-tight">
                  Share Job Posting
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Customize and share this job posting on social media.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Template</label>
                    <Select
                      value={imageOptions.template}
                      onValueChange={(value) =>
                        updateImageOption("template", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      Include in preview
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="title"
                          checked={imageOptions.title}
                          onCheckedChange={(checked) =>
                            updateImageOption("title", checked)
                          }
                        />
                        <label htmlFor="title" className="text-sm">
                          Job title
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="company"
                          checked={imageOptions.company}
                          onCheckedChange={(checked) =>
                            updateImageOption("company", checked)
                          }
                        />
                        <label htmlFor="company" className="text-sm">
                          Company name
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="salary"
                          checked={imageOptions.salary}
                          onCheckedChange={(checked) =>
                            updateImageOption("salary", checked)
                          }
                        />
                        <label htmlFor="salary" className="text-sm">
                          Salary range
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="location"
                          checked={imageOptions.location}
                          onCheckedChange={(checked) =>
                            updateImageOption("location", checked)
                          }
                        />
                        <label htmlFor="location" className="text-sm">
                          Location
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Share URL</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={getJobUrl()}
                        className="flex-1 px-3 py-2 text-sm border border-input bg-background rounded-md"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyLink}
                        className="px-3"
                      >
                        {copySuccess ? <Check /> : <Copy />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Share on social media
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare("linkedin")}
                        className="justify-start"
                      >
                        <Linkedin className="h-4 w-4 mr-2" />
                        Share on LinkedIn
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare("twitter")}
                        className="justify-start"
                      >
                        <Twitter className="h-4 w-4 mr-2" />
                        Share on Twitter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare("facebook")}
                        className="justify-start"
                      >
                        <Facebook className="h-4 w-4 mr-2" />
                        Share on Facebook
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(getJobUrl(), "_blank")}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Public Page
                  </Button>
                </div>

                <div className="flex flex-col justify-center space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Preview</label>
                    <p className="text-xs text-muted-foreground">
                      This is how your job posting will appear when shared on
                      social media.
                    </p>
                  </div>

                  <div className="border rounded-lg overflow-hidden bg-muted/50">
                    <div className="aspect-[1200/630] relative">
                      {!imageError && (
                        <img
                          key={imageKey}
                          src={getOGImageUrl()}
                          alt="Job posting preview"
                          className={`w-full h-full object-cover transition-opacity duration-200 ${
                            imageLoading ? "opacity-0" : "opacity-100"
                          }`}
                          onLoad={handleImageLoad}
                          onError={handleImageError}
                        />
                      )}

                      {(imageLoading || imageError) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                          {imageLoading ? (
                            <div className="flex items-center space-x-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm text-muted-foreground">
                                Loading preview...
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center space-y-2">
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                Preview unavailable
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DismissibleLayer>
      )}
    </>
  );
}

function formatDisplayText(text: string | null | undefined): string {
  if (!text) return "Not specified";

  return text
    .split(/[-_\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

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
      const hiringManager = job.hiring_manager;

      if (!hiringManager) {
        return (
          <div className="text-sm text-muted-foreground">Not assigned</div>
        );
      }

      const fullName = hiringManager.last_name
        ? `${hiringManager.first_name} ${hiringManager.last_name}`
        : hiringManager.first_name;

      return <div className="text-sm">{fullName}</div>;
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
      return <ActionsCell job={job} />;
    },
    enableSorting: false,
    enableHiding: false,
  },
];
