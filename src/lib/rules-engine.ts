import {
  QuizAnswers,
  ComplianceResult,
  RulesEngineOutput,
  TriState,
  USState,
} from "./types";

/* ── Helpers ── */

function hasForeignAccounts(answers: QuizAnswers): boolean {
  return (
    answers.assets.includes("bank_accounts") ||
    answers.assets.includes("nre_nro")
  );
}

function hasMutualFunds(answers: QuizAnswers): boolean {
  return answers.assets.includes("mutual_funds");
}

function hasProperty(answers: QuizAnswers): boolean {
  return answers.assets.includes("property");
}

function hasLIC(answers: QuizAnswers): boolean {
  return answers.assets.includes("life_insurance");
}

function hasPPF(answers: QuizAnswers): boolean {
  return answers.assets.includes("ppf");
}

function hasAnyAssets(answers: QuizAnswers): boolean {
  return answers.assets.length > 0;
}

function hasIncomeFromIndia(answers: QuizAnswers): boolean {
  return (
    answers.incomeTypes.length > 0 && !answers.incomeTypes.includes("none")
  );
}

function hasRentalIncome(answers: QuizAnswers): boolean {
  return answers.incomeTypes.includes("rental");
}

function hasInterestIncome(answers: QuizAnswers): boolean {
  return answers.incomeTypes.includes("interest");
}

function hasStocks(answers: QuizAnswers): boolean {
  return answers.assets.includes("stocks");
}

const FEIE_NON_CONFORMING_STATES: USState[] = ["CA", "NJ", "MA", "CT", "VA"];
const FTC_GAP_STATES: USState[] = ["CA", "NJ", "MA", "CT", "VA", "PA", "IL", "GA"];

function isFirstYearH1B(answers: QuizAnswers): boolean {
  const yearLeft = parseInt(answers.yearLeftIndia);
  if (isNaN(yearLeft)) return false;
  return answers.usStatus === "H1B" && new Date().getFullYear() - yearLeft <= 1;
}

function hasHighValueStocksOrMFs(answers: QuizAnswers): boolean {
  const highAmounts = ["50k_100k", "over_100k"];
  if (answers.assetAmounts.stocks && highAmounts.includes(answers.assetAmounts.stocks)) return true;
  if (answers.assetAmounts.mutual_funds && highAmounts.includes(answers.assetAmounts.mutual_funds)) return true;
  return false;
}

function totalAggregateAbove10K(answers: QuizAnswers): boolean {
  const highAmounts = ["10k_50k", "50k_100k", "over_100k"];
  if (answers.assetAmounts.bank_accounts && highAmounts.includes(answers.assetAmounts.bank_accounts)) return true;
  if (answers.assetAmounts.nre_nro && highAmounts.includes(answers.assetAmounts.nre_nro)) return true;
  // If multiple accounts exist, likely above 10K
  const accountTypes = ["bank_accounts", "nre_nro", "ppf", "epf", "nps"] as const;
  const count = accountTypes.filter((t) => answers.assets.includes(t)).length;
  if (count >= 2) return true;
  return false;
}

function totalAssetsAbove50K(answers: QuizAnswers): boolean {
  const highAmounts = ["50k_100k", "over_100k"];
  for (const val of Object.values(answers.assetAmounts)) {
    if (val && highAmounts.includes(val)) return true;
  }
  // If they have many asset types, likely above 50K
  if (answers.assets.length >= 3) return true;
  return false;
}

/* ── Weighting for "not sure" ── */
const NOT_SURE_FACTOR = 0.7;

function triWeight(val: TriState, baseWeight: number): number {
  if (val === "no") return baseWeight;
  if (val === "not_sure") return baseWeight * NOT_SURE_FACTOR;
  return 0; // "yes" means compliant
}

/* ── Rules ── */

