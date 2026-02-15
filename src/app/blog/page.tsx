import Link from "next/link";
import { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { blogListingMetadata } from "@/lib/seo/metadata";
import { Nav } from "@/components/shared/nav";
import { Footer } from "@/components/shared/footer";
import { CtaBanner } from "@/components/shared/cta-banner";

export const metadata: Metadata = blogListingMetadata;

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Nav />

      <section className="relative z-10 px-6 md:px-12 pt-10 pb-20 max-w-5xl mx-auto">
        <p className="font-mono font-bold text-sm uppercase tracking-wider text-gray-500 mb-6">
          AlertDoc Blog
        </p>
        <h1 className="font-mono font-bold text-3xl md:text-5xl tracking-tight mb-4 leading-[1.6] md:leading-[1.67]">
          NRI Compliance{" "}
          <span className="highlight-yellow">Guides &amp; Resources</span>
        </h1>
        <p className="font-sans text-lg text-gray-600 mb-12 max-w-2xl">
          Everything you need to know about FBAR, FATCA, Indian ITR, PAN,
          and other compliance obligations for NRIs in the USA.
        </p>

        {posts.length === 0 ? (
          <div className="brutal-card p-8 text-center">
            <p className="font-mono font-bold text-lg">
              Articles coming soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="brutal-card p-6 md:p-8 flex flex-col hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="badge-info">{post.readingTime}</span>
                  <span className="font-mono text-xs text-gray-500">
                    {new Date(post.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <h2 className="font-mono font-bold text-xl md:text-2xl mb-2 flex-1">
                  {post.title}
                </h2>
                <p className="font-sans text-sm text-gray-600 leading-relaxed mb-4">
                  {post.description}
                </p>
                <span className="font-mono text-sm font-bold text-pink">
                  READ MORE &rarr;
                </span>
              </Link>
            ))}
          </div>
        )}

        <CtaBanner
          heading="Not sure what applies to you?"
          subtext="Take the 2-minute quiz to find your specific compliance blind spots."
        />
      </section>

      <Footer />
    </div>
  );
}
