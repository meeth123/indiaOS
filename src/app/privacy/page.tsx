import { Metadata } from "next";
import { Nav } from "@/components/shared/nav";
import { Footer } from "@/components/shared/footer";

export const metadata: Metadata = {
  title: "Privacy Policy | AlertDoc",
  description: "AlertDoc privacy policy — how we handle your data.",
};

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Nav />
      <article className="relative z-10 px-6 md:px-12 py-10 max-w-3xl mx-auto">
        <h1 className="font-mono font-bold text-3xl md:text-4xl tracking-tight mb-8">
          Privacy Policy
        </h1>
        <div className="font-sans text-gray-800 leading-relaxed space-y-6 text-base md:text-lg">
          <p>
            <strong>Last updated:</strong> February 2026
          </p>
          <h2 className="font-mono font-bold text-xl mt-8 mb-3 highlight-yellow inline-block">
            What We Collect
          </h2>
          <p>
            When you take the AlertDoc compliance quiz, we collect the answers
            you provide (visa status, assets, filing history) and your email
            address if you request a PDF report. We do not collect names,
            addresses, SSNs, PANs, or financial account numbers.
          </p>
          <h2 className="font-mono font-bold text-xl mt-8 mb-3 highlight-yellow inline-block">
            How We Use It
          </h2>
          <p>
            Your quiz answers are used solely to generate your personalized
            compliance report. Your email is used to deliver the PDF report and
            nothing else. We do not sell, share, or rent your data to third
            parties.
          </p>
          <h2 className="font-mono font-bold text-xl mt-8 mb-3 highlight-yellow inline-block">
            Data Storage
          </h2>
          <p>
            Quiz results and emails are stored securely on Supabase
            (SOC2-compliant infrastructure). You can request deletion of your
            data at any time by contacting us.
          </p>
          <h2 className="font-mono font-bold text-xl mt-8 mb-3 highlight-yellow inline-block">
            Cookies
          </h2>
          <p>
            We use minimal analytics cookies to understand how people use
            AlertDoc. We do not use tracking cookies or share data with
            advertisers.
          </p>
          <h2 className="font-mono font-bold text-xl mt-8 mb-3 highlight-yellow inline-block">
            Contact
          </h2>
          <p>
            Questions about your data? Email us at{" "}
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
