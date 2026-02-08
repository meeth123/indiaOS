import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IndiaOS — NRI Compliance Health Check",
  description:
    "2-minute compliance health check for NRIs. Find out what you're missing before the IRS or Indian tax department finds you.",
  keywords: [
    "NRI",
    "compliance",
    "FBAR",
    "FATCA",
    "Indian tax",
    "NRI tax",
    "PAN",
    "OCI",
    "FEMA",
  ],
  openGraph: {
    title: "IndiaOS — NRI Compliance Health Check",
    description:
      "2-minute compliance health check for NRIs. Find out what you're missing.",
    type: "website",
  },
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
      </head>
      <body className="font-sans text-black bg-offwhite min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
