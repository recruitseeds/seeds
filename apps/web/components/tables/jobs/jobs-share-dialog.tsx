import {
  Check,
  Copy,
  ExternalLink,
  Facebook,
  ImageIcon,
  Linkedin,
  Loader2,
  Twitter,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@seeds/ui/button";
import { Checkbox } from "@seeds/ui/checkbox";
import { DismissibleLayer } from "@seeds/ui/dismissible-layer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@seeds/ui/select";
import type { JobPost } from "./types";

interface JobShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobPost;
}

export function JobShareDialog({
  open,
  onOpenChange,
  job,
}: JobShareDialogProps) {
  const [copySuccess, setCopySuccess] = useState(false);
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
      if (event.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onOpenChange]);

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

  if (!open) return null;

  return (
    <DismissibleLayer>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={() => onOpenChange(false)}
        />

        <div
          className="relative bg-background border rounded-lg p-4 sm:p-6 w-full max-w-4xl mx-4 shadow-lg z-50 max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: "900px" }}
        >
          <button
            onClick={() => onOpenChange(false)}
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
                  This is how your job posting will appear when shared on social
                  media.
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
  );
}
