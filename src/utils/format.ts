/**
 * Formats a timestamp into a readable date string.
 * Supports different levels of detail.
 */
// Tested in tests/utils/format.test.ts
const shortFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

const mediumFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const fullFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(
  timestamp: number,
  options: "short" | "medium" | "full" = "medium",
): string {
  const date = new Date(timestamp);

  switch (options) {
    case "short":
      return shortFormatter.format(date);
    case "medium":
      return mediumFormatter.format(date).toUpperCase();
    case "full":
      return fullFormatter.format(date);
    default:
      return date.toLocaleString();
  }
}
