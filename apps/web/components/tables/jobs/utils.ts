export function formatDisplayText(text: string | null | undefined): string {
  if (!text) return "Not specified";

  return text
    .split(/[-_\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function getEffectiveStatus(status: string, publishedAt: string | null | undefined): string {
  
  if (status === "published" && !publishedAt) {
    return "staged";
  }
  return status;
}

export function getStatusDisplayText(status: string, publishedAt: string | null | undefined): string {
  const effectiveStatus = getEffectiveStatus(status, publishedAt);
  return formatDisplayText(effectiveStatus);
}

export function getStatusVariant(status: string, publishedAt: string | null | undefined): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" {
  const effectiveStatus = getEffectiveStatus(status, publishedAt);
  
  switch (effectiveStatus) {
    case "published":
      return "success";
    case "staged":
      return "warning";
    case "draft":
      return "secondary";
    case "closed":
      return "destructive";
    default:
      return "outline";
  }
}
