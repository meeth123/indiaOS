/**
 * Unit tests for deadline utility functions.
 * Critical: Tests the month indexing fix (1-indexed → 0-indexed conversion).
 */

import { describe, it, expect } from "vitest";
import {
  calculateDeadlineDate,
  calculateDaysLeft,
  getDeadlineColor,
  getDeadlineSeverity,
  filterApplicableDeadlines,
  getNextDeadline,
  formatDeadlineDate,
} from "../utils";
import { Deadline } from "../types";
import { QuizAnswers } from "../../types";

describe("Deadline Utils", () => {
  describe("calculateDeadlineDate", () => {
    it("should correctly convert 1-indexed months to 0-indexed Date", () => {
      const deadline: Deadline = {
        id: "test_april",
        formName: "Test Form",
        officialName: "Test Official",
        description: "Test description",
        month: 4, // April (1-indexed in our constants)
        day: 15,
        hasExtension: false,
        category: "US_TAX",
        frequency: "annual",
        severity: "critical",
        applicability: "Test",
        penaltyMin: 0,
        penaltyMax: 0,
        penaltyDescription: "Test penalty",
      };

      const date = calculateDeadlineDate(deadline);

      // JavaScript Date uses 0-indexed months, so April = 3
      expect(date.getMonth()).toBe(3); // April in Date is index 3
      expect(date.getDate()).toBe(15);
    });

    it("should handle July correctly (was the bug in original code)", () => {
      const deadline: Deadline = {
        id: "test_july",
        formName: "Test Form",
        officialName: "Test Official",
        description: "Test description",
        month: 7, // July (1-indexed)
        day: 31,
        hasExtension: false,
        category: "INDIA_TAX",
        frequency: "annual",
        severity: "critical",
        applicability: "Test",
        penaltyMin: 0,
        penaltyMax: 0,
        penaltyDescription: "Test penalty",
      };

      const date = calculateDeadlineDate(deadline);

      // July in Date is index 6 (0-indexed)
      expect(date.getMonth()).toBe(6);
      expect(date.getDate()).toBe(31);
    });

    it("should roll over to next year if deadline has passed", () => {
      const now = new Date();
      const pastMonth = now.getMonth() > 0 ? 1 : 12; // January or December
      const pastDay = 1;

      const deadline: Deadline = {
        id: "test_past",
        formName: "Test Form",
        officialName: "Test Official",
        description: "Test description",
        month: pastMonth, // 1-indexed
        day: pastDay,
        hasExtension: false,
        category: "US_TAX",
        frequency: "annual",
        severity: "critical",
        applicability: "Test",
        penaltyMin: 0,
        penaltyMax: 0,
        penaltyDescription: "Test penalty",
      };

      const date = calculateDeadlineDate(deadline);

      // If the deadline has passed this year, should use next year
      const expectedYear =
        now.getMonth() + 1 > pastMonth ||
        (now.getMonth() + 1 === pastMonth && now.getDate() > pastDay)
          ? now.getFullYear() + 1
          : now.getFullYear();

      expect(date.getFullYear()).toBe(expectedYear);
    });

    it("should handle extension dates correctly", () => {
      const deadline: Deadline = {
        id: "test_extension",
        formName: "Form 1040",
        officialName: "US Tax Return",
        description: "Test description",
        month: 4, // April (1-indexed)
        day: 15,
        hasExtension: true,
        extensionMonth: 10, // October (1-indexed)
        extensionDay: 15,
        category: "US_TAX",
        frequency: "annual",
        severity: "critical",
        applicability: "Test",
        penaltyMin: 0,
        penaltyMax: 0,
        penaltyDescription: "Test penalty",
      };

      const extensionDate = calculateDeadlineDate(deadline, true);

      // October in Date is index 9 (0-indexed)
      expect(extensionDate.getMonth()).toBe(9);
      expect(extensionDate.getDate()).toBe(15);
    });
  });

  describe("calculateDaysLeft", () => {
    it("should calculate days remaining correctly", () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days from now

      const daysLeft = calculateDaysLeft(futureDate);

      expect(daysLeft).toBe(10);
    });

    it("should round up partial days", () => {
      const now = new Date();
      const futureDate = new Date(
        now.getTime() + 10.5 * 24 * 60 * 60 * 1000
      ); // 10.5 days from now

      const daysLeft = calculateDaysLeft(futureDate);

      expect(daysLeft).toBe(11); // Should round up
    });
  });

  describe("getDeadlineColor", () => {
    it("should return red for < 30 days (critical)", () => {
      expect(getDeadlineColor(15)).toBe("#ef4444");
      expect(getDeadlineColor(29)).toBe("#ef4444");
    });

    it("should return yellow for 30-59 days (warning)", () => {
      expect(getDeadlineColor(30)).toBe("#eab308");
      expect(getDeadlineColor(45)).toBe("#eab308");
      expect(getDeadlineColor(59)).toBe("#eab308");
    });

    it("should return green for 60+ days (safe)", () => {
      expect(getDeadlineColor(60)).toBe("#22c55e");
      expect(getDeadlineColor(90)).toBe("#22c55e");
      expect(getDeadlineColor(365)).toBe("#22c55e");
    });
  });

  describe("getDeadlineSeverity", () => {
    it("should return correct severity based on days left", () => {
      expect(getDeadlineSeverity(15)).toBe("critical"); // < 30 days
      expect(getDeadlineSeverity(45)).toBe("high"); // 30-60 days
      expect(getDeadlineSeverity(75)).toBe("medium"); // 60-90 days
      expect(getDeadlineSeverity(120)).toBe("info"); // > 90 days
    });
  });

  describe("filterApplicableDeadlines", () => {
    const testDeadlines: Deadline[] = [
      {
        id: "universal",
        formName: "Form 1040",
        officialName: "US Tax Return",
        description: "Test",
        month: 4,
        day: 15,
        hasExtension: false,
        category: "US_TAX",
        frequency: "annual",
        severity: "critical",
        applicability: "All US persons",
        penaltyMin: 0,
        penaltyMax: 0,
        penaltyDescription: "Test",
      },
      {
        id: "conditional_fbar",
        formName: "FBAR",
        officialName: "Foreign Bank Account Report",
        description: "Test",
        month: 4,
        day: 15,
        hasExtension: false,
        category: "US_BANKING",
        frequency: "annual",
        severity: "critical",
        applicability: "US persons with foreign accounts",
        penaltyMin: 0,
        penaltyMax: 0,
        penaltyDescription: "Test",
        conditionalRules: {
          requiredAssets: ["bank_accounts", "nre_nro"],
        },
      },
      {
        id: "conditional_pfic",
        formName: "Form 8621",
        officialName: "PFIC Reporting",
        description: "Test",
        month: 4,
        day: 15,
        hasExtension: false,
        category: "US_TAX",
        frequency: "annual",
        severity: "critical",
        applicability: "US persons with mutual funds",
        penaltyMin: 0,
        penaltyMax: 0,
        penaltyDescription: "Test",
        conditionalRules: {
          requiredAssets: ["mutual_funds"],
        },
      },
    ];

    it("should return only universal deadlines when no quiz answers provided", () => {
      const filtered = filterApplicableDeadlines(testDeadlines);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("universal");
    });

    it("should include conditional deadlines when assets match", () => {
      const answers: Partial<QuizAnswers> = {
        assets: ["bank_accounts", "mutual_funds"],
      } as any;

      const filtered = filterApplicableDeadlines(testDeadlines, answers as any);

      expect(filtered).toHaveLength(3); // All three deadlines
      expect(filtered.map((d) => d.id)).toContain("conditional_fbar");
      expect(filtered.map((d) => d.id)).toContain("conditional_pfic");
    });

    it("should exclude conditional deadlines when assets don't match", () => {
      const answers: Partial<QuizAnswers> = {
        assets: ["property"],
      } as any;

      const filtered = filterApplicableDeadlines(testDeadlines, answers as any);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("universal");
    });
  });

  describe("getNextDeadline", () => {
    it("should return the nearest upcoming deadline", () => {
      const nextDeadline = getNextDeadline();

      expect(nextDeadline).not.toBeNull();
      expect(nextDeadline?.daysLeft).toBeGreaterThan(0);
      expect(nextDeadline?.date).toBeInstanceOf(Date);
      expect(nextDeadline?.formName).toBeTruthy();
    });

    it("should return a deadline with correct structure", () => {
      const nextDeadline = getNextDeadline();

      expect(nextDeadline).toHaveProperty("id");
      expect(nextDeadline).toHaveProperty("formName");
      expect(nextDeadline).toHaveProperty("daysLeft");
      expect(nextDeadline).toHaveProperty("date");
      expect(nextDeadline).toHaveProperty("isExtension");
    });
  });

  describe("formatDeadlineDate", () => {
    it("should format date correctly", () => {
      const date = new Date(2026, 3, 15); // April 15, 2026 (month is 0-indexed in Date)

      const formatted = formatDeadlineDate(date);

      expect(formatted).toBe("April 15, 2026");
    });

    it("should handle July correctly (the bug date)", () => {
      const date = new Date(2026, 6, 31); // July 31, 2026 (month 6 = July in Date)

      const formatted = formatDeadlineDate(date);

      expect(formatted).toBe("July 31, 2026");
    });
  });

  describe("Integration: Full deadline flow", () => {
    it("should correctly identify April 15 as April (not May)", () => {
      // This tests the original bug fix
      const testDeadline: Deadline = {
        id: "april_test",
        formName: "Test Form",
        officialName: "Test",
        description: "Test",
        month: 4, // April in 1-indexed system
        day: 15,
        hasExtension: false,
        category: "US_TAX",
        frequency: "annual",
        severity: "critical",
        applicability: "Test",
        penaltyMin: 0,
        penaltyMax: 0,
        penaltyDescription: "Test",
      };

      const date = calculateDeadlineDate(testDeadline);
      const formatted = formatDeadlineDate(date);

      // Should be "April 15" not "May 15"
      expect(formatted).toContain("April");
      expect(formatted).not.toContain("May");
    });
  });
});
