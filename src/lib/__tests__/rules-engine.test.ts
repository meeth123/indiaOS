import { describe, it, expect } from "vitest"
import { runRulesEngine } from "../rules-engine"
import { QuizAnswers, DEFAULT_QUIZ_ANSWERS } from "../types"

function makeAnswers(overrides: Partial<QuizAnswers>): QuizAnswers {
  return { ...DEFAULT_QUIZ_ANSWERS, usState: "TX", ...overrides }
}

describe("Rules Engine", () => {
  describe("Score Calculation", () => {
    it("returns score 100 when no rules triggered (all compliant)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2020",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        assetAmounts: { bank_accounts: "under_5k" },
        incomeTypes: ["none"],
        hasPAN: "yes",
        panLinkedAadhaar: "yes",
        hasAadhaar: "yes",
        hasOCI: "yes",
        ociUpdatedAfterPassportRenewal: "yes",
        filedIndianITR: "yes",
        filedFBAR: "yes",
        filedFATCA: "yes",
        reportedPFICs: "yes",
        updatedBankKYC: "yes",
        convertedToNRO: "yes",
      })
      const result = runRulesEngine(answers)
      expect(result.score).toBeGreaterThanOrEqual(80)
      expect(result.results.length).toBe(0)
    })

    it("returns score 0 or near 0 when everything is non-compliant", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2015",
        usStatus: "Green Card",
        filingStatus: "Married Filing Jointly",
        assets: ["bank_accounts", "mutual_funds", "stocks", "property", "life_insurance", "ppf", "nps", "epf", "nre_nro"],
        assetAmounts: { bank_accounts: "over_100k", mutual_funds: "over_100k" },
        incomeTypes: ["rental", "interest", "dividend", "capital_gains"],
        hasPAN: "no",
        panLinkedAadhaar: "no",
        hasAadhaar: "no",
        hasOCI: "no",
        ociUpdatedAfterPassportRenewal: "no",
        filedIndianITR: "no",
        filedFBAR: "no",
        filedFATCA: "no",
        reportedPFICs: "no",
        updatedBankKYC: "no",
        convertedToNRO: "no",
      })
      const result = runRulesEngine(answers)
      expect(result.score).toBeLessThanOrEqual(10)
      expect(result.results.length).toBeGreaterThan(5)
      expect(result.totalPenaltyMax).toBeGreaterThan(0)
    })

    it("score is between 0 and 100 inclusive", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds"],
        incomeTypes: ["rental"],
        hasPAN: "not_sure",
        panLinkedAadhaar: "not_sure",
        filedFBAR: "no",
        filedFATCA: "not_sure",
      })
      const result = runRulesEngine(answers)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })
  })

  describe("FBAR Rule", () => {
    it("triggers FBAR when user has bank accounts over $10k and has not filed", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        assetAmounts: { bank_accounts: "10k_50k" },
        incomeTypes: ["none"],
        filedFBAR: "no",
      })
      const result = runRulesEngine(answers)
      const fbar = result.results.find(r => r.rule_id.toLowerCase().includes("fbar"))
      expect(fbar).toBeDefined()
      expect(fbar!.severity).toBe("urgent")
    })

    it("does not trigger FBAR when user has filed", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        assetAmounts: { bank_accounts: "10k_50k" },
        incomeTypes: ["none"],
        filedFBAR: "yes",
        filedFATCA: "yes",
        filedIndianITR: "yes",
        hasPAN: "yes",
        panLinkedAadhaar: "yes",
        hasAadhaar: "yes",
        hasOCI: "yes",
        ociUpdatedAfterPassportRenewal: "yes",
        reportedPFICs: "yes",
        updatedBankKYC: "yes",
        convertedToNRO: "yes",
      })
      const result = runRulesEngine(answers)
      const fbar = result.results.find(r => r.rule_id.toLowerCase().includes("fbar"))
      expect(fbar).toBeUndefined()
    })
  })

  describe("FATCA Rule", () => {
    it("triggers FATCA for high-value foreign assets without filing", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts", "stocks"],
        assetAmounts: { bank_accounts: "50k_100k", stocks: "50k_100k" },
        incomeTypes: ["none"],
        filedFATCA: "no",
      })
      const result = runRulesEngine(answers)
      const fatca = result.results.find(r => r.rule_id.toLowerCase().includes("fatca"))
      expect(fatca).toBeDefined()
      expect(fatca!.severity).toBe("urgent")
    })
  })

  describe("PAN-Aadhaar Linkage Rule", () => {
    it("triggers when PAN exists but not linked to Aadhaar", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        incomeTypes: ["none"],
        hasPAN: "yes",
        panLinkedAadhaar: "no",
      })
      const result = runRulesEngine(answers)
      const pan = result.results.find(r => r.rule_id.toLowerCase().includes("pan"))
      expect(pan).toBeDefined()
    })
  })

  describe("FEMA Account Conversion Rule", () => {
    it("triggers when bank accounts exist but not converted to NRO", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        incomeTypes: ["none"],
        convertedToNRO: "no",
      })
      const result = runRulesEngine(answers)
      const fema = result.results.find(r => r.rule_id.toLowerCase().includes("fema"))
      expect(fema).toBeDefined()
    })
  })

  describe("Indian ITR Rule", () => {
    it("triggers when user has Indian income but has not filed ITR", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        incomeTypes: ["rental"],
        filedIndianITR: "no",
      })
      const result = runRulesEngine(answers)
      const itr = result.results.find(r => r.rule_id.toLowerCase().includes("itr") || r.rule_name.toLowerCase().includes("income tax"))
      expect(itr).toBeDefined()
    })
  })

  describe("PFIC Rule", () => {
    it("triggers when user has mutual funds but has not reported PFICs", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["mutual_funds"],
        incomeTypes: ["none"],
        reportedPFICs: "no",
      })
      const result = runRulesEngine(answers)
      const pfic = result.results.find(r => r.rule_id.toLowerCase().includes("pfic"))
      expect(pfic).toBeDefined()
      expect(pfic!.severity).toBe("urgent")
    })
  })

  describe("OCI Update Rule", () => {
    it("triggers when OCI exists but not updated after passport renewal", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "US Citizen",
        filingStatus: "Single",
        assets: [],
        incomeTypes: ["none"],
        hasOCI: "yes",
        ociUpdatedAfterPassportRenewal: "no",
      })
      const result = runRulesEngine(answers)
      const oci = result.results.find(r => r.rule_id.toLowerCase().includes("oci"))
      expect(oci).toBeDefined()
    })
  })

  describe("Not Sure answers", () => {
    it("triggers rules with reduced weight for not_sure answers", () => {
      const definiteNo = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        assetAmounts: { bank_accounts: "10k_50k" },
        incomeTypes: ["none"],
        filedFBAR: "no",
      })
      const notSure = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        assetAmounts: { bank_accounts: "10k_50k" },
        incomeTypes: ["none"],
        filedFBAR: "not_sure",
      })
      const resultNo = runRulesEngine(definiteNo)
      const resultNotSure = runRulesEngine(notSure)
      expect(resultNotSure.score).toBeGreaterThanOrEqual(resultNo.score)
    })
  })

  describe("Result Structure", () => {
    it("returns properly structured output", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        incomeTypes: ["rental"],
        filedFBAR: "no",
      })
      const result = runRulesEngine(answers)
      expect(result).toHaveProperty("score")
      expect(result).toHaveProperty("totalPenaltyMin")
      expect(result).toHaveProperty("totalPenaltyMax")
      expect(result).toHaveProperty("results")
      expect(Array.isArray(result.results)).toBe(true)

      if (result.results.length > 0) {
        const r = result.results[0]
        expect(r).toHaveProperty("rule_id")
        expect(r).toHaveProperty("rule_name")
        expect(r).toHaveProperty("severity")
        expect(r).toHaveProperty("status")
        expect(r).toHaveProperty("penalty_min_usd")
        expect(r).toHaveProperty("penalty_max_usd")
        expect(r).toHaveProperty("obligation_summary")
        expect(r).toHaveProperty("why_applies")
        expect(r).toHaveProperty("consequence")
        expect(r).toHaveProperty("fix_steps")
        expect(r).toHaveProperty("fix_time")
        expect(r).toHaveProperty("fix_cost")
        expect(r).toHaveProperty("fix_difficulty")
        expect(["urgent", "warning", "info"]).toContain(r.severity)
        expect(["triggered", "clear", "needs_review"]).toContain(r.status)
      }
    })

    it("results are sorted by severity (urgent first, then warning, then info)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2015",
        usStatus: "Green Card",
        filingStatus: "Married Filing Jointly",
        assets: ["bank_accounts", "mutual_funds", "property", "life_insurance", "ppf"],
        assetAmounts: { bank_accounts: "over_100k" },
        incomeTypes: ["rental", "interest"],
        hasPAN: "no",
        panLinkedAadhaar: "no",
        filedIndianITR: "no",
        filedFBAR: "no",
        filedFATCA: "no",
        reportedPFICs: "no",
        updatedBankKYC: "no",
        convertedToNRO: "no",
      })
      const result = runRulesEngine(answers)
      const severityOrder: Record<string, number> = { urgent: 0, warning: 1, info: 2 }
      for (let i = 1; i < result.results.length; i++) {
        const prev = severityOrder[result.results[i - 1].severity]
        const curr = severityOrder[result.results[i].severity]
        expect(curr).toBeGreaterThanOrEqual(prev)
      }
    })
  })

  describe("Status-Aware FBAR", () => {
    it("includes Substantial Presence Test note for first-year H1B", () => {
      const answers = makeAnswers({
        yearLeftIndia: String(new Date().getFullYear()),
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        assetAmounts: { bank_accounts: "10k_50k" },
        incomeTypes: ["none"],
        filedFBAR: "no",
      })
      const result = runRulesEngine(answers)
      const fbar = result.results.find(r => r.rule_id === "fbar")
      expect(fbar).toBeDefined()
      expect(fbar!.why_applies).toContain("Substantial Presence Test")
    })

    it("does not include SPT note for non-first-year H1B", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        assetAmounts: { bank_accounts: "10k_50k" },
        incomeTypes: ["none"],
        filedFBAR: "no",
      })
      const result = runRulesEngine(answers)
      const fbar = result.results.find(r => r.rule_id === "fbar")
      expect(fbar).toBeDefined()
      expect(fbar!.why_applies).not.toContain("Substantial Presence Test")
    })
  })

  describe("Status-Aware PFIC", () => {
    it("has higher weight for Green Card holders", () => {
      const h1b = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["mutual_funds"],
        incomeTypes: ["none"],
        reportedPFICs: "no",
      })
      const gc = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "Green Card",
        filingStatus: "Single",
        assets: ["mutual_funds"],
        incomeTypes: ["none"],
        reportedPFICs: "no",
      })
      const h1bResult = runRulesEngine(h1b)
      const gcResult = runRulesEngine(gc)
      const h1bPfic = h1bResult.results.find(r => r.rule_id === "pfic")
      const gcPfic = gcResult.results.find(r => r.rule_id === "pfic")
      expect(h1bPfic).toBeDefined()
      expect(gcPfic).toBeDefined()
      expect(gcPfic!.score_weight).toBeGreaterThan(h1bPfic!.score_weight)
    })

    it("mentions permanent obligation for US Citizens", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "US Citizen",
        filingStatus: "Single",
        assets: ["mutual_funds"],
        incomeTypes: ["none"],
        reportedPFICs: "no",
      })
      const result = runRulesEngine(answers)
      const pfic = result.results.find(r => r.rule_id === "pfic")
      expect(pfic).toBeDefined()
      expect(pfic!.why_applies).toContain("permanent annual obligation")
    })
  })

  describe("Status-Aware DTAA", () => {
    it("includes dual-residency warning for Green Card holders", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "Green Card",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        incomeTypes: ["rental"],
        filedFBAR: "no",
      })
      const result = runRulesEngine(answers)
      const dtaa = result.results.find(r => r.rule_id === "dtaa_trc")
      expect(dtaa).toBeDefined()
      expect(dtaa!.why_applies).toContain("dual-residency")
    })

    it("does not include dual-residency warning for H1B", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        incomeTypes: ["rental"],
        filedFBAR: "no",
      })
      const result = runRulesEngine(answers)
      const dtaa = result.results.find(r => r.rule_id === "dtaa_trc")
      expect(dtaa).toBeDefined()
      expect(dtaa!.why_applies).not.toContain("dual-residency")
    })
  })

  describe("Citizenship Renunciation Rule", () => {
    it("triggers for US Citizen who has not surrendered passport", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2015",
        usStatus: "US Citizen",
        filingStatus: "Single",
        assets: [],
        incomeTypes: ["none"],
        surrenderedIndianPassport: "no",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "citizenship_renunciation")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("warning")
      expect(rule!.score_weight).toBe(8)
    })

    it("does not trigger for US Citizen who has surrendered passport", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2015",
        usStatus: "US Citizen",
        filingStatus: "Single",
        assets: [],
        incomeTypes: ["none"],
        surrenderedIndianPassport: "yes",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "citizenship_renunciation")
      expect(rule).toBeUndefined()
    })

    it("does not trigger for H1B holders", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2015",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: [],
        incomeTypes: ["none"],
        surrenderedIndianPassport: "no",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "citizenship_renunciation")
      expect(rule).toBeUndefined()
    })
  })

  describe("State FEIE Non-Conformity Rule", () => {
    it("triggers for CA resident with Indian income", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        usState: "CA",
        assets: ["bank_accounts"],
        incomeTypes: ["rental"],
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "state_feie_gap")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("warning")
      expect(rule!.rule_name).toContain("CA")
    })

    it("does not trigger for TX resident (no state income tax)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        usState: "TX",
        assets: ["bank_accounts"],
        incomeTypes: ["rental"],
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "state_feie_gap")
      expect(rule).toBeUndefined()
    })

    it("does not trigger without Indian income", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        usState: "CA",
        assets: ["bank_accounts"],
        incomeTypes: ["none"],
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "state_feie_gap")
      expect(rule).toBeUndefined()
    })
  })

  describe("State FTC Gap Rule", () => {
    it("triggers for PA resident with Indian income", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        usState: "PA",
        assets: ["bank_accounts"],
        incomeTypes: ["interest"],
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "state_ftc_gap")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("warning")
    })

    it("does not trigger for FL resident", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        usState: "FL",
        assets: ["bank_accounts"],
        incomeTypes: ["interest"],
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "state_ftc_gap")
      expect(rule).toBeUndefined()
    })
  })

  describe("Washington Capital Gains Rule", () => {
    it("triggers for WA resident with high-value stocks", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        usState: "WA",
        assets: ["stocks"],
        assetAmounts: { stocks: "over_100k" },
        incomeTypes: ["none"],
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "wa_capital_gains")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("info")
    })

    it("does not trigger for WA resident with low-value stocks", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        usState: "WA",
        assets: ["stocks"],
        assetAmounts: { stocks: "under_5k" },
        incomeTypes: ["none"],
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "wa_capital_gains")
      expect(rule).toBeUndefined()
    })

    it("does not trigger for non-WA resident", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        usState: "CA",
        assets: ["stocks"],
        assetAmounts: { stocks: "over_100k" },
        incomeTypes: ["none"],
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "wa_capital_gains")
      expect(rule).toBeUndefined()
    })
  })

  describe("Edge Cases", () => {
    it("handles empty/default answers without crashing", () => {
      const result = runRulesEngine(DEFAULT_QUIZ_ANSWERS)
      expect(result).toHaveProperty("score")
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })

    it("handles no assets selected", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2020",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: [],
        incomeTypes: ["none"],
      })
      const result = runRulesEngine(answers)
      expect(result.score).toBeGreaterThanOrEqual(0)
    })

    it("totalPenaltyMin is less than or equal to totalPenaltyMax", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2015",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds"],
        incomeTypes: ["rental"],
        filedFBAR: "no",
        filedFATCA: "no",
        reportedPFICs: "no",
      })
      const result = runRulesEngine(answers)
      expect(result.totalPenaltyMin).toBeLessThanOrEqual(result.totalPenaltyMax)
    })
  })
})
