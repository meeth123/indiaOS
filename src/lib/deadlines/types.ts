/**
 * Type definitions for the deadline management system.
 *
 * IMPORTANT: Months are 1-indexed (1-12) in our data model for human readability.
 * The utility functions convert to 0-indexed when creating Date objects.
 */

export type DeadlineCategory =
  | "US_TAX"
  | "US_BANKING"
  | "US_IMMIGRATION"
  | "INDIA_TAX"
  | "INDIA_BANKING"
  | "INDIA_IDENTITY";

export type DeadlineFrequency =
  | "annual"
  | "quarterly"
  | "monthly"
  | "event_based"
  | "one_time";

export type DeadlineSeverity =
  | "critical"   // Urgent - serious penalties
  | "high"       // Important - significant consequences
  | "medium"     // Recommended - moderate impact
  | "info";      // Informational - minimal impact

/**
 * Core deadline definition.
 * Months are 1-indexed (1=January, 12=December) for human readability.
 */
export interface Deadline {
  id: string;
  formName: string;               // e.g., "FBAR", "Form 1040", "ITR-2"
  officialName: string;           // Full official name
  description: string;            // Brief description of what it's for

  // Date handling - uses 1-indexed months (1-12)
  month: number;                  // 1-12 (NOT 0-indexed like JavaScript Date)
  day: number;                    // 1-31

  // Extension handling
  hasExtension: boolean;
  extensionMonth?: number;        // 1-12
  extensionDay?: number;          // 1-31
  extensionCondition?: string;    // e.g., "File Form 4868 by April 15"

  // Categorization
  category: DeadlineCategory;
  frequency: DeadlineFrequency;
  severity: DeadlineSeverity;

  // Applicability
  applicability: string;          // Who this applies to

  // Penalties
  penaltyMin: number;            // Minimum penalty in USD (or USD equivalent)
  penaltyMax: number;            // Maximum penalty in USD (or USD equivalent)
  penaltyDescription: string;    // Description of penalties

  // Conditional logic for future extensibility
  conditionalRules?: {
    requiredAssets?: string[];    // From AssetType in ../types.ts
    requiredStatuses?: string[];  // From USStatus in ../types.ts
    customCondition?: string;     // For complex rules
  };
}

/**
 * Deadline with calculated date and days remaining.
 * Used for displaying deadlines to users.
 */
export interface DeadlineWithDate extends Deadline {
  date: Date;                    // Calculated deadline date
  daysLeft: number;              // Days until deadline
  isExtension: boolean;          // Whether this is the extended deadline
}

/**
 * Deadlines grouped by severity level.
 * Useful for displaying urgent vs. upcoming deadlines.
 */
export interface DeadlinesBySeverity {
  critical: DeadlineWithDate[];
  high: DeadlineWithDate[];
  medium: DeadlineWithDate[];
  info: DeadlineWithDate[];
}