function rule_fbar(answers: QuizAnswers): ComplianceResult | null {
  if (!hasForeignAccounts(answers) && !totalAggregateAbove10K(answers)) return null;

  const weight = triWeight(answers.filedFBAR, 20);
  if (weight === 0) return null;

  return {
    rule_id: "fbar",
    rule_name: "FBAR Filing (FinCEN 114)",
    severity: "urgent",
    status: answers.filedFBAR === "not_sure" ? "needs_review" : "triggered",
    score_weight: weight,
    penalty_min_usd: 10000,
    penalty_max_usd: 100000,
    obligation_summary:
      "US persons must report foreign bank accounts if the aggregate value exceeds $10,000 at any time during the year.",
    why_applies: `You indicated you have ${answers.assets.includes("bank_accounts") ? "Indian bank accounts" : "NRE/NRO accounts"} and ${answers.filedFBAR === "no" ? "have not filed FBAR" : "are unsure if you've filed FBAR"}.${isFirstYearH1B(answers) ? " Note: As a first-year H1B holder, you may not meet the Substantial Presence Test yet. However, if you elected to be treated as a resident for the full year (e.g., for filing jointly), FBAR still applies." : ""}`,
    consequence:
      "Civil penalties start at $10,000 per account per year for non-willful violations. Willful violations can reach $100,000 or 50% of account balance, whichever is greater. Criminal penalties possible.",
    fix_steps: [
      "Gather statements for ALL Indian bank accounts (savings, FD, NRE, NRO, PPF, etc.)",
      "Calculate the maximum balance in each account during the year (convert INR to USD using Treasury rate)",
      "File FinCEN Form 114 electronically at https://bsaefiling.fincen.treas.gov/",
      "If filing late, use the IRS Streamlined Filing Compliance Procedures to avoid penalties",
      "File for all delinquent years (no statute of limitations on FBAR)",
    ],
    fix_time: "2-4 hours (per year)",
    fix_cost: "$0 (self-file) or $500-$2,000 (CPA)",
    fix_difficulty: "moderate",
  };
}

function rule_fatca(answers: QuizAnswers): ComplianceResult | null {
  if (!hasAnyAssets(answers) || !totalAssetsAbove50K(answers)) return null;

  const weight = triWeight(answers.filedFATCA, 15);
  if (weight === 0) return null;

  return {
    rule_id: "fatca",
    rule_name: "FATCA Form 8938",
    severity: "urgent",
    status: answers.filedFATCA === "not_sure" ? "needs_review" : "triggered",
    score_weight: weight,
    penalty_min_usd: 10000,
    penalty_max_usd: 60000,
    obligation_summary:
      `US taxpayers with foreign financial assets exceeding ${answers.filingStatus === "Married Filing Jointly" ? "$100,000 (married filing jointly)" : "$50,000 (single/MFS)"} at year-end (or ${answers.filingStatus === "Married Filing Jointly" ? "$200,000" : "$75,000"} at any time) must file Form 8938 with their tax return.`,
    why_applies: `You have Indian financial assets and ${answers.filedFATCA === "no" ? "have not filed Form 8938" : "are unsure if you've filed Form 8938"}. Based on your assets, you likely exceed the ${answers.filingStatus === "Married Filing Jointly" ? "$100,000 MFJ" : "$50,000"} filing threshold.`,
    consequence:
      "$10,000 penalty for failure to file. Additional $10,000 for each 30 days of non-filing after IRS notice, up to $60,000. 40% penalty on understatement of tax related to undisclosed assets.",
    fix_steps: [
      "List all Indian financial assets: bank accounts, mutual funds, stocks, insurance policies with cash value, etc.",
      "Determine the maximum value during the year and the year-end value for each asset",
      "Complete IRS Form 8938 and attach to your annual tax return (Form 1040)",
      "If filing late, include with an amended return or use Streamlined Procedures",
    ],
    fix_time: "3-6 hours",
    fix_cost: "$0 (self-file) or $500-$3,000 (CPA)",
    fix_difficulty: "moderate",
  };
}

function rule_indian_itr(answers: QuizAnswers): ComplianceResult | null {
  if (!hasIncomeFromIndia(answers) && !hasAnyAssets(answers)) return null;

  const weight = triWeight(answers.filedIndianITR, 12);
  if (weight === 0) return null;

  return {
    rule_id: "indian_itr",
    rule_name: "Indian Income Tax Return",
    severity: "urgent",
    status: answers.filedIndianITR === "not_sure" ? "needs_review" : "triggered",
    score_weight: weight,
    penalty_min_usd: 300,
    penalty_max_usd: 5000,
    obligation_summary:
      "NRIs earning above the basic exemption limit from Indian sources must file an Indian Income Tax Return.",
    why_applies: `You have ${hasIncomeFromIndia(answers) ? "income from India" : "Indian assets that may generate taxable income"} and ${answers.filedIndianITR === "no" ? "have not filed Indian ITR since becoming NRI" : "are unsure if you've filed"}.${answers.usStatus === "US Citizen" ? " As a US Citizen, you are still considered an NRI under Indian tax law if you don't meet the residency test — but India may tax your Indian-source income." : answers.usStatus === "Green Card" ? " As a Green Card holder, you retain NRI status in India. Your Indian-source income is taxable in India regardless of your US status." : ""}`,
    consequence:
      "Late filing fee up to Rs 10,000. Interest at 1% per month on outstanding tax. Penalty up to 300% of tax evaded in extreme cases. Cannot carry forward losses.",
    fix_steps: [
      "Determine your NRI status under Indian tax law (Section 6)",
      "Calculate Indian-source income (rent, interest, capital gains, etc.)",
      "File ITR-2 or ITR-3 on the Indian Income Tax e-filing portal",
      "Claim DTAA benefits to avoid double taxation",
      "Pay any outstanding tax with interest under Section 234A/B/C",
    ],
    fix_time: "4-8 hours",
    fix_cost: "$50-$500 (Indian CA)",
    fix_difficulty: "moderate",
  };
}

