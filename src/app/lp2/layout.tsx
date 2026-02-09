import type { Metadata } from "next";
import { lp2PageMetadata } from "@/lib/seo/metadata";
import { webApplicationSchema, faqSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = lp2PageMetadata;

export default function LP2Layout({
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
