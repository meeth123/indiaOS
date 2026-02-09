import type { Metadata } from "next";
import { resultsPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = resultsPageMetadata;

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