function rule_pan_inoperative(answers: QuizAnswers): ComplianceResult | null {
  if (answers.hasPAN === "no") return null; // No PAN, different issue

  const weight = triWeight(answers.panLinkedAadhaar, 8);
  if (weight === 0) return null;

  // Only applies if they have both PAN and Aadhaar
  if (answers.hasAadhaar === "no") return null;

  return {
    rule_id: "pan_inoperative",
    rule_name: "PAN-Aadhaar Linkage",
    severity: "warning",
    status: answers.panLinkedAadhaar === "not_sure" ? "needs_review" : "triggered",
    score_weight: weight,
    penalty_min_usd: 0,
    penalty_max_usd: 1200,
    obligation_summary:
      "PAN must be linked to Aadhaar to remain operative. Inoperative PAN attracts higher TDS rates and blocks financial transactions.",
    why_applies: `You have a PAN and Aadhaar but ${answers.panLinkedAadhaar === "no" ? "they are not linked" : "you're unsure if they're linked"}. Over 100 million PANs became inoperative due to non-linkage.`,
    consequence:
      "Inoperative PAN: TDS deducted at 20% instead of normal rates. Cannot open new demat/bank accounts. Existing mutual fund transactions may be blocked. Rs 1,000 penalty for late linkage.",
    fix_steps: [
      "Check linkage status at https://eportal.incometax.gov.in/",
      "If not linked, link via the income tax portal or SMS (send UIDPAN <12-digit Aadhaar> <10-digit PAN> to 567678)",
      "Pay Rs 1,000 late linkage fee if applicable",
      "Wait 7-30 days for PAN to become operative again",
    ],
    fix_time: "30 minutes",
    fix_cost: "$12 (Rs 1,000 fee)",
    fix_difficulty: "easy",
  };
}

function rule_fema_account_conversion(answers: QuizAnswers): ComplianceResult | null {
  if (!answers.assets.includes("bank_accounts")) return null;

  const weight = triWeight(answers.convertedToNRO, 10);
  if (weight === 0) return null;

  return {
    rule_id: "fema_conversion",
    rule_name: "FEMA Account Conversion (NRO/NRE)",
    severity: "urgent",
    status: answers.convertedToNRO === "not_sure" ? "needs_review" : "triggered",
    score_weight: weight,
    penalty_min_usd: 600,
    penalty_max_usd: 50000,
    obligation_summary:
      "Under FEMA regulations, NRIs must convert resident savings accounts to NRO accounts. Holding a resident account as an NRI is a FEMA violation.",
    why_applies: `You have Indian bank accounts and ${answers.convertedToNRO === "no" ? "have not converted them to NRO" : "are unsure if they've been converted"}. FEMA requires conversion upon becoming NRI.`,
    consequence:
      "FEMA violations: penalty up to 3x the amount involved. RBI can impose compounding fees. In extreme cases, up to Rs 2 lakh per day of continuing violation. Banks may freeze accounts.",
    fix_steps: [
      "Contact your Indian bank branch (or use internet banking if available)",
      "Submit Form for redesignation of resident account to NRO account",
      "Provide proof of NRI status (passport, visa, foreign address proof)",
      "Consider opening an NRE account for repatriable funds",
      "Update KYC with NRI status at the same time",
    ],
    fix_time: "1-2 weeks",
    fix_cost: "$0-$50 (bank fees)",
    fix_difficulty: "moderate",
  };
}

