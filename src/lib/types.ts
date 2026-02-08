/* ── Quiz Answers ── */

export type USStatus = "H1B" | "Green Card" | "US Citizen" | "Other" | "";
export type FilingStatus =
  | "Single"
  | "Married Filing Jointly"
  | "Married Filing Separately"
  | "";

export type USState =
  | "CA" | "NY" | "NJ" | "TX" | "WA" | "IL" | "PA" | "MA"
  | "VA" | "CT" | "GA" | "FL" | "OH" | "NC" | "MI" | "AZ"
  | "CO" | "MN" | "MD" | "OR" | "Other" | "";

export type AssetType =
  | "bank_accounts"
  | "mutual_funds"
  | "stocks"
  | "property"
  | "life_insurance"
  | "ppf"
  | "nps"
  | "epf"
  | "nre_nro";

export type AmountRangeUSD =
  | "under_5k"
  | "5k_10k"
  | "10k_50k"
  | "50k_100k"
  | "over_100k"
  | "not_sure"
  | "";

export type AmountRangeINR =
  | "under_5l"
  | "5l_10l"
  | "10l_50l"
  | "50l_1cr"
  | "over_1cr"
  | "not_sure"
  | "";

export type IncomeType =
  | "rental"
  | "interest"
  | "dividend"
  | "capital_gains"
  | "business"
  | "none";

export type TriState = "yes" | "no" | "not_sure" | "";

export interface QuizAnswers {
  /* Step 1 */
  yearLeftIndia: string;
  usStatus: USStatus;
  filingStatus: FilingStatus;
  usState: USState;

  /* Step 2 */
  assets: AssetType[];

  /* Step 3 */
  assetAmounts: Partial<Record<AssetType, AmountRangeUSD | AmountRangeINR>>;

  /* Step 4 */
  incomeTypes: IncomeType[];
  incomeAmounts: Partial<Record<IncomeType, AmountRangeUSD>>;

  /* Step 5 */
  hasPAN: TriState;
  panLinkedAadhaar: TriState;
  hasAadhaar: TriState;
  hasOCI: TriState;
  ociUpdatedAfterPassportRenewal: TriState;
  surrenderedIndianPassport: TriState;
  filedIndianITR: TriState;
  filedFBAR: TriState;
  filedFATCA: TriState;
  reportedPFICs: TriState;
  updatedBankKYC: TriState;
  convertedToNRO: TriState;
}

/* ── Compliance Result ── */

export type Severity = "urgent" | "warning" | "info";
export type Status = "triggered" | "clear" | "needs_review";
export type FixDifficulty = "easy" | "moderate" | "hard";

export interface ComplianceResult {
  rule_id: string;
  rule_name: string;
  severity: Severity;
  status: Status;
  score_weight: number;
  penalty_min_usd: number;
  penalty_max_usd: number;
  obligation_summary: string;
  why_applies: string;
  consequence: string;
  fix_steps: string[];
  fix_time: string;
  fix_cost: string;
  fix_difficulty: FixDifficulty;
}

export interface RulesEngineOutput {
  score: number;
  totalPenaltyMin: number;
  totalPenaltyMax: number;
  results: ComplianceResult[];
}

/* ── Defaults ── */

export const DEFAULT_QUIZ_ANSWERS: QuizAnswers = {
  yearLeftIndia: "",
  usStatus: "",
  filingStatus: "",
  usState: "",
  assets: [],
  assetAmounts: {},
  incomeTypes: [],
  incomeAmounts: {},
  hasPAN: "",
  panLinkedAadhaar: "",
  hasAadhaar: "",
  hasOCI: "",
  ociUpdatedAfterPassportRenewal: "",
  surrenderedIndianPassport: "",
  filedIndianITR: "",
  filedFBAR: "",
  filedFATCA: "",
  reportedPFICs: "",
  updatedBankKYC: "",
  convertedToNRO: "",
};
