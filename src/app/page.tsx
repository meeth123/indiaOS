"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getNextDeadline,
  getDeadlineColor,
  formatDeadlineDate,
} from "@/lib/deadlines";

export default function Home() {
  const [nextDeadline, setNextDeadline] = useState<{
    name: string;
    daysLeft: number;
    date: string;
  } | null>(null);

  useEffect(() => {
    const deadline = getNextDeadline();

    if (deadline) {
      setNextDeadline({
        name: deadline.isExtension
          ? `${deadline.formName} (Extension)`
          : deadline.formName,
        daysLeft: deadline.daysLeft,
        date: formatDeadlineDate(deadline.date),
      });
    }

    const now = new Date();
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const midnightTimer = setTimeout(() => {
      const updatedDeadline = getNextDeadline();
      if (updatedDeadline) {
        setNextDeadline({
          name: updatedDeadline.isExtension
            ? `${updatedDeadline.formName} (Extension)`
            : updatedDeadline.formName,
          daysLeft: updatedDeadline.daysLeft,
          date: formatDeadlineDate(updatedDeadline.date),
        });
      }
    }, timeUntilMidnight);

    return () => clearTimeout(midnightTimer);
  }, []);

  const deadlineColor = nextDeadline
    ? getDeadlineColor(nextDeadline.daysLeft)
    : "#22c55e";

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ── Deadline Banner ── */}
      {nextDeadline && (
        <div className="relative z-10 bg-black text-white px-6 py-3 text-center">
          <p className="font-mono font-bold text-sm">
            Next deadline worth knowing about:{" "}
            <span style={{ color: deadlineColor }}>
              {nextDeadline.name} &mdash; {nextDeadline.date}
            </span>
            {" — "}
            <span className="highlight-pink">{nextDeadline.daysLeft} days left</span>
          </p>
        </div>
      )}

      {/* ── Gradient Blobs ── */}
      <div className="blob-purple" style={{ top: "-100px", left: "-100px" }} />
      <div
        className="blob-green"
        style={{ bottom: "-100px", right: "-100px" }}
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
            className="h-28 w-auto md:h-32"
          />
        </Link>
        <div className="hidden md:flex items-center gap-4">
          <a
            href="#how-it-works"
            className="font-mono text-sm font-bold border-3 border-black px-4 py-2 hover:bg-yellow transition-colors"
          >
            HOW IT WORKS
          </a>
          <a
            href="#about"
            className="font-mono text-sm font-bold border-3 border-black px-4 py-2 hover:bg-yellow transition-colors"
          >
            ABOUT
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 px-6 md:px-12 pt-16 md:pt-24 pb-20 max-w-5xl mx-auto">
        <p className="font-mono font-bold text-sm uppercase tracking-wider text-gray-500 mb-4">
          NRI Compliance Health Check
        </p>
        <h1 className="font-mono font-bold text-4xl md:text-6xl lg:text-7xl tracking-tight mb-6 flex flex-col items-start gap-1">
          <span>Don&apos;t let paperwork</span>
          <span className="highlight-yellow">undo your life.</span>
        </h1>

        <div className="brutal-card p-6 md:p-8 max-w-2xl mb-10">
          <p className="text-lg md:text-xl font-sans leading-relaxed">
            FBAR, PAN, Indian ITR, OCI &mdash;{" "}
            <span className="highlight-yellow font-bold">
              2 minutes to see where you stand.
            </span>{" "}
            What applies to you, what doesn&apos;t, and what to do next.
            Personalized to your situation.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link href="/quiz" className="brutal-btn brutal-btn-pink text-lg">
            CHECK RISK SCORE
          </Link>
          <a href="#how-it-works" className="brutal-btn text-lg">
            SEE HOW IT WORKS
          </a>
        </div>

        <p className="font-mono font-bold text-sm mt-6 text-gray-600">
          <span className="highlight-yellow">2,000+</span> NRIs have checked.
          Average person finds 2&ndash;3 blind spots.
        </p>
      </section>

      {/* ── Blind Spots ── */}
      <section className="relative z-10 px-6 md:px-12 py-16 max-w-6xl mx-auto">
        <h2 className="font-mono font-bold text-2xl md:text-3xl text-center mb-4">
          The blind spots most NRIs{" "}
          <span className="highlight-yellow">don&apos;t know they have</span>
        </h2>
        <p className="font-sans text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          It&apos;s not that you&apos;re doing something wrong. The rules are
          just scattered across two countries and nobody gives you the full
          picture.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
          {[
            {
              label: "FBAR",
              what: "Indian accounts over $10K combined?",
              detail:
                "There's a US filing for that. Most NRIs have never heard of it — but if you have a savings account, FDs, or PPF, it probably applies.",
              badge: "badge-info",
              badgeText: "MOST COMMON",
            },
            {
              label: "PAN STATUS",
              what: "Is your PAN card still active?",
              detail:
                "100M+ PAN cards were deactivated in 2023. If yours was one of them, your FD interest is being taxed at a higher rate and you might not know it.",
              badge: "badge-warning",
              badgeText: "QUICK CHECK",
            },
            {
              label: "INDIAN ITR",
              what: "Do you need to file Indian taxes?",
              detail:
                "If you have any Indian income — even FD interest — you likely need to file. Filing correctly as NRI actually gets you better tax treatment.",
              badge: "badge-info",
              badgeText: "GOOD TO KNOW",
            },
            {
              label: "FATCA / OCI / NRO",
              what: "There are more than you think.",
              detail:
                "FATCA kicks in above $200K in assets. OCI cards expire. Savings accounts need converting. Each one is straightforward — once you know about it.",
              badge: "badge-warning",
              badgeText: "CHECK YOURS",
            },
          ].map((item, i) => (
            <div key={i} className="brutal-card p-6 md:p-8 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono font-bold text-sm text-purple uppercase tracking-wider">
                  {item.label}
                </span>
                <span className={item.badge} style={{ flexShrink: 0 }}>
                  {item.badgeText}
                </span>
              </div>
              <h3 className="font-mono font-bold text-lg md:text-xl mb-2">
                {item.what}
              </h3>
              <p className="font-sans text-gray-700 leading-relaxed text-sm flex-1">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Community Data ── */}
      <section className="relative z-10 px-6 md:px-12 py-16 max-w-5xl mx-auto">
        <h2 className="font-mono font-bold text-2xl md:text-3xl text-center mb-10">
          What <span className="highlight-yellow">2,000+ NRIs</span> discovered
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: blind spot frequency */}
          <div className="brutal-card p-6 md:p-8">
            <h3 className="font-mono font-bold text-lg mb-6">
              Most common blind spots
            </h3>
            {[
              {
                issue: "Didn't know about FBAR",
                pct: "73%",
                badge: "badge-info",
              },
              {
                issue: "PAN not linked to Aadhaar",
                pct: "68%",
                badge: "badge-warning",
              },
              {
                issue: "Indian ITR not filed as NRI",
                pct: "61%",
                badge: "badge-info",
              },
              {
                issue: "Bank KYC not updated",
                pct: "57%",
                badge: "badge-warning",
              },
              {
                issue: "Savings account not converted to NRO",
                pct: "52%",
                badge: "badge-warning",
              },
            ].map((item) => (
              <div
                key={item.issue}
                className="flex items-center justify-between gap-3 mb-4"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={item.badge} style={{ flexShrink: 0 }}>
                    {item.pct}
                  </span>
                  <span className="font-sans text-sm">{item.issue}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Right: what people said */}
          <div className="brutal-card p-6 md:p-8">
            <h3 className="font-mono font-bold text-lg mb-6">
              What they said after
            </h3>
            <div className="space-y-5">
              {[
                {
                  quote:
                    "I had 3 blind spots I didn't know about — including a filing I'd never heard of. Really glad I checked.",
                  who: "Priya S., Seattle",
                },
                {
                  quote:
                    "For the first time, I actually know where I stand with my India paperwork. That clarity is worth a lot.",
                  who: "Vikram R., Austin",
                },
                {
                  quote:
                    "I sent it to 3 friends right after. One of them had no idea about FBAR. She thanked me for a week.",
                  who: "Deepa V., San Francisco",
                },
              ].map((item) => (
                <div key={item.who}>
                  <p className="font-sans text-sm italic leading-relaxed text-gray-700">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <p className="font-mono text-xs font-bold mt-1">
                    &mdash; {item.who}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        className="relative z-10 px-6 md:px-12 py-20 max-w-5xl mx-auto"
      >
        <h2 className="font-mono font-bold text-2xl md:text-3xl text-center mb-14">
          Know where you stand in{" "}
          <span className="highlight-yellow">3 steps</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Answer 10 simple questions",
              desc: "When did you move? What accounts do you have? Own property? No jargon — just straightforward life questions. Takes 2 minutes.",
            },
            {
              step: "02",
              title: "See what you know — and what you don't",
              desc: "Get a personalized score showing what's covered, what's not, and what you might want to look into. Color-coded. In plain English.",
            },
            {
              step: "03",
              title: "Handle it on your terms",
              desc: "Clear next steps for each blind spot — what to do, how to do it, and who can help if you need a professional. No scrambling.",
            },
          ].map((item, i) => (
            <div key={i} className="brutal-card p-6 md:p-8">
              <span className="font-mono font-bold text-5xl text-yellow">
                {item.step}
              </span>
              <h3 className="font-mono font-bold text-xl mt-4 mb-3">
                {item.title}
              </h3>
              <p className="font-sans text-gray-700 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Share / Friend Prompt ── */}
      <section className="relative z-10 px-6 md:px-12 py-16 max-w-4xl mx-auto">
        <div className="brutal-card p-6 md:p-10 text-center">
          <h2 className="font-mono font-bold text-xl md:text-2xl mb-4">
            Know someone who should{" "}
            <span className="highlight-pink">check?</span>
          </h2>
          <p className="font-sans text-gray-700 max-w-lg mx-auto mb-6 leading-relaxed">
            Most NRIs have 2&ndash;3 blind spots they don&apos;t know about.
            Your friends and family probably do too. Being a good friend
            sometimes means sending a link they didn&apos;t know they needed.
          </p>
          <div className="brutal-card inline-block p-4 md:p-6 text-left max-w-lg mx-auto mb-6">
            <p className="font-sans text-sm text-gray-700 italic leading-relaxed">
              &ldquo;Hey, I just checked my NRI compliance score &mdash; things
              like FBAR, PAN, Indian ITR. Found a couple things I didn&apos;t
              know about. You should check yours, it&apos;s free and takes 2
              mins &rarr; alertdoc.club&rdquo;
            </p>
            <p className="font-mono text-xs text-gray-500 mt-2">
              Pre-written. Copy and send.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <button className="brutal-btn brutal-btn-yellow text-sm">
              COPY MESSAGE
            </button>
            <button className="brutal-btn text-sm">SHARE VIA WHATSAPP</button>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 px-6 md:px-12 py-20 max-w-4xl mx-auto text-center">
        <div className="brutal-card-lg p-10 md:p-14">
          <h2 className="font-mono font-bold text-2xl md:text-4xl mb-4">
            Don&apos;t let paperwork{" "}
            <span className="highlight-yellow whitespace-nowrap">undo your life.</span>
          </h2>
          <p className="font-sans text-lg text-gray-700 mb-3">
            2 minutes. No jargon. See exactly where you stand.
          </p>
          <p className="font-sans text-sm text-gray-500 mb-8">
            No credit card. No login required. Just 10 questions and your
            personalized compliance score.
          </p>
          <Link href="/quiz" className="brutal-btn brutal-btn-pink text-xl">
            CHECK RISK SCORE
          </Link>
          <p className="font-mono font-bold text-xs mt-6 text-gray-500">
            Join 2,000+ NRIs who stopped guessing and started knowing.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        id="about"
        className="relative z-10 px-6 md:px-12 py-10 border-t-3 border-black"
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono font-bold text-sm">
            Built by NRIs, for NRIs.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="font-mono text-sm font-bold hover:text-pink transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="font-mono text-sm font-bold hover:text-pink transition-colors"
            >
              Terms
            </a>
            <a
              href="#"
              className="font-mono text-sm font-bold hover:text-pink transition-colors"
            >
              Contact
            </a>
          </div>
          <p className="font-sans text-xs text-gray-500">
            &copy; {new Date().getFullYear()} AlertDoc. Not legal or tax advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
