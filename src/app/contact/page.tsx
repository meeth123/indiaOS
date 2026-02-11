import { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/shared/nav";
import { Footer } from "@/components/shared/footer";

export const metadata: Metadata = {
  title: "Contact | AlertDoc",
  description: "Get in touch with the AlertDoc team.",
};

export default function ContactPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Nav />
      <section className="relative z-10 px-6 md:px-12 py-10 max-w-3xl mx-auto">
        <h1 className="font-mono font-bold text-3xl md:text-4xl tracking-tight mb-8">
          Contact Us
        </h1>
        <div className="font-sans text-gray-800 leading-relaxed space-y-6 text-base md:text-lg">
          <p>
            Have questions, found a bug, or want to suggest an improvement?
            We&apos;d love to hear from you.
          </p>
          <div className="brutal-card p-6 space-y-4">
            <p>
              <strong className="font-mono">Email:</strong>{" "}
              <a
                href="mailto:hello@alertdoc.club"
                className="font-bold text-pink underline"
              >
                hello@alertdoc.club
              </a>
            </p>
            <p className="text-sm text-gray-500">
              We typically respond within 24-48 hours.
            </p>
          </div>
          <p>
            Meanwhile, you can{" "}
            <Link href="/quiz" className="font-bold text-pink underline">
              take the free compliance quiz
            </Link>{" "}
            or browse the{" "}
            <Link href="/blog" className="font-bold text-pink underline">
              blog
            </Link>{" "}
            for NRI tax guides.
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
