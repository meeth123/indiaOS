import Link from "next/link";
import { Nav } from "@/components/shared/nav";
import { Footer } from "@/components/shared/footer";
import { CtaBanner } from "@/components/shared/cta-banner";
import type { BlogPostMeta } from "@/lib/blog";

export function ArticleLayout({
  meta,
  children,
}: {
  meta: BlogPostMeta;
  children: React.ReactNode;
}) {
  const formattedDate = new Date(meta.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Nav />

      <article className="relative z-10 px-6 md:px-12 py-10 max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 font-mono text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-pink">
            Home
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-pink">
            Blog
          </Link>
          <span>/</span>
          <span className="text-black">{meta.title}</span>
        </div>

        {/* Article Header */}
        <header className="mb-10">
          <h1 className="font-mono font-bold text-3xl md:text-4xl lg:text-5xl tracking-tight mb-4">
            {meta.title}
          </h1>
          <p className="font-sans text-lg text-gray-600 mb-4">
            {meta.description}
          </p>
          <div className="flex flex-wrap items-center gap-4 font-mono text-sm text-gray-500">
            <span className="badge-info">{meta.readingTime}</span>
            <span>{formattedDate}</span>
            <span>By {meta.author}</span>
          </div>
        </header>

        {/* Article Body */}
        <div className="article-body">{children}</div>

        {/* Bottom CTA */}
        <CtaBanner
          heading="Not sure what applies to you?"
          subtext="Take the 2-minute quiz to find your specific blind spots."
        />

        {/* Keywords */}
        <div className="flex flex-wrap gap-2 mt-8 mb-4">
          {meta.keywords.map((kw) => (
            <span
              key={kw}
              className="font-mono text-xs border-2 border-black px-2 py-1 bg-offwhite"
            >
              {kw}
            </span>
          ))}
        </div>
      </article>

      <Footer />
    </div>
  );
}