function rule_oci_update(answers: QuizAnswers): ComplianceResult | null {
  if (answers.hasOCI !== "yes") return null;

  const weight = triWeight(answers.ociUpdatedAfterPassportRenewal, 5);
  if (weight === 0) return null;

  return {
    rule_id: "oci_update",
    rule_name: "OCI Card Update After Passport Renewal",
    severity: "warning",
    status: answers.ociUpdatedAfterPassportRenewal === "not_sure" ? "needs_review" : "triggered",
    score_weight: weight,
    penalty_min_usd: 0,
    penalty_max_usd: 500,
    obligation_summary:
      "OCI cardholders must update their OCI card when they get a new passport (before age 20 and once after 50). Entry to India can be denied with a mismatched OCI.",
    why_applies: `You have an OCI card and ${answers.ociUpdatedAfterPassportRenewal === "no" ? "have not updated it after your last passport renewal" : "are unsure if it's been updated"}.`,
    consequence:
      "May be denied boarding or entry at Indian immigration. Could face deportation or fines. OCI benefits (property, banking) may be impacted.",
    fix_steps: [
      "Check if your OCI card needs updating (mandatory if passport renewed before age 20 or after 50)",
      "Apply online at https://ociservices.gov.in/",
      "Upload photo of new passport, old OCI card, and old passport",
      "Pay the fee (~$25) and mail documents to VFS/embassy",
      "Processing takes 4-8 weeks",
    ],
    fix_time: "1-2 hours (application) + 4-8 weeks (processing)",
    fix_cost: "$25-$50",
    fix_difficulty: "easy",
  };
}

function rule_aadhaar_biometric(answers: QuizAnswers): ComplianceResult | null {
  if (answers.hasAadhaar !== "yes") return null;
  // This is informational — Aadhaar biometric update needed every 10 years
  const yearLeft = parseInt(answers.yearLeftIndia);
  if (isNaN(yearLeft) || new Date().getFullYear() - yearLeft < 10) return null;

  return {
    rule_id: "aadhaar_biometric",
    rule_name: "Aadhaar Biometric Update",
    severity: "info",
    status: "needs_review",
    score_weight: 3,
    penalty_min_usd: 0,
    penalty_max_usd: 0,
    obligation_summary:
      "UIDAI recommends updating Aadhaar biometrics every 10 years. Outdated biometrics can cause authentication failures.",
    why_applies: `You left India in ${answers.yearLeftIndia}, which is over 10 years ago. Your Aadhaar biometrics may be outdated.`,
    consequence:
      "Aadhaar authentication failures when trying to use services remotely. May affect PAN linkage, bank KYC, and other Aadhaar-dependent processes.",
    fix_steps: [
      "Visit an Aadhaar enrollment center during your next India trip",
      "Carry your Aadhaar card and a valid ID",
      "Update biometrics (fingerprints, iris scan, photograph)",
      "Free of cost if done at government centers",
    ],
    fix_time: "1 hour (during India visit)",
    fix_cost: "$0",
    fix_difficulty: "easy",
  };
}

function rule_tds_certificates(answers: QuizAnswers): ComplianceResult | null {
  if (!hasIncomeFromIndia(answers)) return null;
  if (!hasInterestIncome(answers) && !hasRentalIncome(answers)) return null;

  return {
    rule_id: "tds_certificates",
    rule_name: "TDS Certificates (Form 16A)",
    severity: "info",
    status: "needs_review",
    score_weight: 3,
    penalty_min_usd: 0,
    penalty_max_usd: 600,
    obligation_summary:
      "TDS deducted on Indian income should be documented via Form 16A. NRIs face higher TDS rates and need certificates to claim DTAA benefits.",
    why_applies: `You have ${hasInterestIncome(answers) ? "interest" : ""}${hasInterestIncome(answers) && hasRentalIncome(answers) ? " and " : ""}${hasRentalIncome(answers) ? "rental" : ""} income from India which attracts TDS. You need certificates to claim credit on your US return.`,
    consequence:
      "Cannot claim foreign tax credit on US return without documentation. May pay double tax on the same income. NRI TDS rate is 30% on many income types.",
    fix_steps: [
      "Request Form 16A from banks/tenants for each financial year",
      "Download Form 26AS from the Indian income tax portal to verify TDS credits",
      "Use these certificates when filing US taxes to claim foreign tax credit (Form 1116)",
      "If TDS was deducted at rates higher than DTAA rates, apply for a lower TDS certificate (Section 197)",
    ],
    fix_time: "1-2 hours",
    fix_cost: "$0",
    fix_difficulty: "easy",
  };
}

