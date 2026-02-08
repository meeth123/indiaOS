/**
 * Utility functions for deadline calculations and filtering.
 *
 * CRITICAL: This file handles the conversion from 1-indexed months (in constants)
 * to 0-indexed months (for JavaScript Date). This fixes the month indexing bug
 * in the original implementation.
 */

import { Deadline, DeadlineWithDate, DeadlineSeverity } from "./types";
import { ALL_DEADLINES } from "./constants";
import { QuizAnswers } from "../types";

/**
 * Calculate the next occurrence of a deadline (handles year rollover).
 *
 * IMPORTANT: Converts 1-indexed months (from constants) to 0-indexed (for Date).
 * Example: month: 4 (April in constants) → 3 (April in Date constructor)
 *
 * @param deadline - The deadline definition
 * @param useExtension - Whether to calculate extension date instead of primary date
 * @returns The calculated deadline date
 */
export function calculateDeadlineDate(
  deadline: Deadline,
  useExtension: boolean = false
): Date {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Determine which month/day to use
  const month =
    useExtension && deadline.hasExtension && deadline.extensionMonth
      ? deadline.extensionMonth - 1 // Convert from 1-indexed to 0-indexed
      : deadline.month - 1; // Convert from 1-indexed to 0-indexed

  const day =
    useExtension && deadline.hasExtension && deadline.extensionDay
      ? deadline.extensionDay
      : deadline.day;

  // Create deadline date for current year
  let deadlineDate = new Date(currentYear, month, day);

  // If deadline has passed this year, use next year's date
  if (deadlineDate <= now) {
    deadlineDate = new Date(currentYear + 1, month, day);
  }

  return deadlineDate;
}

/**
 * Calculate days remaining until a deadline.
 *
 * @param deadlineDate - The deadline date
 * @returns Number of days remaining (rounded up)
 */
