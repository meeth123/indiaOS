import { Metadata } from "next";
import { Nav } from "@/components/shared/nav";
import { Footer } from "@/components/shared/footer";

export const metadata: Metadata = {
  title: "Terms of Use | AlertDoc",
  description: "AlertDoc terms of use — educational tool, not legal advice.",
};

export default function TermsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Nav />
      <article className="relative z-10 px-6 md:px-12 py-10 max-w-3xl mx-auto">
        <h1 className="font-mono font-bold text-3xl md:text-4xl tracking-tight mb-8">
          Terms of Use
        </h1>
        <div className="font-sans text-gray-800 leading-relaxed space-y-6 text-base md:text-lg">
          <p>
            <strong>Last updated:</strong> February 2026
          </p>
          <h2 className="font-mono font-bold text-xl mt-8 mb-3 highlight-yellow inline-block">
            Not Legal or Tax Advice
          </h2>
          <p>
            AlertDoc is an educational tool. The compliance quiz, reports, blog
            articles, and deadline calendar are for informational purposes only.
            They do not constitute legal, tax, or financial advice. Always
            consult a qualified CPA or tax attorney for decisions about your
            specific situation.
          </p>
          <h2 className="font-mono font-bold text-xl mt-8 mb-3 highlight-yellow inline-block">
            Accuracy
          </h2>
          <p>
            We make every effort to keep deadlines, penalty amounts, and
            compliance rules accurate and up to date. However, tax law changes
            frequently. AlertDoc is not liable for any errors, omissions, or
            outdated information.
          </p>
          <h2 className="font-mono font-bold text-xl mt-8 mb-3 highlight-yellow inline-block">
            Use of the Service
          </h2>
          <p>
            You may use AlertDoc for personal, non-commercial purposes. You
            agree not to scrape, reproduce, or redistribute our content without
            written permission.
          </p>
          <h2 className="font-mono font-bold text-xl mt-8 mb-3 highlight-yellow inline-block">
            Limitation of Liability
          </h2>
          <p>
            AlertDoc and its creators shall not be held liable for any damages
            arising from the use of this service, including but not limited to
            penalties, fines, or missed deadlines.
          </p>
          <h2 className="font-mono font-bold text-xl mt-8 mb-3 highlight-yellow inline-block">
            Contact
          </h2>
          <p>
            Questions? Reach us at{" "}
            <a
              href="mailto:hello@alertdoc.club"
              className="font-bold text-pink underline"
            >
              hello@alertdoc.club
            </a>
            .
          </p>
        </div>
      </article>
      <Footer />
    </div>
  );
}
