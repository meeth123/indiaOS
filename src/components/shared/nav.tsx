"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-4">
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

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-4">
        <Link
          href="/blog"
          className="font-mono text-sm font-bold border-3 border-black px-4 py-2 hover:bg-yellow transition-colors"
        >
          BLOG
        </Link>
        <Link
          href="/calendar"
          className="font-mono text-sm font-bold border-3 border-black px-4 py-2 hover:bg-yellow transition-colors"
        >
          DEADLINES
        </Link>
        <Link
          href="/quiz"
          className="brutal-btn brutal-btn-pink text-sm"
        >
          CHECK RISK SCORE
        </Link>
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden flex flex-col justify-center items-center w-10 h-10 border-3 border-black bg-white"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span
          className={`block w-5 h-0.5 bg-black transition-all duration-200 ${
            menuOpen ? "rotate-45 translate-y-1" : ""
          }`}
        />
        <span
          className={`block w-5 h-0.5 bg-black my-1 transition-all duration-200 ${
            menuOpen ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block w-5 h-0.5 bg-black transition-all duration-200 ${
            menuOpen ? "-rotate-45 -translate-y-1" : ""
          }`}
        />
      </button>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-offwhite border-b-3 border-black px-6 py-6 flex flex-col gap-4 md:hidden z-50">
          <Link
            href="/blog"
            className="font-mono text-sm font-bold border-3 border-black px-4 py-3 hover:bg-yellow transition-colors text-center"
            onClick={() => setMenuOpen(false)}
          >
            BLOG
          </Link>
          <Link
            href="/calendar"
            className="font-mono text-sm font-bold border-3 border-black px-4 py-3 hover:bg-yellow transition-colors text-center"
            onClick={() => setMenuOpen(false)}
          >
            DEADLINES
          </Link>
          <Link
            href="/quiz"
            className="brutal-btn brutal-btn-pink text-sm text-center"
            onClick={() => setMenuOpen(false)}
          >
            CHECK RISK SCORE
          </Link>
        </div>
      )}
    </nav>
  );
}
