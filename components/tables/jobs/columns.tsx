"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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
import { Input } from "@/components/ui/input";

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
  hiring_manager_name?: string | null;
  applicant_count?: number;
  applicantCount?: number;
  organization_id?: string;
  content?: any;
  published_at?: string | null;
}

function ActionsCell({ job }: { job: JobPost }) {
  const router = useRouter();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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

  const handleEdit = () => {
    router.push(`/jobs/create/${job.id}`);
  };

  const handleDuplicate = async () => {
    try {
      console.log("Duplicating job:", job.id);
    } catch (error) {
      console.error("Failed to duplicate job:", error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      console.log("Deleting job:", job.id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Failed to delete job:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareDialog(true);
    setImageLoading(true);
    setImageError(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleEdit();
  };

  const handleDuplicateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleDuplicate();
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={handleMenuClick}
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={handleMenuClick}>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleEditClick}>Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicateClick}>
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShareClick}>Share</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDeleteClick}
            className="text-destructive"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showShareDialog && (
        <DismissibleLayer>
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
                  <div className="rounded-lg border p-4 space-y-2">
                    <h4 className="font-semibold">{job.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {job.company || "Our Company"} •{" "}
                      {job.location || "Location not specified"}
                    </p>
                    {job.salary && (
                      <p className="text-sm font-medium">{job.salary}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Customize image</h3>

                    <div className="space-y-2">
                      <Select
                        value={imageOptions.template}
                        onValueChange={(value) =>
                          updateImageOption(
                            "template",
                            value as "modern" | "minimal" | "corporate",
                          )
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Templates</SelectLabel>
                            <SelectItem value="modern">
                              Modern Gradient
                            </SelectItem>
                            <SelectItem value="minimal">
                              Clean Minimal
                            </SelectItem>
                            <SelectItem value="corporate">
                              Corporate Blue
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium">
                        Include in image
                      </label>

                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <Checkbox
                            checked={imageOptions.title}
                            onCheckedChange={(checked) =>
                              updateImageOption("title", checked)
                            }
                          />
                          <span className="text-sm">Job Title</span>
                        </label>

                        <label className="flex items-center space-x-2">
                          <Checkbox
                            checked={imageOptions.company}
                            onCheckedChange={(checked) =>
                              updateImageOption("company", checked)
                            }
                          />
                          <span className="text-sm">Company Name</span>
                        </label>

                        <label className="flex items-center space-x-2">
                          <Checkbox
                            checked={imageOptions.location}
                            onCheckedChange={(checked) =>
                              updateImageOption("location", checked)
                            }
                          />
                          <span className="text-sm">Location</span>
                        </label>

                        <label className="flex items-center space-x-2">
                          <Checkbox
                            checked={imageOptions.salary}
                            onCheckedChange={(checked) =>
                              updateImageOption("salary", checked)
                            }
                          />
                          <span className="text-sm">Salary Range</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Job link</label>
                    <div className="flex gap-2">
                      <Input value={getJobUrl()} readOnly className="flex-1" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyLink}
                        className="shrink-0"
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

                <div className="flex flex-col justify-center space-y-4 -mt-[70px]">
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

                      {imageLoading && !imageError && (
                        <div className="absolute inset-0 bg-muted flex items-center justify-center">
                          <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Generating preview...
                            </p>
                          </div>
                        </div>
                      )}

                      {imageError && (
                        <div className="absolute inset-0 bg-muted flex items-center justify-center">
                          <div className="text-center">
                            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground mb-2">
                              Preview unavailable
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setImageKey((prev) => prev + 1);
                                setImageLoading(true);
                                setImageError(false);
                              }}
                            >
                              Try Again
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = getOGImageUrl();
                        link.download = `${job.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-job-post.png`;
                        link.click();
                      }}
                      className="flex-1"
                      disabled={imageError}
                    >
                      Download Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            window.location.origin + getOGImageUrl(),
                          );
                        } catch (err) {
                          console.error("Failed to copy image URL:", err);
                        }
                      }}
                      className="flex-1"
                      disabled={imageError}
                    >
                      Copy Image URL
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DismissibleLayer>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Posting</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the job posting "{job.title}" and all
              associated applications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
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
        onClick={(e) => e.stopPropagation()}
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
          <div className="text-sm text-muted-foreground">
            {job.department || "No department"}
          </div>
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
          {status}
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
      return (
        <Badge variant="outline">
          {jobType?.replace("_", "-") || "Not specified"}
        </Badge>
      );
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
      return (
        <div className="text-sm">
          {job.hiring_manager_name || "Not assigned"}
        </div>
      );
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
