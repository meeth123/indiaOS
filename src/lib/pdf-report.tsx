import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { RulesEngineOutput, ComplianceResult } from "./types";

const colors = {
  urgent: "#ef4444",
  warning: "#eab308",
  info: "#7c3aed",
  green: "#16a34a",
  black: "#000000",
  gray: "#6b7280",
  lightGray: "#f3f4f6",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.black,
  },
  header: {
    marginBottom: 24,
    borderBottom: "3px solid #000",
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  date: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  scoreBig: {
    fontSize: 40,
    fontFamily: "Helvetica-Bold",
  },
  scoreLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  penaltySummary: {
    fontSize: 11,
    color: colors.urgent,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
  },
  sectionHeader: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    color: colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    border: "1px solid #d1d5db",
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginBottom: 4,
  },
  cardPenalty: {
    fontSize: 9,
    color: colors.urgent,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  label: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    color: colors.gray,
    marginBottom: 2,
    marginTop: 6,
  },
  body: {
    fontSize: 9,
    lineHeight: 1.5,
    color: "#374151",
  },
  fixStep: {
    fontSize: 9,
    lineHeight: 1.5,
    color: "#374151",
    marginLeft: 8,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  metaTag: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    padding: "3 6",
    backgroundColor: colors.lightGray,
    border: "1px solid #d1d5db",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1px solid #d1d5db",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: colors.gray,
  },
});

function formatCurrency(amount: number): string {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function scoreLabel(score: number): string {
  if (score < 30) return "Critical";
  if (score < 50) return "Poor";
  if (score < 70) return "Needs Work";
  if (score < 85) return "Good";
  return "Excellent";
}

function scoreColor(score: number): string {
  if (score < 30) return colors.urgent;
  if (score < 50) return "#f97316";
  if (score < 70) return colors.warning;
  return colors.green;
}

function severityColor(severity: string): string {
  if (severity === "urgent") return colors.urgent;
  if (severity === "warning") return "#ca8a04";
  return colors.info;
}

function IssueCard({ result }: { result: ComplianceResult }) {
  const penaltyText =
    result.penalty_max_usd > 0
      ? result.penalty_min_usd > 0
        ? `${formatCurrency(result.penalty_min_usd)} - ${formatCurrency(result.penalty_max_usd)}`
        : `Up to ${formatCurrency(result.penalty_max_usd)}`
      : null;

  return (
    <View style={styles.card} wrap={false}>
      <Text style={styles.cardTitle}>{result.rule_name}</Text>
      {penaltyText && <Text style={styles.cardPenalty}>{penaltyText}</Text>}

      <Text style={styles.body}>{result.obligation_summary}</Text>

      <Text style={styles.label}>Why this applies to you</Text>
      <Text style={styles.body}>{result.why_applies}</Text>

      <Text style={styles.label}>Consequence</Text>
      <Text style={styles.body}>{result.consequence}</Text>

      <Text style={styles.label}>How to fix</Text>
      {result.fix_steps.map((step, i) => (
        <Text key={i} style={styles.fixStep}>
          {i + 1}. {step}
        </Text>
      ))}

      <View style={styles.metaRow}>
        <Text style={styles.metaTag}>{result.fix_difficulty}</Text>
        <Text style={styles.metaTag}>{result.fix_time}</Text>
        <Text style={styles.metaTag}>{result.fix_cost}</Text>
      </View>
    </View>
  );
}

interface PDFReportProps {
  output: RulesEngineOutput;
}

export function PDFReport({ output }: PDFReportProps) {
  const urgent = output.results.filter((r) => r.severity === "urgent");
  const warning = output.results.filter((r) => r.severity === "warning");
  const info = output.results.filter((r) => r.severity === "info");

  const penaltyText =
    output.totalPenaltyMax > 0
      ? output.totalPenaltyMin > 0
        ? `${formatCurrency(output.totalPenaltyMin)} - ${formatCurrency(output.totalPenaltyMax)} in potential penalties`
        : `Up to ${formatCurrency(output.totalPenaltyMax)} in potential penalties`
      : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>NRI Compliance Report</Text>
          <Text style={styles.date}>
            Generated on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreBig, { color: scoreColor(output.score) }]}>
              {output.score}
            </Text>
            <View>
              <Text style={[styles.scoreLabel, { color: scoreColor(output.score) }]}>
                / 100 — {scoreLabel(output.score)}
              </Text>
              {penaltyText && (
                <Text style={styles.penaltySummary}>{penaltyText}</Text>
              )}
              <Text style={{ fontSize: 9, color: colors.gray, marginTop: 2 }}>
                {urgent.length} urgent | {warning.length} warning | {info.length} info
              </Text>
            </View>
          </View>
        </View>

        {/* Urgent */}
        {urgent.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { backgroundColor: colors.urgent }]}>
              {urgent.length} URGENT — act on these immediately
            </Text>
            {urgent.map((r) => (
              <IssueCard key={r.rule_id} result={r} />
            ))}
          </>
        )}

        {/* Warning */}
        {warning.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { backgroundColor: "#ca8a04" }]}>
              {warning.length} WARNING — address these soon
            </Text>
            {warning.map((r) => (
              <IssueCard key={r.rule_id} result={r} />
            ))}
          </>
        )}

        {/* Info */}
        {info.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { backgroundColor: colors.info }]}>
              {info.length} INFO — good to know
            </Text>
            {info.map((r) => (
              <IssueCard key={r.rule_id} result={r} />
            ))}
          </>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated by AlertDoc — not legal or tax advice
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
