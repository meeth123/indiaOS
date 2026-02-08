/**
 * Comprehensive deadline database for NRI compliance obligations.
 *
 * IMPORTANT: All months are 1-indexed (1=January, 4=April, 12=December).
 * This matches human understanding. Utils will convert to 0-indexed for JavaScript Date.
 *
 * Sources:
 * - IRS.gov (US tax deadlines)
 * - IncometaxIndia.gov.in (India tax deadlines)
 * - FinCEN (FBAR deadlines)
 * - Research compiled 2026-02-08
 */

import { Deadline } from "./types";

// ============================================================================
// US TAX DEADLINES
// ============================================================================

export const US_TAX_DEADLINES: Deadline[] = [
  {
    id: "us_tax_return",
    formName: "Form 1040",
    officialName: "US Individual Income Tax Return",
    description: "Annual federal income tax return reporting all worldwide income",
    month: 4,  // April (1-indexed)
    day: 15,
    hasExtension: true,
    extensionMonth: 10,  // October (1-indexed)
    extensionDay: 15,
    extensionCondition: "File Form 4868 by April 15",
    category: "US_TAX",
    frequency: "annual",
    severity: "critical",
    applicability: "All US persons (citizens, green card holders, residents)",
    penaltyMin: 435,
    penaltyMax: 50000,
    penaltyDescription: "Failure to file: 5% of unpaid taxes per month, up to 25%. Minimum $435 or 100% of tax owed.",
  },
  {
    id: "fbar",
    formName: "FinCEN 114 (FBAR)",
    officialName: "Report of Foreign Bank and Financial Accounts",
    description: "Report foreign financial accounts if aggregate exceeds $10,000",
    month: 4,  // April
    day: 15,
    hasExtension: true,
    extensionMonth: 10,  // October
    extensionDay: 15,
    extensionCondition: "Automatic 6-month extension, no action required",
    category: "US_BANKING",
    frequency: "annual",
    severity: "critical",
    applicability: "US persons with foreign financial accounts exceeding $10K aggregate",
    penaltyMin: 10000,
    penaltyMax: 100000,
    penaltyDescription: "Civil penalties: $10K+ per account per year. Criminal penalties up to $500K and 10 years prison.",
    conditionalRules: {
      requiredAssets: ["bank_accounts", "nre_nro"],
    },
  },
  {
    id: "fatca_8938",
    formName: "Form 8938 (FATCA)",
    officialName: "Statement of Specified Foreign Financial Assets",
    description: "Report foreign financial assets if exceeding reporting thresholds",
    month: 4,  // April
    day: 15,
    hasExtension: true,
    extensionMonth: 10,  // October
    extensionDay: 15,
    extensionCondition: "Follows Form 1040 extension",
    category: "US_TAX",
    frequency: "annual",
    severity: "critical",
    applicability: "US taxpayers with foreign assets: $50K+ (single), $100K+ (MFJ) for US residents; $200K+ (single), $400K+ (MFJ) for expats",
    penaltyMin: 10000,
    penaltyMax: 60000,
    penaltyDescription: "$10K penalty plus $10K for each 30 days after IRS notice (up to $60K)",
  },
  {
    id: "pfic_8621",
    formName: "Form 8621 (PFIC)",
    officialName: "Information Return by Shareholder of Passive Foreign Investment Company",
    description: "Report Indian mutual funds and similar passive foreign investments",
    month: 4,  // April
    day: 15,
    hasExtension: true,
    extensionMonth: 10,  // October
    extensionDay: 15,
    extensionCondition: "Follows Form 1040 extension",
    category: "US_TAX",
    frequency: "annual",
    severity: "critical",
    applicability: "US persons holding Indian mutual funds or other PFICs",
    penaltyMin: 10000,
    penaltyMax: 50000,
    penaltyDescription: "Failure to file suspends statute of limitations. Punitive excess distribution tax can exceed 100% of gains.",
    conditionalRules: {
      requiredAssets: ["mutual_funds"],
    },
  },
  {
    id: "q1_estimated_tax",
    formName: "Form 1040-ES Q1",
    officialName: "Estimated Tax Payment - Quarter 1",
    description: "First quarter estimated tax payment for tax year",
    month: 4,  // April
    day: 15,
    hasExtension: false,
    category: "US_TAX",
    frequency: "quarterly",
    severity: "high",
    applicability: "Self-employed, rental income, or insufficient withholding (tax liability >$1,000)",
    penaltyMin: 0,
    penaltyMax: 5000,
    penaltyDescription: "Underpayment penalty: interest on shortfall calculated under IRC 6654",
  },
  {
    id: "q2_estimated_tax",
    formName: "Form 1040-ES Q2",
    officialName: "Estimated Tax Payment - Quarter 2",
    description: "Second quarter estimated tax payment",
    month: 6,  // June
    day: 15,
    hasExtension: false,
    category: "US_TAX",
    frequency: "quarterly",
    severity: "high",
    applicability: "Self-employed, rental income, or insufficient withholding",
    penaltyMin: 0,
    penaltyMax: 5000,
    penaltyDescription: "Underpayment penalty: interest on shortfall",
  },
  {
    id: "q3_estimated_tax",
    formName: "Form 1040-ES Q3",
    officialName: "Estimated Tax Payment - Quarter 3",
    description: "Third quarter estimated tax payment",
    month: 9,  // September
    day: 15,
    hasExtension: false,
    category: "US_TAX",
    frequency: "quarterly",
    severity: "high",
    applicability: "Self-employed, rental income, or insufficient withholding",
    penaltyMin: 0,
    penaltyMax: 5000,
    penaltyDescription: "Underpayment penalty: interest on shortfall",
  },
  {
    id: "q4_estimated_tax",
    formName: "Form 1040-ES Q4",
    officialName: "Estimated Tax Payment - Quarter 4",
    description: "Fourth quarter estimated tax payment (prior tax year)",
    month: 1,  // January
    day: 15,
    hasExtension: false,
    category: "US_TAX",
    frequency: "quarterly",
    severity: "high",
    applicability: "Self-employed, rental income, or insufficient withholding",
    penaltyMin: 0,
    penaltyMax: 5000,
    penaltyDescription: "Underpayment penalty: interest on shortfall",
  },
  {
    id: "extension_4868",
    formName: "Form 4868",
    officialName: "Application for Automatic Extension of Time to File",
    description: "Request 6-month extension to file Form 1040 (payment still due April 15)",
    month: 4,  // April
    day: 15,
    hasExtension: false,
    category: "US_TAX",
    frequency: "annual",
    severity: "medium",
    applicability: "Any US taxpayer needing additional time to file (not pay)",
    penaltyMin: 0,
    penaltyMax: 0,
    penaltyDescription: "No penalty for extension itself, but taxes owed must be paid by April 15",
  },
  {
    id: "extended_1040",
    formName: "Form 1040 (Extended)",
    officialName: "Extended Deadline for Form 1040",
    description: "Final deadline to file with approved extension",
    month: 10,  // October
    day: 15,
    hasExtension: false,
    category: "US_TAX",
    frequency: "annual",
    severity: "critical",
    applicability: "Taxpayers who filed Form 4868 by April 15",
    penaltyMin: 435,
    penaltyMax: 50000,
    penaltyDescription: "Failure to file by this date: 5% of unpaid taxes per month",
  },
  {
    id: "expat_extension",
    formName: "Form 1040 (Expat)",
    officialName: "Automatic 2-Month Extension for US Taxpayers Abroad",
    description: "Automatic extension for US taxpayers living outside the US",
    month: 6,  // June
    day: 15,
    hasExtension: true,
    extensionMonth: 10,  // October
    extensionDay: 15,
    extensionCondition: "Can extend further to Oct 15 with Form 4868",
    category: "US_TAX",
    frequency: "annual",
    severity: "critical",
    applicability: "US taxpayers residing outside the US on April 15",
    penaltyMin: 435,
    penaltyMax: 50000,
    penaltyDescription: "Taxes owed still due April 15; extension only for filing",
  },
  {
    id: "state_tax",
    formName: "State Tax Return",
    officialName: "State Income Tax Return (varies by state)",
    description: "State income tax return for most states",
    month: 4,  // April
    day: 15,
    hasExtension: true,
    extensionMonth: 10,  // October
    extensionDay: 15,
    extensionCondition: "Most states follow federal extension; check state requirements",
    category: "US_TAX",
    frequency: "annual",
    severity: "high",
    applicability: "US taxpayers residing in states with income tax",
    penaltyMin: 100,
    penaltyMax: 5000,
    penaltyDescription: "Varies by state; typically 5% per month up to 25%",
  },
];