export function calculateDaysLeft(deadlineDate: Date): number {
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get color for deadline based on days remaining.
 * Matches the original banner logic from page.tsx.
 *
 * @param daysLeft - Days until deadline
 * @returns Hex color code
 */
export function getDeadlineColor(daysLeft: number): string {
  if (daysLeft < 30) return "#ef4444"; // red (critical - <30 days)
  if (daysLeft < 60) return "#eab308"; // yellow (warning - 30-60 days)
  return "#22c55e"; // green (safe - 60+ days)
}

/**
 * Get deadline severity based on days remaining.
 *
 * @param daysLeft - Days until deadline
 * @returns Severity level
 */
export function getDeadlineSeverity(daysLeft: number): DeadlineSeverity {
  if (daysLeft < 30) return "critical";
  if (daysLeft < 60) return "high";
  if (daysLeft < 90) return "medium";
  return "info";
}

/**
 * Filter deadlines based on quiz answers (conditional logic).
 * This enables personalized deadline display based on user's situation.
 *
 * @param deadlines - Array of deadline definitions
 * @param answers - Optional quiz answers for filtering
 * @returns Filtered deadlines applicable to the user
 */
export function filterApplicableDeadlines(
  deadlines: Deadline[],
  answers?: QuizAnswers
): Deadline[] {
  if (!answers) {
    // If no quiz answers, return only universal deadlines (no conditional rules)
    return deadlines.filter((d) => !d.conditionalRules);
  }

  return deadlines.filter((deadline) => {
    // No conditional rules = always applicable
    if (!deadline.conditionalRules) return true;

    const { requiredAssets, requiredStatuses, customCondition } =
      deadline.conditionalRules;

    // Check required assets
    if (requiredAssets) {
      const hasRequiredAsset = requiredAssets.some((asset) =>
        answers.assets.includes(asset as any)
      );
      if (!hasRequiredAsset) return false;
    }

    // Check required statuses
    if (requiredStatuses) {
      const hasRequiredStatus = requiredStatuses.includes(answers.usStatus);
      if (!hasRequiredStatus) return false;
    }

    // Custom conditions (expand as needed)
    if (customCondition) {
      if (customCondition === "Has Indian income or assets") {
        const hasIndianIncome =
          answers.incomeTypes.length > 0 &&
          !answers.incomeTypes.includes("none");
        const hasIndianAssets = answers.assets.length > 0;
        if (!hasIndianIncome && !hasIndianAssets) return false;
      }
    }

    return true;
  });
}

/**
 * Get the next N upcoming deadlines.
 * Includes both primary and extension deadlines.
 *
 * @param count - Number of deadlines to return
 * @param answers - Optional quiz answers for personalization
 * @returns Array of upcoming deadlines with calculated dates
 */
export function getNextDeadlines(
  count: number = 5,
  answers?: QuizAnswers
): DeadlineWithDate[] {
  const applicableDeadlines = filterApplicableDeadlines(ALL_DEADLINES, answers);

  // Calculate dates for all deadlines (including extensions)
  const deadlinesWithDates: DeadlineWithDate[] = [];

  for (const deadline of applicableDeadlines) {
    // Skip event-based deadlines (month = 0)
    if (deadline.frequency === "event_based") continue;

    // Add primary deadline
    const primaryDate = calculateDeadlineDate(deadline, false);
    const primaryDaysLeft = calculateDaysLeft(primaryDate);

    deadlinesWithDates.push({
      ...deadline,
      date: primaryDate,
      daysLeft: primaryDaysLeft,
      isExtension: false,
    });

    // Add extension deadline if applicable
    if (
      deadline.hasExtension &&
      deadline.extensionMonth &&
      deadline.extensionDay
    ) {
      const extensionDate = calculateDeadlineDate(deadline, true);
      const extensionDaysLeft = calculateDaysLeft(extensionDate);

      deadlinesWithDates.push({
        ...deadline,
        date: extensionDate,
        daysLeft: extensionDaysLeft,
        isExtension: true,
      });
    }
  }

  // Sort by days left (soonest first)
  deadlinesWithDates.sort((a, b) => a.daysLeft - b.daysLeft);

  // Return top N
  return deadlinesWithDates.slice(0, count);
}

/**
 * Get only the single next deadline (for banner display).
 * This is the main function used by the homepage banner.
 *
 * @param answers - Optional quiz answers for personalization
 * @returns The next upcoming deadline, or null if none found
 */
export function getNextDeadline(
  answers?: QuizAnswers
): DeadlineWithDate | null {
  const deadlines = getNextDeadlines(1, answers);
  return deadlines.length > 0 ? deadlines[0] : null;
}

/**
 * Format deadline date for display.
 * Matches the original formatting from page.tsx.
 *
 * @param date - The deadline date
 * @returns Formatted date string (e.g., "April 15, 2026")
 */
export function formatDeadlineDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get all deadlines grouped by severity level.
 * Useful for displaying urgent vs. upcoming deadlines separately.
 *
 * @param answers - Optional quiz answers for personalization
 * @returns Deadlines grouped by severity (critical/high/medium/info)
 */
export function getDeadlinesBySeverity(
  answers?: QuizAnswers
): Record<DeadlineSeverity, DeadlineWithDate[]> {
  const applicableDeadlines = filterApplicableDeadlines(ALL_DEADLINES, answers);

  const grouped: Record<DeadlineSeverity, DeadlineWithDate[]> = {
    critical: [],
    high: [],
    medium: [],
    info: [],
  };

  for (const deadline of applicableDeadlines) {
    // Skip event-based deadlines
    if (deadline.frequency === "event_based") continue;

    const date = calculateDeadlineDate(deadline, false);
    const daysLeft = calculateDaysLeft(date);
    const severity = getDeadlineSeverity(daysLeft);

    grouped[severity].push({
      ...deadline,
      date,
      daysLeft,
      isExtension: false,
    });
  }

  // Sort each group by days left
  (Object.keys(grouped) as DeadlineSeverity[]).forEach((severity) => {
    grouped[severity].sort((a, b) => a.daysLeft - b.daysLeft);
  });

  return grouped;
}

/**
 * Get deadlines for a specific category.
 *
 * @param category - The category to filter by
 * @param answers - Optional quiz answers for personalization
 * @returns Deadlines in the specified category
 */
export function getDeadlinesByCategory(
  category: string,
  answers?: QuizAnswers
): DeadlineWithDate[] {
  const applicableDeadlines = filterApplicableDeadlines(
    ALL_DEADLINES,
    answers
  ).filter((d) => d.category === category);

  const deadlinesWithDates: DeadlineWithDate[] = [];

  for (const deadline of applicableDeadlines) {
    if (deadline.frequency === "event_based") continue;

    const date = calculateDeadlineDate(deadline, false);
    const daysLeft = calculateDaysLeft(date);

    deadlinesWithDates.push({
      ...deadline,
      date,
      daysLeft,
      isExtension: false,
    });
  }

  deadlinesWithDates.sort((a, b) => a.daysLeft - b.daysLeft);

  return deadlinesWithDates;
}
