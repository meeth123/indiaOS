import type { Metadata, Viewport } from "next";
import "./globals.css";
import { homePageMetadata } from "@/lib/seo/metadata";
import { organizationSchema } from "@/lib/seo/structured-data";
import { FacebookPixel } from "@/components/shared/fb-pixel";
import { FbPageView } from "@/components/shared/fb-page-view";

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://alertdoc.club";

export const metadata: Metadata = {
  ...homePageMetadata,
  metadataBase: new URL(baseUrl),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
      </head>
      <body className="font-sans text-black bg-offwhite min-h-screen antialiased">
        <FacebookPixel />
        <FbPageView />
        {children}
      </body>
    </html>
  );
}
