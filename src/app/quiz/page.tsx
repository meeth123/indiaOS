"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  QuizAnswers,
  DEFAULT_QUIZ_ANSWERS,
  AssetType,
  IncomeType,
  TriState,
  AmountRangeUSD,
  USStatus,
  USState,
  FilingStatus,
} from "@/lib/types";

/* ── Constants ── */

const ASSET_OPTIONS: { key: AssetType; label: string; icon: string }[] = [
  { key: "bank_accounts", label: "Bank Accounts", icon: "🏦" },
  { key: "mutual_funds", label: "Mutual Funds", icon: "📈" },
  { key: "stocks", label: "Stocks / Demat", icon: "📊" },
  { key: "property", label: "Property", icon: "🏠" },
  { key: "life_insurance", label: "Life Insurance (LIC)", icon: "🛡" },
  { key: "ppf", label: "PPF", icon: "🏛" },
  { key: "nps", label: "NPS", icon: "💼" },
  { key: "epf", label: "EPF", icon: "🏗" },
  { key: "nre_nro", label: "NRE / NRO Account", icon: "💱" },
];

const USD_RANGES: { value: AmountRangeUSD; label: string }[] = [
  { value: "under_5k", label: "Under $5,000" },
  { value: "5k_10k", label: "$5,000 - $10,000" },
  { value: "10k_50k", label: "$10,000 - $50,000" },
  { value: "50k_100k", label: "$50,000 - $100,000" },
  { value: "over_100k", label: "Over $100,000" },
  { value: "not_sure", label: "Not sure" },
];

const INCOME_OPTIONS: { key: IncomeType; label: string }[] = [
  { key: "rental", label: "Rental income" },
  { key: "interest", label: "Interest income" },
  { key: "dividend", label: "Dividend income" },
  { key: "capital_gains", label: "Capital gains" },
  { key: "business", label: "Business income" },
  { key: "none", label: "None of the above" },
];

const US_STATES: { value: USState; label: string }[] = [
  { value: "CA", label: "California" },
  { value: "NY", label: "New York" },
  { value: "NJ", label: "New Jersey" },
  { value: "TX", label: "Texas" },
  { value: "WA", label: "Washington" },
  { value: "IL", label: "Illinois" },
  { value: "PA", label: "Pennsylvania" },
  { value: "MA", label: "Massachusetts" },
  { value: "VA", label: "Virginia" },
  { value: "CT", label: "Connecticut" },
  { value: "GA", label: "Georgia" },
  { value: "FL", label: "Florida" },
  { value: "OH", label: "Ohio" },
  { value: "NC", label: "North Carolina" },
  { value: "MI", label: "Michigan" },
  { value: "AZ", label: "Arizona" },
  { value: "CO", label: "Colorado" },
  { value: "MN", label: "Minnesota" },
  { value: "MD", label: "Maryland" },
  { value: "OR", label: "Oregon" },
  { value: "Other", label: "Other" },
];

interface DocCheckItem {
  key: keyof QuizAnswers;
  label: string;
  showWhen?: (answers: QuizAnswers) => boolean;
}

const hasAccounts = (a: QuizAnswers) =>
  a.assets.includes("bank_accounts") || a.assets.includes("nre_nro");
const hasFinancialAccounts = (a: QuizAnswers) =>
  hasAccounts(a) || a.assets.includes("ppf") || a.assets.includes("epf") || a.assets.includes("nps");
const hasIndianIncomeOrAssets = (a: QuizAnswers) =>
  a.assets.length > 0 || (a.incomeTypes.length > 0 && !a.incomeTypes.includes("none"));

const financialAccountCount = (a: QuizAnswers) =>
  (["ppf", "epf", "nps", "bank_accounts", "nre_nro"] as const).filter((t) =>
    a.assets.includes(t)
  ).length;

