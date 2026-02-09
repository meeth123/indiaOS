import { Metadata } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://alertdoc.club";

// Base keywords shared across all pages
const baseKeywords = [
  "NRI",
  "compliance",
  "FBAR",
  "FATCA",
  "Indian tax",
  "NRI tax",
  "PAN",
  "OCI",
  "FEMA",
  "Form 8938",
  "ITR",
  "Aadhaar",
  "NRO account",
  "NRE account",
  "US tax",
  "India tax",
  "Non-Resident Indian",
  "tax compliance",
  "foreign assets",
];

// Base metadata configuration (no keywords - those are page-specific)
export const baseMetadata = {
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

// Home page metadata
export const homePageMetadata: Metadata = {
  title: "AlertDoc — NRI Compliance Health Check",
  description:
    "2-minute compliance health check for NRIs. Find out what you're missing before the IRS or Indian tax department finds you.",
  keywords: [
    ...baseKeywords,
    "compliance check",
    "NRI quiz",
    "tax obligations",
    "compliance requirements",
  ],
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: "AlertDoc — NRI Compliance Health Check",
    description:
      "2-minute compliance health check for NRIs. Find out what you're missing.",
    type: "website",
    url: baseUrl,
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "AlertDoc - NRI Compliance Health Check",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AlertDoc — NRI Compliance Health Check",
    description:
      "2-minute compliance health check for NRIs. Find out what you're missing.",
    images: [`${baseUrl}/og-image.png`],
  },
  ...baseMetadata,
};

// Quiz page metadata
export const quizPageMetadata: Metadata = {
  title: "Take the NRI Compliance Quiz — AlertDoc",
  description:
    "Answer 12 simple questions to discover your NRI compliance blind spots. Learn about FBAR, FATCA, Indian ITR, PAN-Aadhaar linking, and more.",
  keywords: [
    ...baseKeywords,
    "compliance quiz",
    "NRI questionnaire",
    "tax assessment",
    "compliance test",
  ],
  alternates: {
    canonical: `${baseUrl}/quiz`,
  },
  openGraph: {
    title: "Take the NRI Compliance Quiz — AlertDoc",
    description:
      "Answer 12 simple questions to discover your NRI compliance blind spots.",
    type: "website",
    url: `${baseUrl}/quiz`,
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "AlertDoc Quiz - NRI Compliance Assessment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Take the NRI Compliance Quiz — AlertDoc",
    description:
      "Answer 12 simple questions to discover your NRI compliance blind spots.",
    images: [`${baseUrl}/og-image.png`],
  },
  ...baseMetadata,
};

// Results page metadata (noindex - user-specific)
export const resultsPageMetadata: Metadata = {
  title: "Your Compliance Results — AlertDoc",
  description:
    "Review your NRI compliance assessment results and learn what actions you need to take.",
  keywords: [...baseKeywords, "compliance results", "assessment report"],
  alternates: {
    canonical: `${baseUrl}/results`,
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Your Compliance Results — AlertDoc",
    description:
      "Review your NRI compliance assessment results and learn what actions you need to take.",
    type: "website",
    url: `${baseUrl}/results`,
  },
  twitter: {
    card: "summary",
    title: "Your Compliance Results — AlertDoc",
    description:
      "Review your NRI compliance assessment results and learn what actions you need to take.",
  },
  icons: baseMetadata.icons,
};

// Landing page variant 0 metadata
export const lp0PageMetadata: Metadata = {
  title: "AlertDoc — NRI Compliance Health Check (US Edition)",
  description:
    "Living in the US as an NRI? Take our 2-minute compliance check to find out what FBAR, FATCA, and Indian tax obligations you're missing.",
  keywords: [
    ...baseKeywords,
    "NRI US",
    "Indian American",
    "H1B compliance",
    "green card tax",
  ],
  alternates: {
    canonical: `${baseUrl}/lp0`,
  },
  openGraph: {
    title: "AlertDoc — NRI Compliance Health Check (US Edition)",
    description:
      "Living in the US as an NRI? Take our 2-minute compliance check.",
    type: "website",
    url: `${baseUrl}/lp0`,
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "AlertDoc - NRI Compliance for US Residents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AlertDoc — NRI Compliance Health Check (US Edition)",
    description:
      "Living in the US as an NRI? Take our 2-minute compliance check.",
    images: [`${baseUrl}/og-image.png`],
  },
  ...baseMetadata,
};

// Landing page variant 2 metadata
export const lp2PageMetadata: Metadata = {
  title: "AlertDoc — Find Your NRI Compliance Blind Spots in 2 Minutes",
  description:
    "Most NRIs miss critical filing deadlines. Our free quiz reveals exactly what you're missing for FBAR, FATCA, PAN-Aadhaar, and Indian ITR compliance.",
  keywords: [
    ...baseKeywords,
    "compliance deadline",
    "filing requirements",
    "NRI checklist",
  ],
  alternates: {
    canonical: `${baseUrl}/lp2`,
  },
  openGraph: {
    title: "AlertDoc — Find Your NRI Compliance Blind Spots in 2 Minutes",
    description:
      "Most NRIs miss critical filing deadlines. Our free quiz reveals what you're missing.",
    type: "website",
    url: `${baseUrl}/lp2`,
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "AlertDoc - NRI Compliance Blind Spots",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AlertDoc — Find Your NRI Compliance Blind Spots in 2 Minutes",
    description:
      "Most NRIs miss critical filing deadlines. Our free quiz reveals what you're missing.",
    images: [`${baseUrl}/og-image.png`],
  },
  ...baseMetadata,
};

// Helper function to generate page-specific metadata
export function generatePageMetadata(
  page: "home" | "quiz" | "results" | "lp0" | "lp2"
): Metadata {
  switch (page) {
    case "home":
      return homePageMetadata;
    case "quiz":
      return quizPageMetadata;
    case "results":
      return resultsPageMetadata;
    case "lp0":
      return lp0PageMetadata;
    case "lp2":
      return lp2PageMetadata;
    default:
      return homePageMetadata;
  }
}