function rule_repatriation(answers: QuizAnswers): ComplianceResult | null {
  if (!hasAnyAssets(answers)) return null;
  // Applies if they have significant Indian assets
  const highValue = ["50k_100k", "over_100k", "50l_1cr", "over_1cr"];
  const hasHighValue = Object.values(answers.assetAmounts).some(
    (v) => v && highValue.includes(v)
  );
  if (!hasHighValue && answers.assets.length < 3) return null;

  return {
    rule_id: "repatriation",
    rule_name: "Repatriation Compliance (Form 15CA/CB)",
    severity: "warning",
    status: "needs_review",
    score_weight: 4,
    penalty_min_usd: 0,
    penalty_max_usd: 12000,
    obligation_summary:
      "Transferring money from India to the US requires Form 15CA (self-declaration) and Form 15CB (CA certificate) for amounts above Rs 5 lakh.",
    why_applies:
      "You have significant Indian assets. When you eventually repatriate funds, you'll need proper documentation to comply with RBI and tax regulations.",
    consequence:
      "Banks may refuse to process the transfer. Penalty under Section 271-I of Rs 1 lakh for non-furnishing of Form 15CA/CB. Delays in moving your own money.",
    fix_steps: [
      "Engage an Indian CA to issue Form 15CB (certificate of remittance)",
      "File Form 15CA online on the income tax portal before remittance",
      "Submit the forms to your Indian bank along with the remittance request",
      "Ensure all Indian tax obligations are cleared before repatriation",
      "Keep copies of all forms for US tax filing purposes",
    ],
    fix_time: "2-5 days",
    fix_cost: "$100-$300 (CA fees)",
    fix_difficulty: "moderate",
  };
}

function rule_pfic(answers: QuizAnswers): ComplianceResult | null {
  if (!hasMutualFunds(answers)) return null;

  const isPermanent = answers.usStatus === "Green Card" || answers.usStatus === "US Citizen";
  const baseWeight = isPermanent ? 15 : 12;
  const weight = triWeight(answers.reportedPFICs, baseWeight);
  if (weight === 0) return null;

  const statusNote = isPermanent
    ? " As a " + answers.usStatus + " holder, PFIC reporting is a permanent annual obligation — it does not end when you leave the US."
    : " As an H1B holder, this obligation lasts as long as you are a US tax resident.";

  return {
    rule_id: "pfic",
    rule_name: "PFIC Reporting (Form 8621)",
    severity: "urgent",
    status: answers.reportedPFICs === "not_sure" ? "needs_review" : "triggered",
    score_weight: weight,
    penalty_min_usd: 5000,
    penalty_max_usd: 50000,
    obligation_summary:
      "Indian mutual funds are classified as PFICs (Passive Foreign Investment Companies) by the IRS and must be reported on Form 8621 — one form per fund.",
    why_applies: `You hold Indian mutual funds and ${answers.reportedPFICs === "no" ? "have not reported them as PFICs" : "are unsure if they've been reported"}. Each fund requires a separate Form 8621.${statusNote}`,
    consequence:
      "Punitive 'excess distribution' tax regime applies — gains taxed at highest marginal rate + interest. No long-term capital gains benefit. $10,000+ penalties for non-filing.",
    fix_steps: [
      "List all Indian mutual fund holdings (direct and regular plans count separately)",
      "Obtain annual statements showing NAV on Jan 1 and Dec 31, plus all distributions",
      "File Form 8621 for EACH fund — consider QEF or Mark-to-Market election",
      "Strongly recommend engaging a CPA experienced with PFICs",
      "Consider liquidating Indian MFs and re-investing in US-domiciled funds to avoid ongoing PFIC pain",
    ],
    fix_time: "4-10 hours (depends on number of funds)",
    fix_cost: "$200-$500 per fund (CPA fees)",
    fix_difficulty: "hard",
  };
}

function rule_dtaa(answers: QuizAnswers): ComplianceResult | null {
  if (!hasIncomeFromIndia(answers)) return null;

  return {
    rule_id: "dtaa_trc",
    rule_name: "DTAA Tax Residency Certificate",
    severity: "warning",
    status: "needs_review",
    score_weight: 4,
    penalty_min_usd: 0,
    penalty_max_usd: 5000,
    obligation_summary:
      "To claim benefits under the India-US Double Taxation Avoidance Agreement (DTAA), you need a Tax Residency Certificate (TRC) from the US.",
    why_applies:
      `You have income from India. Without a TRC, you may end up paying tax in both countries on the same income without relief.${answers.usStatus === "Green Card" ? " Important: As a Green Card holder, you may face dual-residency issues under the DTAA tie-breaker rules (Article 4). Ensure you can establish US tax residency clearly to claim treaty benefits." : ""}`,
    consequence:
      "Double taxation on Indian income. Higher TDS rates in India (30% instead of treaty rates). Cannot claim beneficial DTAA rates for interest, dividends, or capital gains.",
    fix_steps: [
      "Obtain IRS Form 6166 (US Tax Residency Certificate) — apply via IRS website",
      "Pay the $85 fee and wait 4-6 weeks for processing",
      "Submit TRC to Indian tax authorities/banks/tenants to claim lower TDS rates",
      "File Form 10F on the Indian income tax portal along with TRC",
      "Claim foreign tax credit on US return using Form 1116",
    ],
    fix_time: "1 hour (application) + 4-6 weeks (processing)",
    fix_cost: "$85 (IRS fee) + CPA fees if needed",
    fix_difficulty: "moderate",
  };
}

