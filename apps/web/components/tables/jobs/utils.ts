export function formatDisplayText(text: string | null | undefined): string {
  if (!text) return "Not specified";

  return text
    .split(/[-_\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