const DOC_CHECK_ITEMS: DocCheckItem[] = [
  { key: "hasPAN", label: "I have a PAN card" },
  { key: "hasAadhaar", label: "I have an Aadhaar card" },
  { key: "panLinkedAadhaar", label: "My PAN is linked to Aadhaar",
    showWhen: (a) => a.hasPAN === "yes" && a.hasAadhaar === "yes" },
  { key: "hasOCI", label: "I have an OCI card",
    showWhen: (a) => a.usStatus === "US Citizen" },
  { key: "ociUpdatedAfterPassportRenewal", label: "My OCI is updated after last passport renewal",
    showWhen: (a) => a.usStatus === "US Citizen" && a.hasOCI === "yes" },
  { key: "surrenderedIndianPassport", label: "I've surrendered my Indian passport",
    showWhen: (a) => a.usStatus === "US Citizen" },
  { key: "filedIndianITR", label: "I've filed Indian ITR since becoming NRI",
    showWhen: hasIndianIncomeOrAssets },
  { key: "filedFBAR", label: "I've filed FBAR (FinCEN 114)",
    showWhen: (a) => hasAccounts(a) || financialAccountCount(a) >= 2 },
  { key: "filedFATCA", label: "I've filed FATCA Form 8938",
    showWhen: (a) => a.assets.length > 0 },
  { key: "reportedPFICs", label: "I've reported Indian mutual funds as PFICs",
    showWhen: (a) => a.assets.includes("mutual_funds") },
  { key: "updatedBankKYC", label: "I've updated bank KYC to NRI status",
    showWhen: hasAccounts },
  { key: "convertedToNRO", label: "I've converted savings accounts to NRO",
    showWhen: (a) => a.assets.includes("bank_accounts") },
];

const YEARS = Array.from({ length: 35 }, (_, i) => String(2024 - i));

