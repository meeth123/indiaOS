import type { Metadata } from "next";
import { quizPageMetadata } from "@/lib/seo/metadata";
import { howToSchema, faqSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = quizPageMetadata;

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(howToSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      {children}
    </>
  );
}
