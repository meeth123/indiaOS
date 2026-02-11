import { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getAllSlugs, getPostBySlug } from "@/lib/blog";
import { blogArticleMetadata } from "@/lib/seo/metadata";
import { articleSchema } from "@/lib/seo/structured-data";
import { ArticleLayout } from "@/components/blog/article-layout";
import { mdxComponents } from "@/components/blog/mdx-components";
import { CtaBanner } from "@/components/shared/cta-banner";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return blogArticleMetadata(post);
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const schema = articleSchema(post);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <ArticleLayout
        meta={{
          slug: post.slug,
          title: post.title,
          description: post.description,
          date: post.date,
          keywords: post.keywords,
          author: post.author,
          readingTime: post.readingTime,
        }}
      >
        <MDXRemote
          source={post.content}
          options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          components={{
            ...mdxComponents,
            CtaBanner,
          }}
        />
      </ArticleLayout>
    </>
  );
}
