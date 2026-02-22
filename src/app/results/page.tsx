"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { QuizAnswers, RulesEngineOutput, ComplianceResult } from "@/lib/types";
import { runRulesEngine } from "@/lib/rules-engine";
import { trackEvent } from "@/lib/fb-pixel";

/* ── Helpers ── */

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

function scoreColor(score: number): string {
  if (score < 30) return "#ef4444";
  if (score < 50) return "#f97316";
  if (score < 70) return "#eab308";
  if (score < 85) return "#22c55e";
  return "#16a34a";
}

function scoreLabel(score: number): string {
  if (score < 30) return "Critical";
  if (score < 50) return "Poor";
  if (score < 70) return "Needs Work";
  if (score < 85) return "Good";
  return "Excellent";
}

function severityBadge(severity: string) {
  const cls =
    severity === "urgent"
      ? "badge-urgent"
      : severity === "warning"
      ? "badge-warning"
      : "badge-info";
  return <span className={cls}>{severity.toUpperCase()}</span>;
}

/* ── Issue Card ── */
/* FIX #8: separated fix metadata from button text */

function IssueCard({ result }: { result: ComplianceResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="brutal-card p-6 mb-4">
      <div className="flex flex-wrap items-start gap-3 mb-3">
        {severityBadge(result.severity)}
        <h3 className="font-mono font-bold text-lg flex-1">
          {result.rule_name}
        </h3>
        {result.penalty_max_usd > 0 && (
          <span className="font-mono font-bold text-sm text-red-600">
            {result.penalty_min_usd > 0
              ? `${formatCurrency(result.penalty_min_usd)} – ${formatCurrency(result.penalty_max_usd)}`
              : `Up to ${formatCurrency(result.penalty_max_usd)}`}
          </span>
        )}
      </div>

      {/* What it is */}
      <div className="mb-3">
        <p className="font-sans text-sm text-gray-700 leading-relaxed">
          {result.obligation_summary}
        </p>
      </div>

      {/* FIX #11: why-applies box with stronger contrast */}
      <div className="why-applies-box mb-3">
        <p className="font-sans text-sm font-medium">
          <span className="font-mono font-bold text-xs uppercase tracking-wide block mb-1">
            Why this applies to you
          </span>
          {result.why_applies}
        </p>
      </div>

      {/* Consequence */}
      <div className="consequence-box mb-4">
        <p className="font-sans text-sm">
          <span className="font-mono font-bold text-xs uppercase tracking-wide block mb-1">
            What happens if you ignore this
          </span>
          {result.consequence}
        </p>
      </div>

      {/* FIX #8: short button label, metadata shown separately below */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="brutal-btn brutal-btn-yellow text-xs w-full"
      >
        {expanded ? "HIDE FIX STEPS" : "HOW TO FIX"}
      </button>

      {/* Fix metadata shown as tags below the button */}
      <div className="flex flex-wrap gap-2 mt-2">
        <span className="font-mono text-xs font-bold px-2 py-1 border-2 border-black bg-white">
          {result.fix_difficulty}
        </span>
        <span className="font-mono text-xs font-bold px-2 py-1 border-2 border-black bg-white">
          {result.fix_time}
        </span>
        <span className="font-mono text-xs font-bold px-2 py-1 border-2 border-black bg-white">
          {result.fix_cost}
        </span>
      </div>

      {expanded && (
        <div className="mt-4 p-4 bg-green bg-opacity-20 border-3 border-black">
          <ol className="list-decimal list-inside space-y-2">
            {result.fix_steps.map((step, i) => (
              <li key={i} className="font-sans text-sm leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ── */

export default function ResultsPage() {
  const [output, setOutput] = useState<RulesEngineOutput | null>(null);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /* FIX #9: collapse issues on mobile — show top 5 by default */
  const [showAll, setShowAll] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("alertdoc_quiz");
      if (stored) {
        const answers: QuizAnswers = JSON.parse(stored);
        const result = runRulesEngine(answers);
        setOutput(result);
        trackEvent("CompleteRegistration", {
          content_name: "Quiz Results",
          value: result.score,
        });
      }
    } catch {
      // Invalid data
    }

    if (localStorage.getItem("alertdoc_waitlist_email")) {
      setWaitlistSubmitted(true);
    }
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const stored = localStorage.getItem("alertdoc_quiz");
      if (!stored) throw new Error("No quiz data found");

      const quizAnswers = JSON.parse(stored);
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, quizAnswers }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send report");
      }

      localStorage.setItem("alertdoc_email", email);
      setEmailSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = useCallback((severity: string) => {
    // Expand all issues first so the section is visible
    if (!showAll) setShowAll(true);
    // Small delay to let DOM update after showAll
    setTimeout(() => {
      const el = document.getElementById(`section-${severity}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [showAll]);

  const handleShare = (platform: string) => {
    trackEvent("Share", { content_name: "Quiz Results", platform }, true);
    const text = `I just scored ${output?.score}/100 on the AlertDoc NRI Compliance Health Check. Think you're compliant? Check yours:`;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        "_blank"
      );
    } else if (platform === "linkedin") {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        "_blank"
      );
    } else if (platform === "whatsapp") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
        "_blank"
      );
    } else if (platform === "copy") {
      navigator.clipboard.writeText(text + " " + url);
    }
  };

  if (!output) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="brutal-card p-10 text-center">
          <h2 className="font-mono font-bold text-2xl mb-4">
            No quiz data found
          </h2>
          <p className="font-sans text-gray-600 mb-6">
            Take the quiz first to see your compliance score.
          </p>
          <Link href="/quiz" className="brutal-btn brutal-btn-pink">
            TAKE THE QUIZ
          </Link>
        </div>
      </div>
    );
  }

  const urgentCount = output.results.filter(
    (r) => r.severity === "urgent"
  ).length;
  const warningCount = output.results.filter(
    (r) => r.severity === "warning"
  ).length;
  const infoCount = output.results.filter(
    (r) => r.severity === "info"
  ).length;

  /* FIX #9: show first 5 on mobile, all on desktop or when expanded */
  const INITIAL_SHOW = 5;
  const visibleResults = showAll
    ? output.results
    : output.results.slice(0, INITIAL_SHOW);
  const hasMore = output.results.length > INITIAL_SHOW;

  return (
    <div className="relative min-h-screen">
      <div className="blob-purple" style={{ top: "-80px", left: "-80px" }} />
      <div
        className="blob-green"
        style={{ bottom: "200px", right: "-80px" }}
      />

      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <Link href="/" className="inline-block">
          <Image
            src="/logo.png"
            alt="AlertDoc"
            width={400}
            height={133}
            priority
            className="h-20 w-auto md:h-24"
          />
        </Link>
        <Link href="/quiz" className="brutal-btn text-xs">
          RETAKE QUIZ
        </Link>
      </nav>

      <div className="relative z-10 px-6 md:px-12 pb-20 max-w-4xl mx-auto">
        {/* ── Score Section ── */}
        <div className="brutal-card-lg p-8 md:p-12 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* FIX #7: Score Circle — larger font for single digits */}
            <div
              className="score-circle flex-shrink-0"
              style={{ borderColor: scoreColor(output.score) }}
            >
              <span
                className={`score-number ${output.score < 10 ? "single-digit" : ""}`}
                style={{ color: scoreColor(output.score) }}
              >
                {output.score}
              </span>
              <span className="font-mono font-bold text-xs uppercase tracking-wider text-gray-500">
                / 100
              </span>
              <span
                className="font-mono font-bold text-sm mt-1"
                style={{ color: scoreColor(output.score) }}
              >
                {scoreLabel(output.score)}
              </span>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="font-mono font-bold text-2xl md:text-3xl mb-3">
                Your Compliance Score
              </h1>

              {/* Money at risk */}
              {output.totalPenaltyMax > 0 && (
                <div className="mb-4">
                  <span className="font-mono font-bold text-xs uppercase tracking-wide text-gray-500 block mb-1">
                    Potential Money at Risk
                  </span>
                  <span className="font-mono font-bold text-3xl text-red-600">
                    {output.totalPenaltyMin > 0
                      ? `${formatCurrency(output.totalPenaltyMin)} – ${formatCurrency(output.totalPenaltyMax)}`
                      : `Up to ${formatCurrency(output.totalPenaltyMax)}`}
                  </span>
                  <span className="font-mono text-xs text-gray-500 block mt-1">
                    in potential penalties &amp; fines
                  </span>
                </div>
              )}

              {/* Summary badges — clickable, scroll to section */}
              <div className="flex flex-wrap gap-3">
                {urgentCount > 0 && (
                  <button
                    onClick={() => scrollToSection("urgent")}
                    className="badge-urgent cursor-pointer hover:scale-105 transition-transform"
                  >
                    {urgentCount} URGENT
                  </button>
                )}
                {warningCount > 0 && (
                  <button
                    onClick={() => scrollToSection("warning")}
                    className="badge-warning cursor-pointer hover:scale-105 transition-transform"
                  >
                    {warningCount} WARNING
                  </button>
                )}
                {infoCount > 0 && (
                  <button
                    onClick={() => scrollToSection("info")}
                    className="badge-info cursor-pointer hover:scale-105 transition-transform"
                  >
                    {infoCount} INFO
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Email Capture (early access) ── */}
        <div className="brutal-card p-6 md:p-10 mb-8">
          <h2 className="font-mono font-bold text-xl md:text-2xl mb-2">
            Get your full report + deadline reminders
          </h2>
          <p className="font-sans text-gray-600 mb-6">
            We&apos;ll email you a detailed PDF report and send free reminders
            so you never miss a filing deadline.
          </p>

          {emailSubmitted ? (
            <div className="p-4 bg-green bg-opacity-30 border-3 border-black">
              <p className="font-mono font-bold text-sm">
                Report sent! Check your email for the PDF.
              </p>
            </div>
          ) : (
            <>
              <form
                onSubmit={handleEmailSubmit}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={isSubmitting}
                  className="flex-1 border-3 border-black p-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-yellow disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="brutal-btn brutal-btn-pink text-sm disabled:opacity-50"
                >
                  {isSubmitting ? "SENDING..." : "SEND MY REPORT"}
                </button>
              </form>
              {submitError && (
                <div className="mt-3 p-3 bg-red-50 border-3 border-red-500 text-red-700 font-sans text-sm">
                  {submitError}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Issues ── */}
        {output.results.length > 0 ? (
          <div className="mb-12">
            <h2 className="font-mono font-bold text-xl md:text-2xl mb-6">
              Your Compliance Issues{" "}
              <span className="highlight-yellow">({output.results.length})</span>
            </h2>

            {/* Celebrate no urgent issues */}
            {urgentCount === 0 && (warningCount > 0 || infoCount > 0) && (
              <div className="brutal-card p-6 mb-6 border-green" style={{ borderColor: "#22c55e" }}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">&#10003;</span>
                  <div>
                    <h3 className="font-mono font-bold text-lg" style={{ color: "#16a34a" }}>
                      No urgent issues found
                    </h3>
                    <p className="font-sans text-sm text-gray-600">
                      You&apos;ve avoided the big-ticket penalties. The items below are lower-priority but still worth addressing.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Grouped by severity with section anchors */}
            {urgentCount > 0 && (
              <div id="section-urgent" className="mb-2 scroll-mt-4">
                <h3 className="font-mono font-bold text-sm uppercase tracking-wide text-red-600 mb-3 flex items-center gap-2">
                  <span className="badge-urgent">{urgentCount} URGENT</span>
                  <span className="font-sans text-xs font-normal text-gray-500">— act on these immediately</span>
                </h3>
                {visibleResults.filter(r => r.severity === "urgent").map((result) => (
                  <IssueCard key={result.rule_id} result={result} />
                ))}
              </div>
            )}

            {warningCount > 0 && (
              <div id="section-warning" className="mb-2 scroll-mt-4">
                <h3 className="font-mono font-bold text-sm uppercase tracking-wide mb-3 flex items-center gap-2" style={{ color: "#ca8a04" }}>
                  <span className="badge-warning">{warningCount} WARNING</span>
                  <span className="font-sans text-xs font-normal text-gray-500">— address these soon</span>
                </h3>
                {visibleResults.filter(r => r.severity === "warning").map((result) => (
                  <IssueCard key={result.rule_id} result={result} />
                ))}
              </div>
            )}

            {infoCount > 0 && (
              <div id="section-info" className="mb-2 scroll-mt-4">
                <h3 className="font-mono font-bold text-sm uppercase tracking-wide mb-3 flex items-center gap-2" style={{ color: "#7c3aed" }}>
                  <span className="badge-info">{infoCount} INFO</span>
                  <span className="font-sans text-xs font-normal text-gray-500">— good to know</span>
                </h3>
                {visibleResults.filter(r => r.severity === "info").map((result) => (
                  <IssueCard key={result.rule_id} result={result} />
                ))}
              </div>
            )}

            {/* FIX #9: show all / show less toggle */}
            {hasMore && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="brutal-btn w-full text-sm mt-2"
              >
                {showAll
                  ? "SHOW LESS"
                  : `SHOW ALL ${output.results.length} ISSUES`}
              </button>
            )}
          </div>
        ) : (
          <div className="brutal-card p-8 mb-12 text-center">
            <h2 className="font-mono font-bold text-2xl mb-2">
              All clear!
            </h2>
            <p className="font-sans text-gray-600">
              Based on your answers, you appear to be on top of your NRI
              compliance obligations. Keep it up!
            </p>
          </div>
        )}

        {/* FIX #14: Share — all buttons same style (white), consistent */}
        <div className="brutal-card p-6 md:p-10 mb-8">
          <h2 className="font-mono font-bold text-xl md:text-2xl mb-2">
            Think your NRI friends are compliant?
          </h2>
          <p className="font-sans text-gray-600 mb-6">
            Share the quiz and find out.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleShare("twitter")}
              className="brutal-btn text-sm"
            >
              TWITTER / X
            </button>
            <button
              onClick={() => handleShare("linkedin")}
              className="brutal-btn text-sm"
            >
              LINKEDIN
            </button>
            <button
              onClick={() => handleShare("whatsapp")}
              className="brutal-btn text-sm"
            >
              WHATSAPP
            </button>
            <button
              onClick={() => handleShare("copy")}
              className="brutal-btn text-sm"
            >
              COPY LINK
            </button>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="brutal-card-lg p-8 md:p-12 text-center">
          <h2 className="font-mono font-bold text-xl md:text-3xl mb-3">
            Get ongoing protection
          </h2>
          <p className="font-sans text-gray-600 mb-6">
            Automated monitoring, deadline reminders, and guided fixes. Coming soon.
          </p>
          {waitlistSubmitted ? (
            <div className="p-4 bg-green bg-opacity-30 border-3 border-black">
              <p className="font-mono font-bold text-sm" style={{ color: "#16a34a" }}>
                You&apos;re on the list! We&apos;ll notify you when we launch.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (waitlistEmail) {
                  localStorage.setItem("alertdoc_waitlist_email", waitlistEmail);
                  setWaitlistSubmitted(true);
                }
              }}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            >
              <input
                type="email"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 border-3 border-black p-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-yellow"
              />
              <button
                type="submit"
                className="brutal-btn brutal-btn-pink text-sm"
              >
                GET UPDATES
              </button>
            </form>
          )}
          <p className="font-sans text-xs text-gray-400 mt-4">
            No spam. Just launch updates and early access.
          </p>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 px-6 md:px-12 py-10 border-t-3 border-black">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono font-bold text-sm">
            Built by NRIs, for NRIs.
          </p>
          <p className="font-sans text-xs text-gray-500">
            This is not legal or tax advice. Consult a qualified professional for
            your specific situation.
          </p>
        </div>
      </footer>
    </div>
  );
}
