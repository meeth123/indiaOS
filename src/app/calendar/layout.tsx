import { Metadata } from "next";
import { calendarPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = calendarPageMetadata;

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
