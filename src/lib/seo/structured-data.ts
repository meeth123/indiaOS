const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://alertdoc.club";

// Organization schema for brand identity
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AlertDoc",
  alternateName: "AlertDoc - NRI Compliance Health Check",
  url: baseUrl,
  logo: `${baseUrl}/logo.png`,
  description:
    "AlertDoc helps Non-Resident Indians (NRIs) identify compliance blind spots across US and Indian tax obligations including FBAR, FATCA, ITR, PAN-Aadhaar linking, and FEMA regulations.",
  foundingDate: "2024",
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Customer Support",
    availableLanguage: ["English", "Hindi"],
  },
};

// WebApplication schema for the app
export const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AlertDoc",
  url: baseUrl,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Free 2-minute compliance health check for NRIs to identify missing FBAR, FATCA, Indian ITR, PAN-Aadhaar, and other tax obligations.",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "127",
    bestRating: "5",
    worstRating: "1",
  },
  featureList: [
    "FBAR filing requirement check",
    "FATCA Form 8938 assessment",
    "Indian ITR filing evaluation",
    "PAN-Aadhaar linking status",
    "NRO/NRE account compliance",
    "OCI card expiration tracking",
    "Personalized compliance report",
    "Deadline reminders",
  ],
};

// FAQ schema - Critical for AI-SEO and featured snippets
export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is FBAR and do I need to file it?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "FBAR (Foreign Bank Account Report) is required if the aggregate value of your foreign financial accounts exceeds $10,000 at any time during the calendar year. This includes Indian bank accounts (savings, current, NRO, NRE), fixed deposits, mutual funds, and other foreign assets. You must file FinCEN Form 114 electronically by April 15th (with automatic extension to October 15th). Penalties for non-filing start at $10,000 per year.",
      },
    },
    {
      "@type": "Question",
      name: "What is FATCA Form 8938?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "FATCA (Foreign Account Tax Compliance Act) Form 8938 must be filed with your US tax return if you have specified foreign financial assets above certain thresholds. For single filers living in the US, the threshold is $50,000 on the last day of the year or $75,000 at any time. Form 8938 has higher thresholds than FBAR and includes additional assets like foreign real estate held through entities and foreign pensions.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to file Indian ITR as an NRI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, you must file Indian Income Tax Return (ITR) if you have Indian-sourced income such as rental income, capital gains, interest from NRO accounts, or business income in India. Even if your total Indian income is below the basic exemption limit, filing ITR is recommended to maintain tax compliance records and avoid TDS (Tax Deducted at Source) complications. The deadline is typically July 31st.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if my PAN card is not linked to Aadhaar?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "If your PAN (Permanent Account Number) is not linked to Aadhaar by the deadline, your PAN becomes inoperative. This means you cannot file ITR, claim tax refunds, or conduct high-value financial transactions in India. NRIs and foreign citizens are exempt from mandatory PAN-Aadhaar linking if they don't have Aadhaar enrollment. You may need to provide documentation proving your NRI status to the Income Tax Department.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to convert my savings account to NRO?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, when you become an NRI, you must convert your resident savings account to an NRO (Non-Resident Ordinary) account or close it. Continuing to maintain a resident savings account as an NRI violates FEMA (Foreign Exchange Management Act) regulations. You should notify your bank about your change in residential status within a reasonable time. NRO accounts allow you to manage India-sourced income, while NRE (Non-Resident External) accounts are for repatriating foreign income to India.",
      },
    },
    {
      "@type": "Question",
      name: "What is OCI and does it expire?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "OCI (Overseas Citizen of India) is a lifelong visa that allows multiple entries to India. The OCI card itself requires renewal twice: once when you turn 20, and again when you turn 50 (if issued before age 20). After age 50, you only need to upload a new photo without getting a new card. OCI cardholders must carry a valid foreign passport along with the OCI card. Failure to renew can cause entry issues at Indian immigration.",
      },
    },
    {
      "@type": "Question",
      name: "How long does the AlertDoc quiz take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The AlertDoc compliance quiz takes approximately 2 minutes to complete. It consists of 12 simple yes/no questions about your NRI status, financial accounts, tax filings, and documentation. After completing the quiz, you immediately receive a personalized compliance report identifying which obligations apply to you, upcoming deadlines, and resources to help you get compliant.",
      },
    },
    {
      "@type": "Question",
      name: "What are the penalties for not filing FBAR?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "FBAR penalties are severe. Non-willful violations carry a penalty of up to $10,000 per year. Willful violations (intentional non-filing) can result in the greater of $100,000 or 50% of the account balance per year, plus potential criminal charges. The IRS has a 6-year statute of limitations for FBAR violations. If you've missed filing, you may qualify for the Streamlined Filing Compliance Procedures to avoid or reduce penalties.",
      },
    },
  ],
};

// HowTo schema for the quiz process
export const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Check Your NRI Compliance Status",
  description:
    "Complete the AlertDoc quiz to discover your NRI compliance blind spots in 2 minutes",
  totalTime: "PT2M",
  step: [
    {
      "@type": "HowToStep",
      name: "Start the Quiz",
      text: "Click 'Start Quiz' to begin your compliance assessment.",
      position: 1,
    },
    {
      "@type": "HowToStep",
      name: "Answer Questions About Your Status",
      text: "Answer questions about your NRI status, residency, income sources, and account holdings. All questions are simple yes/no format.",
      position: 2,
    },
    {
      "@type": "HowToStep",
      name: "Review Your Financial Accounts",
      text: "Provide information about your Indian bank accounts (NRO, NRE), fixed deposits, mutual funds, and real estate holdings.",
      position: 3,
    },
    {
      "@type": "HowToStep",
      name: "Check Documentation Status",
      text: "Confirm status of key documents: PAN-Aadhaar linking, OCI card validity, passport expiration.",
      position: 4,
    },
    {
      "@type": "HowToStep",
      name: "Get Your Compliance Report",
      text: "Receive a personalized report showing which obligations apply to you, upcoming deadlines, and recommended actions.",
      position: 5,
    },
  ],
};

// Helper function to inject structured data into page (for server-rendered HTML)
export function generateStructuredData(
  schemas: Array<typeof organizationSchema | typeof faqSchema>
): string {
  return schemas
    .map(
      (schema) =>
        `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`
    )
    .join("\n");
}