function rule_property_tax(answers: QuizAnswers): ComplianceResult | null {
  if (!hasProperty(answers)) return null;

  return {
    rule_id: "property_tax",
    rule_name: "Indian Property Tax & US Reporting",
    severity: "info",
    status: "needs_review",
    score_weight: 3,
    penalty_min_usd: 0,
    penalty_max_usd: 10000,
    obligation_summary:
      "Indian property owned by NRIs must be reported on FBAR/FATCA if held through financial accounts. Deemed rental income may apply even if property is vacant.",
    why_applies:
      "You own property in India. This has implications for both Indian tax (deemed rental income if >1 self-occupied property) and US reporting.",
    consequence:
      "Deemed rental income taxed in India. Capital gains on sale taxed in both countries. TDS at 20%+ when NRI sells property. Must report on Schedule FA in Indian ITR.",
    fix_steps: [
      "Declare property in your Indian ITR (Schedule FA for foreign assets)",
      "Pay municipal/property tax on time",
      "If renting: declare rental income, get TDS certificates from tenant",
      "If property value > self-occupied exemption: calculate deemed rental income",
      "Plan capital gains tax implications before selling (both Indian and US tax)",
    ],
    fix_time: "2-4 hours",
    fix_cost: "$100-$300 (CA fees for tax planning)",
    fix_difficulty: "moderate",
  };
}

function rule_bank_kyc(answers: QuizAnswers): ComplianceResult | null {
  if (!hasForeignAccounts(answers)) return null;

  const weight = triWeight(answers.updatedBankKYC, 5);
  if (weight === 0) return null;

  return {
    rule_id: "bank_kyc",
    rule_name: "Bank KYC Update (NRI Status)",
    severity: "warning",
    status: answers.updatedBankKYC === "not_sure" ? "needs_review" : "triggered",
    score_weight: weight,
    penalty_min_usd: 0,
    penalty_max_usd: 1200,
    obligation_summary:
      "NRIs must update their KYC with Indian banks to reflect NRI status. Banks are required to re-classify accounts of customers who become NRIs.",
    why_applies: `You have Indian bank accounts and ${answers.updatedBankKYC === "no" ? "have not updated your KYC to NRI status" : "are unsure if KYC reflects NRI status"}.`,
    consequence:
      "Account may be frozen by the bank. FEMA violation for holding resident accounts as NRI. Tax deducted at incorrect rates. May lose NRI tax benefits.",
    fix_steps: [
      "Contact your bank branch or use internet banking for KYC update",
      "Submit: passport copy, visa copy, overseas address proof, passport-size photos",
      "Fill the KYC update form with NRI status",
      "Ensure all accounts (savings, FD, locker, demat) are updated",
      "Can often be done via video KYC for major banks",
    ],
    fix_time: "1-3 hours",
    fix_cost: "$0",
    fix_difficulty: "easy",
  };
}

function rule_ppf_nri(answers: QuizAnswers): ComplianceResult | null {
  if (!hasPPF(answers)) return null;

  return {
    rule_id: "ppf_nri",
    rule_name: "PPF Account NRI Status",
    severity: "info",
    status: "needs_review",
    score_weight: 3,
    penalty_min_usd: 0,
    penalty_max_usd: 0,
    obligation_summary:
      "NRIs cannot open new PPF accounts. Existing accounts can continue until maturity but cannot be extended. Interest rate may be reduced to post-office savings rate.",
    why_applies:
      "You have a PPF account and are an NRI. The rules for NRI PPF accounts changed in 2017 — your account may be earning reduced interest.",
    consequence:
      "Interest earned may be at savings account rate (4%) instead of PPF rate (7%+). Account may be frozen if NRI status is discovered. Cannot extend account after maturity.",
    fix_steps: [
      "Check with your bank if PPF account is still earning full interest",
      "Do NOT make new contributions if you're an NRI (these may be returned)",
      "Plan to close the account at maturity — cannot extend as NRI",
      "Consider alternative tax-efficient investments in the US (401k, IRA)",
    ],
    fix_time: "1 hour",
    fix_cost: "$0",
    fix_difficulty: "easy",
  };
}