// ============================================================================
// INDIA TAX DEADLINES
// ============================================================================

export const INDIA_TAX_DEADLINES: Deadline[] = [
  {
    id: "india_itr_1_2",
    formName: "ITR-1 & ITR-2",
    officialName: "Income Tax Return for Non-Audit Cases (ITR-1/ITR-2)",
    description: "Annual ITR for salary, capital gains, or property income (NRIs use ITR-2)",
    month: 7,  // July
    day: 31,
    hasExtension: false,
    category: "INDIA_TAX",
    frequency: "annual",
    severity: "critical",
    applicability: "Non-audit taxpayers with salary, capital gains, property income (NRIs cannot file ITR-1)",
    penaltyMin: 120,  // Rs 1,000 ~ $12
    penaltyMax: 600,  // Rs 5,000 ~ $60
    penaltyDescription: "Late fee up to Rs 5,000 under Section 234F. Interest at 1% per month under Section 234A.",
    conditionalRules: {
      customCondition: "Has Indian income or assets",
    },
  },
  {
    id: "india_itr_3_4",
    formName: "ITR-3 & ITR-4",
    officialName: "Income Tax Return for Business/Profession Income",
    description: "Annual ITR for business or professional income",
    month: 8,  // August
    day: 31,
    hasExtension: false,
    category: "INDIA_TAX",
    frequency: "annual",
    severity: "critical",
    applicability: "Non-audit taxpayers with business or professional income",
    penaltyMin: 120,  // Rs 1,000
    penaltyMax: 600,  // Rs 5,000
    penaltyDescription: "Late fee up to Rs 5,000 under Section 234F. Interest at 1% per month.",
  },
  {
    id: "belated_itr",
    formName: "Belated ITR",
    officialName: "Belated Income Tax Return",
    description: "Last date to file belated or revised return",
    month: 12,  // December
    day: 31,
    hasExtension: false,
    category: "INDIA_TAX",
    frequency: "annual",
    severity: "high",
    applicability: "All taxpayers who missed original filing deadline",
    penaltyMin: 120,  // Rs 1,000
    penaltyMax: 600,  // Rs 5,000
    penaltyDescription: "Late fee: Rs 5,000 (or Rs 1,000 if income below Rs 5 lakh)",
  },
  {
    id: "revised_itr",
    formName: "Revised ITR",
    officialName: "Revised Income Tax Return",
    description: "Last date to file revised return to correct errors",
    month: 3,  // March
    day: 31,
    hasExtension: false,
    category: "INDIA_TAX",
    frequency: "annual",
    severity: "medium",
    applicability: "All taxpayers correcting filed returns",
    penaltyMin: 120,  // Rs 1,000
    penaltyMax: 600,  // Rs 5,000
    penaltyDescription: "Extended from Dec 31 by Budget 2026; provides 3 extra months",
  },
  {
    id: "advance_tax_q1",
    formName: "Advance Tax Q1",
    officialName: "First Installment of Advance Tax",
    description: "Pay 15% of estimated annual tax liability",
    month: 6,  // June
    day: 15,
    hasExtension: false,
    category: "INDIA_TAX",
    frequency: "quarterly",
    severity: "high",
    applicability: "Taxpayers with tax liability exceeding Rs 10,000 after TDS",
    penaltyMin: 0,
    penaltyMax: 240,  // Rs 2,000
    penaltyDescription: "Interest at 1% per month under Sections 234B and 234C",
  },
  {
    id: "advance_tax_q2",
    formName: "Advance Tax Q2",
    officialName: "Second Installment of Advance Tax",
    description: "Pay cumulative 45% of estimated annual tax liability",
    month: 9,  // September
    day: 15,
    hasExtension: false,
    category: "INDIA_TAX",
    frequency: "quarterly",
    severity: "high",
    applicability: "Taxpayers with tax liability exceeding Rs 10,000 after TDS",
    penaltyMin: 0,
    penaltyMax: 240,  // Rs 2,000
    penaltyDescription: "Interest at 1% per month under Sections 234B and 234C",
  },
  {
    id: "advance_tax_q3",
    formName: "Advance Tax Q3",
    officialName: "Third Installment of Advance Tax",
    description: "Pay cumulative 75% of estimated annual tax liability",
    month: 12,  // December
    day: 15,
    hasExtension: false,
    category: "INDIA_TAX",
    frequency: "quarterly",
    severity: "high",
    applicability: "Taxpayers with tax liability exceeding Rs 10,000 after TDS",
    penaltyMin: 0,
    penaltyMax: 240,  // Rs 2,000
    penaltyDescription: "Interest at 1% per month under Sections 234B and 234C",
  },
  {
    id: "advance_tax_q4",
    formName: "Advance Tax Q4",
    officialName: "Fourth Installment of Advance Tax",
    description: "Pay 100% of estimated annual tax liability",
    month: 3,  // March
    day: 15,
    hasExtension: false,
    category: "INDIA_TAX",
    frequency: "quarterly",
    severity: "high",
    applicability: "Taxpayers with tax liability exceeding Rs 10,000 after TDS",
    penaltyMin: 0,
    penaltyMax: 240,  // Rs 2,000
    penaltyDescription: "Interest at 1% per month. Presumptive taxation taxpayers can pay entire amount by this date.",
  },
  {
    id: "tds_q1",
    formName: "TDS Return Q1",
    officialName: "TDS/TCS Return for Q1 (April-June)",
    description: "Quarterly TDS return for first quarter",
    month: 7,  // July
    day: 31,
    hasExtension: false,
    category: "INDIA_TAX",
    frequency: "quarterly",
    severity: "medium",
    applicability: "Tax deductors and collectors (employers, rent payers, etc.)",
    penaltyMin: 288,  // Rs 2,400
    penaltyMax: 1440,  // Rs 12,000
    penaltyDescription: "Rs 200 per day under Section 234E (max = TDS amount)",
  },
  {
    id: "tds_q2",
    formName: "TDS Return Q2",
    officialName: "TDS/TCS Return for Q2 (July-September)",
    description: "Quarterly TDS return for second quarter",
    month: 10,  // October
    day: 31,
    hasExtension: false,
    category: "INDIA_TAX",
    frequency: "quarterly",
    severity: "medium",
    applicability: "Tax deductors and collectors",
    penaltyMin: 288,  // Rs 2,400
    penaltyMax: 1440,  // Rs 12,000
    penaltyDescription: "Rs 200 per day under Section 234E",
  },
  {
    id: "tds_q3",
    formName: "TDS Return Q3",
    officialName: "TDS/TCS Return for Q3 (October-December)",
    description: "Quarterly TDS return for third quarter",
    month: 1,  // January
    day: 31,
    hasExtension: false,
    category: "INDIA_TAX",
    frequency: "quarterly",
    severity: "medium",
    applicability: "Tax deductors and collectors",
    penaltyMin: 288,  // Rs 2,400
    penaltyMax: 1440,  // Rs 12,000
    penaltyDescription: "Rs 200 per day under Section 234E",
  },
  {
    id: "tds_q4",
    formName: "TDS Return Q4",
    officialName: "TDS/TCS Return for Q4 (January-March)",
    description: "Quarterly TDS return for fourth quarter",
    month: 5,  // May
    day: 31,
    hasExtension: false,
    category: "INDIA_TAX",
    frequency: "quarterly",
    severity: "medium",
    applicability: "Tax deductors and collectors",
    penaltyMin: 288,  // Rs 2,400
    penaltyMax: 1440,  // Rs 12,000
    penaltyDescription: "Rs 200 per day under Section 234E",
  },
  {
    id: "form_67",
    formName: "Form 67",
    officialName: "Foreign Tax Credit Certificate",
    description: "Claim credit for foreign taxes paid to avoid double taxation",
    month: 7,  // July (before ITR deadline)
    day: 31,
    hasExtension: false,
    category: "INDIA_TAX",
    frequency: "annual",
    severity: "high",
    applicability: "NRIs who paid taxes abroad and need credit against Indian tax liability",
    penaltyMin: 0,
    penaltyMax: 0,
    penaltyDescription: "Must be filed before ITR due date; failure results in loss of foreign tax credit",
  },
];

