import type { Metadata } from "next";
import { lp0PageMetadata } from "@/lib/seo/metadata";
import { webApplicationSchema, faqSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = lp0PageMetadata;

export default function LP0Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webApplicationSchema),
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