function rule_lic_premium(answers: QuizAnswers): ComplianceResult | null {
  if (!hasLIC(answers)) return null;

  return {
    rule_id: "lic_premium",
    rule_name: "LIC Policy NRI Compliance",
    severity: "warning",
    status: "needs_review",
    score_weight: 4,
    penalty_min_usd: 0,
    penalty_max_usd: 5000,
    obligation_summary:
      "NRIs holding LIC policies must update their status with LIC. Premiums must be paid from NRO/NRE accounts. LIC policies may be PFICs for US tax purposes.",
    why_applies:
      "You have LIC/life insurance in India. As an NRI, there are specific compliance requirements for maintaining these policies.",
    consequence:
      "Policy may be classified as PFIC — complex US tax reporting. Premiums paid from resident account violates FEMA. Maturity proceeds may face TDS and repatriation issues.",
    fix_steps: [
      "Update NRI status with LIC — submit passport, visa, and foreign address",
      "Switch premium payments to NRO/NRE account",
      "Consider whether to continue the policy (PFIC reporting costs may exceed benefits)",
      "If policy has investment component, report as PFIC on Form 8621",
      "Plan for TDS on maturity proceeds (2% if PAN available, 20% without)",
    ],
    fix_time: "2-3 hours",
    fix_cost: "$0-$200 (CPA advice)",
    fix_difficulty: "moderate",
  };
}

function rule_citizenship_renunciation(answers: QuizAnswers): ComplianceResult | null {
  if (answers.usStatus !== "US Citizen") return null;
  if (answers.surrenderedIndianPassport === "yes") return null;

  const weight = answers.surrenderedIndianPassport === "not_sure" ? 8 * NOT_SURE_FACTOR : 8;

  return {
    rule_id: "citizenship_renunciation",
    rule_name: "Indian Passport Surrender After US Citizenship",
    severity: "warning",
    status: answers.surrenderedIndianPassport === "not_sure" ? "needs_review" : "triggered",
    score_weight: weight,
    penalty_min_usd: 0,
    penalty_max_usd: 2500,
    obligation_summary:
      "Indian law does not allow dual citizenship. Upon acquiring US citizenship, you must surrender your Indian passport within 90 days and apply for OCI if you want travel/residency privileges in India.",
    why_applies: `You are a US Citizen and ${answers.surrenderedIndianPassport === "no" ? "have not surrendered your Indian passport" : "are unsure if you've surrendered it"}. Using an Indian passport after acquiring foreign citizenship is illegal under the Indian Citizenship Act.`,
    consequence:
      "Using an Indian passport after acquiring US citizenship is a criminal offense under Section 17 of the Indian Passport Act. You may face deportation from India, blacklisting, and fines. Your OCI application may also be rejected.",
    fix_steps: [
      "Visit the nearest Indian consulate/embassy to surrender your Indian passport",
      "Fill out the online renunciation form at the VFS/consulate website",
      "Submit your Indian passport, US passport, and US naturalization certificate",
      "Pay the renunciation fee (~$175)",
      "Apply for OCI card simultaneously to retain travel/property rights in India",
    ],
    fix_time: "1-2 hours (application) + 4-8 weeks (processing)",
    fix_cost: "$175-$275 (renunciation + OCI fees)",
    fix_difficulty: "moderate",
  };
}

function rule_state_feie_nonconformity(answers: QuizAnswers): ComplianceResult | null {
  if (!FEIE_NON_CONFORMING_STATES.includes(answers.usState as USState)) return null;
  if (!hasIncomeFromIndia(answers)) return null;

  return {
    rule_id: "state_feie_gap",
    rule_name: `${answers.usState} Does Not Honor FEIE`,
    severity: "warning",
    status: "needs_review",
    score_weight: 6,
    penalty_min_usd: 0,
    penalty_max_usd: 10000,
    obligation_summary:
      `${answers.usState} does not conform to the federal Foreign Earned Income Exclusion (FEIE). Even if you exclude foreign income on your federal return using Form 2555, ${answers.usState} will tax that income at the state level.`,
    why_applies:
      `You live in ${answers.usState} and have income from India. While you may exclude this from federal taxes via FEIE, your state will not honor that exclusion — you'll owe state tax on the full amount.`,
    consequence:
      `Unexpected state tax bill on income you thought was excluded. ${answers.usState} state tax rates can be significant (e.g., CA up to 13.3%). Penalties and interest for underpayment if not planned for.`,
    fix_steps: [
      `Review your ${answers.usState} state return separately from your federal return`,
      "Calculate state tax liability on Indian income that was excluded federally",
      "Consider using Foreign Tax Credit (Form 1116) instead of FEIE if it results in lower combined tax",
      "Consult a CPA familiar with your state's treatment of foreign income",
    ],
    fix_time: "2-4 hours",
    fix_cost: "$200-$500 (CPA consultation)",
    fix_difficulty: "moderate",
  };
}