// ============================================================================
// EVENT-BASED DEADLINES (No fixed annual date)
// ============================================================================

export const EVENT_BASED_DEADLINES: Deadline[] = [
  {
    id: "form_15ca_15cb",
    formName: "Form 15CA/15CB",
    officialName: "Certificate for Foreign Remittance",
    description: "Required before making foreign remittance to non-residents",
    month: 0,  // Event-based, no fixed date
    day: 0,
    hasExtension: false,
    category: "INDIA_BANKING",
    frequency: "event_based",
    severity: "high",
    applicability: "Anyone making payments to non-residents or foreign companies",
    penaltyMin: 0,
    penaltyMax: 1200,  // Rs 1 lakh
    penaltyDescription: "Rs 1 lakh penalty under Section 271-I. Bank may refuse transfer without certificate.",
  },
  {
    id: "form_26qb",
    formName: "Form 26QB",
    officialName: "TDS on Property Purchase",
    description: "TDS return for property transactions (within 30 days)",
    month: 0,  // Event-based
    day: 0,
    hasExtension: false,
    category: "INDIA_TAX",
    frequency: "event_based",
    severity: "critical",
    applicability: "Buyers of immovable property valued over Rs 50 lakh",
    penaltyMin: 1440,  // Rs 12,000
    penaltyMax: 14400,  // Rs 1.2 lakh
    penaltyDescription: "Interest at 1% per month. Disallowance of purchase for buyer.",
  },
  {
    id: "form_26qc",
    formName: "Form 26QC",
    officialName: "TDS on Rent Payments",
    description: "TDS return for rent payments (within 30 days of month end)",
    month: 0,  // Event-based
    day: 0,
    hasExtension: false,
    category: "INDIA_TAX",
    frequency: "event_based",
    severity: "medium",
    applicability: "Individuals/HUFs paying rent exceeding Rs 50,000 per month",
    penaltyMin: 288,  // Rs 2,400
    penaltyMax: 2880,  // Rs 24,000
    penaltyDescription: "Interest at 1% per month on delayed payment",
  },
];

