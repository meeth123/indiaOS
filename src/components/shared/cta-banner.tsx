"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/fb-pixel";

export function CtaBanner({
  heading = "Find out what applies to you",
  subtext = "2 minutes. No jargon. Personalized to your situation.",
}: {
  heading?: string;
  subtext?: string;
}) {
  return (
    <div className="brutal-card p-6 md:p-8 text-center my-10">
      <h3 className="font-mono font-bold text-xl md:text-2xl mb-2">
        {heading}
      </h3>
      <p className="font-sans text-gray-700 mb-4">{subtext}</p>
      <Link
        href="/quiz"
        className="brutal-btn brutal-btn-pink"
        onClick={() =>
          trackEvent("Lead", { content_name: "CTA: Check Your Risk Score" })
        }
      >
        CHECK YOUR RISK SCORE
      </Link>
    </div>
  );
}
