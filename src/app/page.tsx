"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ── Gradient Blobs ── */}
      <div className="blob-purple" style={{ top: "-100px", left: "-100px" }} />
      <div
        className="blob-green"
        style={{ bottom: "-100px", right: "-100px" }}
      />

      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <Link href="/" className="inline-block">
          <span className="highlight-yellow font-mono font-bold text-xl tracking-tight border-3 border-black px-3 py-1">
            INDIAOS
          </span>
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
        <h1 className="font-mono font-bold text-4xl md:text-6xl lg:text-7xl tracking-tight mb-6 flex flex-col items-start gap-1">
          <span>You left India.</span>
          <span className="highlight-pink">
            India didn&apos;t leave
          </span>
          <span>your paperwork.</span>
        </h1>

        <div className="brutal-card p-6 md:p-8 max-w-2xl mb-10">
          <p className="text-lg md:text-xl font-sans leading-relaxed">
            <span className="highlight-yellow font-bold">
              2-minute compliance health check.
            </span>{" "}
            Find out what you&apos;re missing &mdash; before the IRS or Indian
            tax department finds you.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link href="/quiz" className="brutal-btn brutal-btn-pink text-lg">
            CHECK NOW
          </Link>
          <a href="#how-it-works" className="brutal-btn text-lg">
            LEARN MORE
          </a>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="relative z-10 px-6 md:px-12 py-16 max-w-6xl mx-auto">
        <h2 className="font-mono font-bold text-2xl md:text-3xl text-center mb-12">
          The numbers are{" "}
          <span className="highlight-yellow">terrifying.</span>
        </h2>
        {/* FIX #6: items-stretch so all stat cards have equal height */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {[
            {
              stat: "$10,000+",
              sub: "per account",
              desc: "FBAR penalty for not reporting foreign bank accounts",
            },
            {
              stat: "100 Million",
              sub: "PANs",
              desc: "went inoperative due to Aadhaar non-linkage",
            },
            {
              stat: "$25,000+",
              sub: "penalty",
              desc: "FATCA penalties for unreported foreign financial assets",
            },
            {
              stat: "4.4 Million",
              sub: "Indian Americans",
              desc: "potentially affected by cross-border compliance gaps",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="brutal-card p-6 flex flex-col items-center text-center"
            >
              <span className="font-mono font-bold text-3xl md:text-4xl text-black">
                {item.stat}
              </span>
              <span className="font-mono font-bold text-sm text-pink uppercase tracking-wide mt-1">
                {item.sub}
              </span>
              <p className="text-sm mt-3 font-sans text-gray-700">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        className="relative z-10 px-6 md:px-12 py-20 max-w-5xl mx-auto"
      >
        <h2 className="font-mono font-bold text-2xl md:text-3xl text-center mb-14">
          How it <span className="highlight-yellow">works</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Answer 5 questions",
              desc: "About your NRI status, Indian assets, income, and documents. Takes under 2 minutes.",
            },
            {
              step: "02",
              title: "Get your score",
              desc: "Our rules engine checks 15 compliance obligations and gives you a score out of 100.",
            },
            {
              step: "03",
              title: "Fix what matters",
              desc: "Prioritized list of what to fix first, with step-by-step instructions and estimated costs.",
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

      {/* ── Final CTA ── */}
      <section className="relative z-10 px-6 md:px-12 py-20 max-w-4xl mx-auto text-center">
        <div className="brutal-card-lg p-10 md:p-14">
          {/* FIX #2: nowrap so "under 40." doesn't break across lines on tablet */}
          <h2 className="font-mono font-bold text-2xl md:text-4xl mb-4">
            Most NRIs score{" "}
            <span className="highlight-pink whitespace-nowrap">under 40.</span>
          </h2>
          <p className="font-sans text-lg text-gray-700 mb-8">
            What&apos;s yours?
          </p>
          <Link href="/quiz" className="brutal-btn brutal-btn-pink text-xl">
            CHECK NOW
          </Link>
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
            &copy; {new Date().getFullYear()} IndiaOS. Not legal or tax advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