/* ── Component ── */

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<QuizAnswers>(DEFAULT_QUIZ_ANSWERS);

  const visibleDocItems = DOC_CHECK_ITEMS.filter(
    (item) => !item.showWhen || item.showWhen(answers)
  );
  const totalSteps = 4 + visibleDocItems.length;

  useEffect(() => {
    if (step > totalSteps) setStep(totalSteps);
  }, [totalSteps]);

  const updateAnswer = useCallback(
    <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => {
      setAnswers((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleAsset = (asset: AssetType) => {
    setAnswers((prev) => {
      const has = prev.assets.includes(asset);
      const assets = has
        ? prev.assets.filter((a) => a !== asset)
        : [...prev.assets, asset];
      const assetAmounts = { ...prev.assetAmounts };
      if (has) delete assetAmounts[asset];
      return { ...prev, assets, assetAmounts };
    });
  };

  const toggleIncome = (income: IncomeType) => {
    setAnswers((prev) => {
      if (income === "none") {
        return { ...prev, incomeTypes: ["none"], incomeAmounts: {} };
      }
      const filtered = prev.incomeTypes.filter((i) => i !== "none");
      const has = filtered.includes(income);
      const incomeTypes = has
        ? filtered.filter((i) => i !== income)
        : [...filtered, income];
      const incomeAmounts = { ...prev.incomeAmounts };
      if (has) delete incomeAmounts[income];
      return { ...prev, incomeTypes, incomeAmounts };
    });
  };

  const handleSubmit = () => {
    localStorage.setItem("alertdoc_quiz", JSON.stringify(answers));
    router.push("/results");
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return !!answers.yearLeftIndia && !!answers.usStatus && !!answers.filingStatus && !!answers.usState;
      case 2:
        return answers.assets.length > 0;
      case 3:
        return true; // Amounts are optional
      case 4:
        return answers.incomeTypes.length > 0;
      default: {
        if (step >= 5) {
          const docIndex = step - 5;
          const item = visibleDocItems[docIndex];
          if (item) return answers[item.key] !== "";
        }
        return true;
      }
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="blob-purple" style={{ top: "-80px", left: "-80px" }} />

      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <Link href="/" className="inline-block">
          <Image
            src="/logo.png"
            alt="AlertDoc"
            width={400}
            height={133}
            priority
            className="h-28 w-auto md:h-32"
          />
        </Link>
        <span className="font-mono text-sm font-bold text-gray-500">
          STEP {step} OF {totalSteps}
        </span>
      </nav>

      {/* ── Progress Bar ── */}
      <div className="px-6 md:px-12 mb-10">
        <div className="max-w-3xl mx-auto progress-bar-brutal">
          <div
            className="progress-fill"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Quiz Content ── */}
      <div className="relative z-10 px-6 md:px-12 pb-20 max-w-3xl mx-auto">
        {/* Step 1 */}
        {step === 1 && (
          <div className="brutal-card p-6 md:p-10">
            <h2 className="font-mono font-bold text-2xl md:text-3xl mb-2">
              Your NRI Journey
            </h2>
            <p className="font-sans text-gray-600 mb-8">
              Let&apos;s start with the basics about your status.
            </p>

            {/* Year left India */}
            <div className="mb-8">
              <label className="font-mono font-bold text-sm uppercase tracking-wide block mb-2">
                What year did you leave India?
              </label>
              <select
                data-testid="year-select"
                value={answers.yearLeftIndia}
                onChange={(e) => updateAnswer("yearLeftIndia", e.target.value)}
                className="brutal-btn w-full text-left bg-white"
              >
                <option value="">Select year...</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* US Status */}
            <div className="mb-8">
              <label className="font-mono font-bold text-sm uppercase tracking-wide block mb-3">
                Current US Status
              </label>
              {/* FIX #13: unselected buttons get lighter border to hint selectability */}
              <div className="grid grid-cols-2 gap-3">
                {(["H1B", "Green Card", "US Citizen", "Other"] as USStatus[]).map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => updateAnswer("usStatus", status)}
                      className={`brutal-btn text-sm ${
                        answers.usStatus === status
                          ? "brutal-btn-yellow"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {status}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Filing Status */}
            <div className="mb-8">
              <label className="font-mono font-bold text-sm uppercase tracking-wide block mb-3">
                US Filing Status
              </label>
              <div className="grid grid-cols-1 gap-3">
                {(
                  [
                    "Single",
                    "Married Filing Jointly",
                    "Married Filing Separately",
                  ] as FilingStatus[]
                ).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateAnswer("filingStatus", status)}
                    className={`brutal-btn text-sm ${
                      answers.filingStatus === status
                        ? "brutal-btn-yellow"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* US State */}
            <div>
              <label className="font-mono font-bold text-sm uppercase tracking-wide block mb-2">
                Which US state do you live in?
              </label>
              <select
                data-testid="state-select"
                value={answers.usState}
                onChange={(e) => updateAnswer("usState", e.target.value as USState)}
                className="brutal-btn w-full text-left bg-white"
              >
                <option value="">Select state...</option>
                {US_STATES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="brutal-card p-6 md:p-10">
            <h2 className="font-mono font-bold text-2xl md:text-3xl mb-2">
              Your India Footprint
            </h2>
            <p className="font-sans text-gray-600 mb-8">
              What financial assets do you still have in India? Select all that
              apply.
            </p>

            {/* FIX #5: last-of-type span full width if orphaned */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {ASSET_OPTIONS.map((asset, idx) => (
                <button
                  key={asset.key}
                  onClick={() => toggleAsset(asset.key)}
                  className={`brutal-btn flex flex-col items-center gap-2 py-5 text-sm ${
                    answers.assets.includes(asset.key) ? "brutal-btn-yellow" : ""
                  } ${idx === ASSET_OPTIONS.length - 1 && ASSET_OPTIONS.length % 2 !== 0 ? "col-span-2 md:col-span-1" : ""}`}
                >
                  <span className="text-2xl">{asset.icon}</span>
                  <span>{asset.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="brutal-card p-6 md:p-10">
            <h2 className="font-mono font-bold text-2xl md:text-3xl mb-2">
              Ballpark Amounts
            </h2>
            <p className="font-sans text-gray-600 mb-8">
              Roughly how much do you have in each? Don&apos;t worry about being
              exact.
            </p>

            {answers.assets.length === 0 ? (
              <p className="font-sans text-gray-400 italic">
                Go back and select your assets first.
              </p>
            ) : (
              <div className="space-y-6">
                {answers.assets.map((asset) => {
                  const info = ASSET_OPTIONS.find((a) => a.key === asset);
                  return (
                    <div key={asset}>
                      <label className="font-mono font-bold text-sm uppercase tracking-wide block mb-2">
                        {info?.icon} {info?.label}
                      </label>
                      <select
                        value={answers.assetAmounts[asset] || ""}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            assetAmounts: {
                              ...prev.assetAmounts,
                              [asset]: e.target.value,
                            },
                          }))
                        }
                        className="brutal-btn w-full text-left bg-white text-sm"
                      >
                        <option value="">Select range...</option>
                        {USD_RANGES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="brutal-card p-6 md:p-10">
            <h2 className="font-mono font-bold text-2xl md:text-3xl mb-2">
              Income from India
            </h2>
            <p className="font-sans text-gray-600 mb-8">
              Do you receive any income from Indian sources?
            </p>

            <div className="space-y-3 mb-8">
              {INCOME_OPTIONS.map((income) => (
                <button
                  key={income.key}
                  onClick={() => toggleIncome(income.key)}
                  className={`brutal-btn w-full text-left text-sm ${
                    answers.incomeTypes.includes(income.key)
                      ? "brutal-btn-yellow"
                      : ""
                  }`}
                >
                  {income.label}
                </button>
              ))}
            </div>

            {/* Amount ranges for selected income types */}
            {answers.incomeTypes.filter((i) => i !== "none").length > 0 && (
              <div className="space-y-6 pt-6 border-t-3 border-black">
                <p className="font-mono font-bold text-sm uppercase tracking-wide">
                  Approximate annual amounts
                </p>
                {answers.incomeTypes
                  .filter((i) => i !== "none")
                  .map((income) => {
                    const info = INCOME_OPTIONS.find((o) => o.key === income);
                    return (
                      <div key={income}>
                        <label className="font-mono font-bold text-sm block mb-2">
                          {info?.label}
                        </label>
                        <select
                          value={answers.incomeAmounts[income] || ""}
                          onChange={(e) =>
                            setAnswers((prev) => ({
                              ...prev,
                              incomeAmounts: {
                                ...prev.incomeAmounts,
                                [income]: e.target.value as AmountRangeUSD,
                              },
                            }))
                          }
                          className="brutal-btn w-full text-left bg-white text-sm"
                        >
                          <option value="">Select range...</option>
                          {USD_RANGES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Doc Check — one question per screen */}
        {step >= 5 && step <= totalSteps && (() => {
          const docIndex = step - 5;
          const item = visibleDocItems[docIndex];
          if (!item) return null;
          const val = answers[item.key] as TriState;
          return (
            <div className="brutal-card p-6 md:p-10">
              <h2 className="font-mono font-bold text-2xl md:text-3xl mb-2">
                Quick Document Check
              </h2>
              <p className="font-sans text-gray-600 mb-8">
                Question {docIndex + 1} of {visibleDocItems.length}
              </p>

              <p className="font-mono font-bold text-lg mb-6">
                {item.label}
              </p>

              <div className="grid grid-cols-1 gap-3">
                {([
                  { value: "yes" as const, label: "YES", activeClass: "brutal-btn-yellow" },
                  { value: "no" as const, label: "NO", activeClass: "brutal-btn-pink" },
                  { value: "not_sure" as const, label: "NOT SURE", activeClass: "brutal-btn-yellow" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      updateAnswer(item.key as keyof QuizAnswers, opt.value as never);
                      if (step < totalSteps) {
                        setStep((s) => s + 1);
                      } else {
                        handleSubmit();
                      }
                    }}
                    className={`brutal-btn text-sm ${
                      val === opt.value ? opt.activeClass : ""
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── Navigation ── */}
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="brutal-btn text-sm"
            >
              BACK
            </button>
          ) : (
            <div />
          )}

          {/* FIX #4: disabled state handled by CSS now — no opacity hack */}
          {step < totalSteps ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="brutal-btn brutal-btn-yellow text-sm"
            >
              NEXT
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="brutal-btn brutal-btn-pink text-lg"
            >
              SHOW MY SCORE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
