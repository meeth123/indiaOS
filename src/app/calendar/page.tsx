"use client";

import { useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/shared/nav";
import { Footer } from "@/components/shared/footer";
import {
  ALL_DEADLINES_INCLUDING_EVENTS,
  calculateDaysLeft,
  getDeadlineColor,
  formatDeadlineDate,
} from "@/lib/deadlines";
import type { Deadline, DeadlineCategory } from "@/lib/deadlines";

const CATEGORY_COLORS: Record<DeadlineCategory, { bg: string; label: string }> = {
  US_TAX: { bg: "bg-blue-100 border-blue-500", label: "US Tax" },
  US_BANKING: { bg: "bg-blue-50 border-blue-400", label: "US Banking" },
  US_IMMIGRATION: { bg: "bg-blue-50 border-blue-300", label: "US Immigration" },
  INDIA_TAX: { bg: "bg-orange-100 border-orange-500", label: "India Tax" },
  INDIA_BANKING: { bg: "bg-green-100 border-green-500", label: "India Banking" },
  INDIA_IDENTITY: { bg: "bg-purple-100 border-purple-500", label: "India Identity" },
};

const CATEGORY_DOT: Record<DeadlineCategory, string> = {
  US_TAX: "bg-blue-500",
  US_BANKING: "bg-blue-400",
  US_IMMIGRATION: "bg-blue-300",
  INDIA_TAX: "bg-orange-500",
  INDIA_BANKING: "bg-green-500",
  INDIA_IDENTITY: "bg-purple-500",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CALENDAR_YEAR = 2026;

interface DeadlineEntry {
  deadline: Deadline;
  date: Date;
  daysLeft: number;
  isExtension: boolean;
  isPast: boolean;
}

/** Pin deadline date to CALENDAR_YEAR (no year rollover). */
function calendarDate(deadline: Deadline, useExtension: boolean): Date {
  const month = useExtension && deadline.extensionMonth
    ? deadline.extensionMonth - 1
    : deadline.month - 1;
  const day = useExtension && deadline.extensionDay
    ? deadline.extensionDay
    : deadline.day;
  return new Date(CALENDAR_YEAR, month, day);
}

function getCalendarData(): Map<number, DeadlineEntry[]> {
  const byMonth = new Map<number, DeadlineEntry[]>();
  const now = new Date();

  for (let m = 0; m < 12; m++) {
    byMonth.set(m, []);
  }

  for (const deadline of ALL_DEADLINES_INCLUDING_EVENTS) {
    if (deadline.frequency === "event_based") continue;

    const date = calendarDate(deadline, false);
    const daysLeft = calculateDaysLeft(date);
    const monthIndex = date.getMonth();

    byMonth.get(monthIndex)!.push({
      deadline,
      date,
      daysLeft,
      isExtension: false,
      isPast: date < now,
    });

    if (deadline.hasExtension && deadline.extensionMonth && deadline.extensionDay) {
      const extDate = calendarDate(deadline, true);
      const extDaysLeft = calculateDaysLeft(extDate);
      const extMonth = extDate.getMonth();

      byMonth.get(extMonth)!.push({
        deadline,
        date: extDate,
        daysLeft: extDaysLeft,
        isExtension: true,
        isPast: extDate < now,
      });
    }
  }

  // Sort each month by day
  for (const [, entries] of byMonth) {
    entries.sort((a, b) => a.date.getDate() - b.date.getDate());
  }

  // Deduplicate entries with same date and form name
  for (const [month, entries] of byMonth) {
    const seen = new Set<string>();
    const unique: DeadlineEntry[] = [];
    for (const entry of entries) {
      const key = `${entry.deadline.formName}-${entry.date.getDate()}-${entry.isExtension}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(entry);
      }
    }
    byMonth.set(month, unique);
  }

  return byMonth;
}

function DeadlineCard({ entry, expanded, onToggle }: {
  entry: DeadlineEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { deadline, date, daysLeft, isExtension, isPast } = entry;
  const color = isPast ? "#9ca3af" : getDeadlineColor(daysLeft);
  const catStyle = CATEGORY_COLORS[deadline.category];
  const dotColor = CATEGORY_DOT[deadline.category];

  return (
    <div
      className={`border-l-4 ${catStyle.bg} brutal-card p-4 cursor-pointer hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all`}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2.5 h-2.5 rounded-full ${dotColor} flex-shrink-0`} />
            <span className="font-mono font-bold text-sm truncate">
              {isExtension
                ? `${deadline.formName} (Extension)`
                : deadline.formName}
            </span>
          </div>
          <p className="font-sans text-xs text-gray-600 ml-4.5">
            {formatDeadlineDate(date)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="font-mono text-xs font-bold px-2 py-1 border-2 border-black"
            style={{ backgroundColor: color, color: isPast ? "white" : daysLeft < 30 ? "white" : "#1a1a1a" }}
          >
            {isPast ? "PASSED" : `${daysLeft}d`}
          </span>
          <span className="font-mono text-xs">{expanded ? "−" : "+"}</span>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 ml-4.5 space-y-2">
          <p className="font-sans text-sm text-gray-700">
            {deadline.description}
          </p>
          <p className="font-sans text-xs text-gray-500">
            <strong>Who:</strong> {deadline.applicability}
          </p>
          {(deadline.penaltyMin > 0 || deadline.penaltyMax > 0) && (
            <p className="font-sans text-xs text-red-600">
              <strong>Penalty:</strong> {deadline.penaltyDescription}
            </p>
          )}
          {isExtension && deadline.extensionCondition && (
            <p className="font-sans text-xs text-gray-500 italic">
              Condition: {deadline.extensionCondition}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  const calendarData = getCalendarData();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const currentMonth = new Date().getMonth();

  const allCategories: { value: string; label: string; dot: string }[] = [
    { value: "all", label: "All", dot: "bg-black" },
    { value: "US_TAX", label: "US Tax", dot: "bg-blue-500" },
    { value: "US_BANKING", label: "US Banking", dot: "bg-blue-400" },
    { value: "INDIA_TAX", label: "India Tax", dot: "bg-orange-500" },
    { value: "INDIA_BANKING", label: "India Banking", dot: "bg-green-500" },
    { value: "INDIA_IDENTITY", label: "India Identity", dot: "bg-purple-500" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Nav />

      <section className="relative z-10 px-6 md:px-12 pt-10 pb-20 max-w-5xl mx-auto">
        <p className="font-mono font-bold text-sm uppercase tracking-wider text-gray-500 mb-4">
          NRI Compliance Calendar
        </p>
        <h1 className="font-mono font-bold text-3xl md:text-5xl tracking-tight mb-4">
          Every deadline in{" "}
          <span className="highlight-yellow">2026</span>
        </h1>
        <p className="font-sans text-lg text-gray-600 mb-8 max-w-2xl">
          US tax filings, Indian ITR, FBAR, FATCA, PAN-Aadhaar, and more —
          all in one place, color-coded by category.
        </p>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-10">
          {allCategories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={`font-mono text-xs font-bold px-3 py-2 border-2 border-black transition-all ${
                filterCategory === cat.value
                  ? "bg-black text-white"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              <span className={`inline-block w-2 h-2 rounded-full ${cat.dot} mr-1.5`} />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Month-by-month calendar */}
        <div className="space-y-10">
          {MONTHS.map((monthName, monthIndex) => {
            const entries = calendarData.get(monthIndex) || [];
            const filtered =
              filterCategory === "all"
                ? entries
                : entries.filter((e) => e.deadline.category === filterCategory);

            if (filtered.length === 0) return null;

            const isCurrentMonth = monthIndex === currentMonth;

            return (
              <div key={monthName} id={monthName.toLowerCase()}>
                <div className="flex items-center gap-3 mb-4">
                  <h2
                    className={`font-mono font-bold text-xl md:text-2xl ${
                      isCurrentMonth ? "highlight-pink" : ""
                    }`}
                  >
                    {monthName} 2026
                  </h2>
                  {isCurrentMonth && (
                    <span className="badge-urgent">NOW</span>
                  )}
                  <span className="font-mono text-xs text-gray-400">
                    {filtered.length} deadline{filtered.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filtered.map((entry) => {
                    const id = `${entry.deadline.id}-${entry.isExtension ? "ext" : "pri"}-${monthIndex}`;
                    return (
                      <DeadlineCard
                        key={id}
                        entry={entry}
                        expanded={expandedId === id}
                        onToggle={() =>
                          setExpandedId(expandedId === id ? null : id)
                        }
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="brutal-card-lg p-8 md:p-10 text-center mt-16">
          <h2 className="font-mono font-bold text-xl md:text-2xl mb-3">
            Not sure which deadlines{" "}
            <span className="highlight-yellow">apply to you?</span>
          </h2>
          <p className="font-sans text-gray-700 mb-6 max-w-lg mx-auto">
            Not everything on this calendar is relevant to your specific
            situation. Take 2 minutes to find out what actually matters.
          </p>
          <Link href="/quiz" className="brutal-btn brutal-btn-pink text-lg">
            CHECK WHICH DEADLINES APPLY TO YOU
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
