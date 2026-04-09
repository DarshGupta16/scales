/**
 * Formats a timestamp into a readable date string.
 * Supports different levels of detail.
 */
export function formatDate(
  timestamp: number,
  options: "short" | "medium" | "full" = "medium",
): string {
  const date = new Date(timestamp);

  switch (options) {
    case "short":
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    case "medium":
      return date
        .toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
        .toUpperCase();
    case "full":
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    default:
      return date.toLocaleString();
  }
}