// ============================================================================
// INDIA IDENTITY & BANKING DEADLINES
// ============================================================================

export const INDIA_IDENTITY_DEADLINES: Deadline[] = [
  {
    id: "pan_aadhaar_link",
    formName: "PAN-Aadhaar Linking",
    officialName: "Link Permanent Account Number with Aadhaar",
    description: "One-time mandatory linking to keep PAN operative",
    month: 6,  // June
    day: 30,
    hasExtension: false,
    category: "INDIA_IDENTITY",
    frequency: "one_time",
    severity: "critical",
    applicability: "All PAN holders in India (unless exempt)",
    penaltyMin: 12,  // Rs 1,000
    penaltyMax: 12,  // Rs 1,000
    penaltyDescription: "Rs 1,000 late fee. PAN becomes inoperative leading to 20% TDS deduction.",
  },
  {
    id: "oci_update",
    formName: "OCI Card Update",
    officialName: "OCI Card Update After Passport Renewal",
    description: "Update OCI card when passport is renewed (before age 20 or after 50)",
    month: 0,  // Event-based
    day: 0,
    hasExtension: false,
    category: "INDIA_IDENTITY",
    frequency: "event_based",
    severity: "medium",
    applicability: "OCI holders who renewed passport before age 20 or after age 50",
    penaltyMin: 0,
    penaltyMax: 60,  // Rs 5,000
    penaltyDescription: "Entry to India may be denied. Possible deportation and blacklisting.",
  },
  {
    id: "bank_kyc_update",
    formName: "Bank KYC Update",
    officialName: "Know Your Customer Update for NRI Accounts",
    description: "Update KYC details for NRI bank accounts",
    month: 12,  // December (typical annual deadline)
    day: 31,
    hasExtension: false,
    category: "INDIA_BANKING",
    frequency: "annual",
    severity: "medium",
    applicability: "NRIs with Indian bank accounts",
    penaltyMin: 0,
    penaltyMax: 0,
    penaltyDescription: "Account may be frozen or marked non-operational",
  },
  {
    id: "property_tax",
    formName: "Property Tax",
    officialName: "Municipal Property Tax Payment",
    description: "Annual property tax payment to local municipal corporation",
    month: 6,  // June (varies by city; typical deadline)
    day: 30,
    hasExtension: false,
    category: "INDIA_BANKING",
    frequency: "annual",
    severity: "medium",
    applicability: "Property owners in India (including NRIs)",
    penaltyMin: 0,
    penaltyMax: 1200,  // Varies by city
    penaltyDescription: "1% interest per month on unpaid tax. Varies by municipality. Delhi MCD: June 30.",
  },
];