function rule_state_ftc_gap(answers: QuizAnswers): ComplianceResult | null {
  if (!FTC_GAP_STATES.includes(answers.usState as USState)) return null;
  if (!hasIncomeFromIndia(answers)) return null;

  return {
    rule_id: "state_ftc_gap",
    rule_name: `${answers.usState} Limited Foreign Tax Credit`,
    severity: "warning",
    status: "needs_review",
    score_weight: 5,
    penalty_min_usd: 0,
    penalty_max_usd: 8000,
    obligation_summary:
      `${answers.usState} has limited or no foreign tax credit at the state level. Taxes paid to India may not offset your ${answers.usState} state tax liability, resulting in effective double taxation.`,
    why_applies:
      `You live in ${answers.usState} and have Indian income. While the federal foreign tax credit (Form 1116) offsets federal tax, your state may not allow a corresponding credit for taxes paid to India.`,
    consequence:
      `You may effectively pay tax on the same income to India and ${answers.usState}. This can significantly increase your overall tax burden on Indian-source income.`,
    fix_steps: [
      `Check ${answers.usState}'s specific rules for foreign tax credits on the state tax authority website`,
      "Compare total tax impact of FEIE vs FTC at both federal and state levels",
      "Structure income timing to minimize state tax impact where possible",
      "Consult a CPA who specializes in cross-border taxation in your state",
    ],
    fix_time: "2-4 hours",
    fix_cost: "$200-$500 (CPA consultation)",
    fix_difficulty: "moderate",
  };
}

function rule_washington_capital_gains(answers: QuizAnswers): ComplianceResult | null {
  if (answers.usState !== "WA") return null;
  if (!hasStocks(answers) && !hasMutualFunds(answers)) return null;
  if (!hasHighValueStocksOrMFs(answers)) return null;

  return {
    rule_id: "wa_capital_gains",
    rule_name: "Washington State Capital Gains Tax",
    severity: "info",
    status: "needs_review",
    score_weight: 4,
    penalty_min_usd: 0,
    penalty_max_usd: 5000,
    obligation_summary:
      "Washington state imposes a 7% tax on capital gains exceeding $250,000 from the sale of stocks, bonds, and other capital assets. This applies to sales of Indian stocks and mutual funds.",
    why_applies:
      "You live in Washington and have high-value Indian stocks or mutual funds. If you sell these assets with gains exceeding $250,000, you'll owe Washington's capital gains tax in addition to federal taxes.",
    consequence:
      "7% state capital gains tax on gains over $250,000. This is in addition to federal capital gains tax and any PFIC-related taxes on Indian mutual funds. Penalties for non-filing.",
    fix_steps: [
      "Track cost basis of all Indian stock and mutual fund holdings",
      "Plan sales to stay under the $250,000 annual gains threshold if possible",
      "File Washington Excise Tax return if you have qualifying capital gains",
      "Consider timing of sales across tax years to minimize impact",
    ],
    fix_time: "1-2 hours",
    fix_cost: "$0-$300 (CPA if needed)",
    fix_difficulty: "moderate",
  };
}

/* ── Main Engine ── */

export function runRulesEngine(answers: QuizAnswers): RulesEngineOutput {
  const allRules = [
    rule_fbar,
    rule_fatca,
    rule_indian_itr,
    rule_pan_inoperative,
    rule_fema_account_conversion,
    rule_oci_update,
    rule_aadhaar_biometric,
    rule_tds_certificates,
    rule_repatriation,
    rule_pfic,
    rule_dtaa,
    rule_property_tax,
    rule_bank_kyc,
    rule_ppf_nri,
    rule_lic_premium,
    rule_citizenship_renunciation,
    rule_state_feie_nonconformity,
    rule_state_ftc_gap,
    rule_washington_capital_gains,
  ];

  const results: ComplianceResult[] = [];
  let totalWeight = 0;
  let totalPenaltyMin = 0;
  let totalPenaltyMax = 0;

  for (const ruleFn of allRules) {
    const result = ruleFn(answers);
    if (result) {
      results.push(result);
      totalWeight += result.score_weight;
      totalPenaltyMin += result.penalty_min_usd;
      totalPenaltyMax += result.penalty_max_usd;
    }
  }

  // Sort: urgent first, then warning, then info
  const severityOrder: Record<string, number> = {
    urgent: 0,
    warning: 1,
    info: 2,
  };
  results.sort(
    (a, b) =>
      severityOrder[a.severity] - severityOrder[b.severity] ||
      b.score_weight - a.score_weight
  );

  const score = Math.max(0, Math.round(100 - totalWeight));

  return {
    score,
    totalPenaltyMin,
    totalPenaltyMax,
    results,
  };
}
