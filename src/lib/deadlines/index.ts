/**
 * Public API for the deadlines module.
 * Import from this file for cleaner imports: `from "@/lib/deadlines"`
 */

// Export types
export type {
  Deadline,
  DeadlineWithDate,
  DeadlinesBySeverity,
  DeadlineCategory,
  DeadlineFrequency,
  DeadlineSeverity,
} from "./types";

// Export constants
export {
  US_TAX_DEADLINES,
  INDIA_TAX_DEADLINES,
  EVENT_BASED_DEADLINES,
  INDIA_IDENTITY_DEADLINES,
  ALL_DEADLINES,
  ALL_DEADLINES_INCLUDING_EVENTS,
  DEADLINES_BY_CATEGORY,
} from "./constants";

// Export utilities (most commonly used functions)
export {
  getNextDeadline,
  getNextDeadlines,
  getDeadlineColor,
  formatDeadlineDate,
  calculateDeadlineDate,
  calculateDaysLeft,
  getDeadlineSeverity,
  filterApplicableDeadlines,
  getDeadlinesBySeverity,
  getDeadlinesByCategory,
} from "./utils";