// ============================================================================
// COMBINED EXPORTS
// ============================================================================

/**
 * All deadlines combined (40+ deadlines).
 * Excludes event-based deadlines from this array as they need special handling.
 */
export const ALL_DEADLINES: Deadline[] = [
  ...US_TAX_DEADLINES,
  ...INDIA_TAX_DEADLINES,
  ...INDIA_IDENTITY_DEADLINES,
];

/**
 * All deadlines including event-based ones.
 * Use this for comprehensive deadline management.
 */
export const ALL_DEADLINES_INCLUDING_EVENTS: Deadline[] = [
  ...US_TAX_DEADLINES,
  ...INDIA_TAX_DEADLINES,
  ...EVENT_BASED_DEADLINES,
  ...INDIA_IDENTITY_DEADLINES,
];

/**
 * Deadlines organized by category for easy filtering.
 */
export const DEADLINES_BY_CATEGORY = {
  US_TAX: US_TAX_DEADLINES.filter((d) => d.category === "US_TAX"),
  US_BANKING: [...US_TAX_DEADLINES, ...EVENT_BASED_DEADLINES].filter(
    (d) => d.category === "US_BANKING"
  ),
  US_IMMIGRATION: [] as Deadline[],
  INDIA_TAX: [...INDIA_TAX_DEADLINES, ...EVENT_BASED_DEADLINES].filter(
    (d) => d.category === "INDIA_TAX"
  ),
  INDIA_BANKING: [...EVENT_BASED_DEADLINES, ...INDIA_IDENTITY_DEADLINES].filter(
    (d) => d.category === "INDIA_BANKING"
  ),
  INDIA_IDENTITY: INDIA_IDENTITY_DEADLINES.filter(
    (d) => d.category === "INDIA_IDENTITY"
  ),
};
