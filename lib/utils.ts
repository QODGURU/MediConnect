import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a readable string
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | undefined): string {
  if (!date) return "Not scheduled"

  const dateObj = typeof date === "string" ? new Date(date) : date

  // Check if date is valid
  if (isNaN(dateObj.getTime())) return "Invalid date"

  return dateObj.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}
