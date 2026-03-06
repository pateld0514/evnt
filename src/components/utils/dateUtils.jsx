import { format } from "date-fns";

/**
 * Format a date-only string (YYYY-MM-DD) without timezone shift.
 * Appending T00:00:00 forces local-time interpretation.
 */
export function formatDate(dateStr, fmt = "MMM d, yyyy") {
  if (!dateStr) return "";
  if (dateStr instanceof Date) return format(dateStr, fmt);
  const datePart = String(dateStr).split("T")[0];
  return format(new Date(datePart + "T00:00:00"), fmt);
}

/**
 * Format a full ISO timestamp in Eastern Time (EST/EDT).
 */
export function formatTimestamp(isoStr) {
  if (!isoStr) return "";
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}