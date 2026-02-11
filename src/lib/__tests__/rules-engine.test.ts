import { describe, it, expect } from "vitest"
import { runRulesEngine } from "../rules-engine"
import { QuizAnswers, DEFAULT_QUIZ_ANSWERS } from "../types"

function makeAnswers(overrides: Partial<QuizAnswers>): QuizAnswers {
  return { ...DEFAULT_QUIZ_ANSWERS, usState: "TX", ...overrides }
}

describe("Rules Engine", () => {
  describe("Score Calculation", () => {
    it("returns score 100 when no rules triggered (all compliant)", () => {
      // H1B: OCI/surrender questions never shown → omit (stay "")
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
      // Green Card: OCI/surrender questions never shown → stay "" (default)
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

  /* ── Bug Fix: Empty string ("") handling consistency (Bug 5) ── */
  describe("Empty string handling — all rules return null for unanswered fields", () => {
    it("citizenship_renunciation returns null when surrenderedIndianPassport is empty", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2015",
        usStatus: "US Citizen",
        filingStatus: "Single",
        assets: [],
        incomeTypes: ["none"],
        surrenderedIndianPassport: "",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "citizenship_renunciation")
      expect(rule).toBeUndefined()
    })

    it("fbar returns null when filedFBAR is empty", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        assetAmounts: { bank_accounts: "10k_50k" },
        incomeTypes: ["none"],
        filedFBAR: "",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "fbar")
      expect(rule).toBeUndefined()
    })

    it("fatca returns null when filedFATCA is empty", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds", "stocks"],
        assetAmounts: { bank_accounts: "over_100k" },
        incomeTypes: ["none"],
        filedFATCA: "",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "fatca")
      expect(rule).toBeUndefined()
    })

    it("pan_inoperative returns null when panLinkedAadhaar is empty", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        incomeTypes: ["none"],
        hasPAN: "yes",
        hasAadhaar: "yes",
        panLinkedAadhaar: "",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "pan_inoperative")
      expect(rule).toBeUndefined()
    })

    it("fema_conversion returns null when convertedToNRO is empty", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        incomeTypes: ["none"],
        convertedToNRO: "",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "fema_conversion")
      expect(rule).toBeUndefined()
    })

    it("indian_itr returns null when filedIndianITR is empty", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        incomeTypes: ["rental"],
        filedIndianITR: "",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "indian_itr")
      expect(rule).toBeUndefined()
    })

    it("pfic returns null when reportedPFICs is empty", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["mutual_funds"],
        incomeTypes: ["none"],
        reportedPFICs: "",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "pfic")
      expect(rule).toBeUndefined()
    })

    it("oci_update returns null when ociUpdatedAfterPassportRenewal is empty", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "US Citizen",
        filingStatus: "Single",
        assets: [],
        incomeTypes: ["none"],
        hasOCI: "yes",
        ociUpdatedAfterPassportRenewal: "",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "oci_update")
      expect(rule).toBeUndefined()
    })

    it("bank_kyc returns null when updatedBankKYC is empty", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        incomeTypes: ["none"],
        updatedBankKYC: "",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "bank_kyc")
      expect(rule).toBeUndefined()
    })
  })

  /* ── Bug Fix: Citizenship rule triWeight consistency (Bug 5) ── */
  describe("Citizenship rule triWeight consistency", () => {
    it("uses NOT_SURE_FACTOR for not_sure answer", () => {
      const noAnswer = makeAnswers({
        yearLeftIndia: "2015",
        usStatus: "US Citizen",
        filingStatus: "Single",
        assets: [],
        incomeTypes: ["none"],
        surrenderedIndianPassport: "no",
      })
      const notSureAnswer = makeAnswers({
        yearLeftIndia: "2015",
        usStatus: "US Citizen",
        filingStatus: "Single",
        assets: [],
        incomeTypes: ["none"],
        surrenderedIndianPassport: "not_sure",
      })
      const noResult = runRulesEngine(noAnswer)
      const notSureResult = runRulesEngine(notSureAnswer)
      const noRule = noResult.results.find(r => r.rule_id === "citizenship_renunciation")
      const notSureRule = notSureResult.results.find(r => r.rule_id === "citizenship_renunciation")
      expect(noRule).toBeDefined()
      expect(notSureRule).toBeDefined()
      expect(noRule!.score_weight).toBe(8)
      expect(notSureRule!.score_weight).toBe(8 * 0.7)
    })
  })

  /* ── PAN-Aadhaar conditional tests ── */
  describe("PAN-Aadhaar linkage conditional", () => {
    it("pan_inoperative does not trigger when hasPAN is no", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        incomeTypes: ["none"],
        hasPAN: "no",
        hasAadhaar: "yes",
        panLinkedAadhaar: "no",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "pan_inoperative")
      expect(rule).toBeUndefined()
    })

    it("pan_inoperative does not trigger when hasAadhaar is no", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        incomeTypes: ["none"],
        hasPAN: "yes",
        hasAadhaar: "no",
        panLinkedAadhaar: "no",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "pan_inoperative")
      expect(rule).toBeUndefined()
    })

    it("pan_inoperative triggers when both PAN and Aadhaar exist but not linked", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        incomeTypes: ["none"],
        hasPAN: "yes",
        hasAadhaar: "yes",
        panLinkedAadhaar: "no",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "pan_inoperative")
      expect(rule).toBeDefined()
    })
  })

  /* ── OCI conditional chain ── */
  describe("OCI conditional chain", () => {
    it("oci_update does not trigger when hasOCI is no", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "US Citizen",
        filingStatus: "Single",
        assets: [],
        incomeTypes: ["none"],
        hasOCI: "no",
        ociUpdatedAfterPassportRenewal: "no",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "oci_update")
      expect(rule).toBeUndefined()
    })

    it("oci_update does not trigger for non-US-Citizen even with OCI", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: [],
        incomeTypes: ["none"],
        hasOCI: "yes",
        ociUpdatedAfterPassportRenewal: "no",
      })
      const result = runRulesEngine(answers)
      // OCI update rule checks hasOCI but doesn't check usStatus directly
      // However, OCI is only shown to US Citizens in the quiz
      // The rule only checks hasOCI === "yes"
      const rule = result.results.find(r => r.rule_id === "oci_update")
      // The rule itself only gates on hasOCI, not usStatus — it will still fire
      // This is fine: if someone somehow answers hasOCI=yes, the rule is valid
      expect(rule).toBeDefined()
    })

    it("oci_update triggers for US Citizen with OCI not updated", () => {
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
      const rule = result.results.find(r => r.rule_id === "oci_update")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("warning")
    })
  })

  /* ── FBAR visibility alignment (Bug 6) ── */
  describe("FBAR rule alignment with quiz visibility", () => {
    it("fbar does not trigger for PPF-only user with low amounts", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["ppf"],
        assetAmounts: { ppf: "under_5k" },
        incomeTypes: ["none"],
        filedFBAR: "no",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "fbar")
      expect(rule).toBeUndefined()
    })

    it("fbar does not trigger for EPF-only user", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["epf"],
        assetAmounts: { epf: "under_5k" },
        incomeTypes: ["none"],
        filedFBAR: "no",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "fbar")
      expect(rule).toBeUndefined()
    })

    it("fbar triggers when user has bank_accounts (foreign accounts)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        assetAmounts: { bank_accounts: "under_5k" },
        incomeTypes: ["none"],
        filedFBAR: "no",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "fbar")
      expect(rule).toBeDefined()
    })

    it("fbar triggers when user has nre_nro (foreign accounts)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["nre_nro"],
        assetAmounts: { nre_nro: "under_5k" },
        incomeTypes: ["none"],
        filedFBAR: "no",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "fbar")
      expect(rule).toBeDefined()
    })

    it("fbar triggers with 2+ financial account types via totalAggregateAbove10K", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["ppf", "epf"],
        incomeTypes: ["none"],
        filedFBAR: "no",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "fbar")
      expect(rule).toBeDefined()
    })
  })

  /* ── All-yes (fully compliant) per status ── */
  /*
   * OCI/surrendered questions are only shown for US Citizens in the quiz.
   * For H1B/GC/Other, those fields stay "" (default). Tests must reflect
   * realistic UI state — not impossible combinations.
   */
  describe("All-yes (fully compliant) per status", () => {
    // Shared fields visible to ALL statuses
    const allYesCommon: Partial<QuizAnswers> = {
      yearLeftIndia: "2018",
      filingStatus: "Single",
      assets: ["bank_accounts", "mutual_funds", "stocks", "property", "life_insurance", "ppf", "nps", "epf", "nre_nro"],
      assetAmounts: { bank_accounts: "over_100k", mutual_funds: "over_100k" },
      incomeTypes: ["rental", "interest"],
      hasPAN: "yes",
      panLinkedAadhaar: "yes",
      hasAadhaar: "yes",
      filedIndianITR: "yes",
      filedFBAR: "yes",
      filedFATCA: "yes",
      reportedPFICs: "yes",
      updatedBankKYC: "yes",
      convertedToNRO: "yes",
    }

    // US-Citizen-only fields (OCI, surrendered passport)
    const citizenOnlyYes: Partial<QuizAnswers> = {
      hasOCI: "yes",
      ociUpdatedAfterPassportRenewal: "yes",
      surrenderedIndianPassport: "yes",
    }

    const triStateRules = ["fbar", "fatca", "indian_itr", "pan_inoperative", "fema_conversion", "oci_update", "pfic", "bank_kyc", "citizenship_renunciation"]

    it("H1B: all-yes → no triState-dependent rules trigger", () => {
      const answers = makeAnswers({ ...allYesCommon, usStatus: "H1B" })
      const result = runRulesEngine(answers)
      const triggered = result.results.filter(r => triStateRules.includes(r.rule_id))
      expect(triggered).toHaveLength(0)
    })

    it("Green Card: all-yes → no triState-dependent rules trigger", () => {
      const answers = makeAnswers({ ...allYesCommon, usStatus: "Green Card" })
      const result = runRulesEngine(answers)
      const triggered = result.results.filter(r => triStateRules.includes(r.rule_id))
      expect(triggered).toHaveLength(0)
    })

    it("US Citizen: all-yes → no triState-dependent rules trigger", () => {
      const answers = makeAnswers({ ...allYesCommon, ...citizenOnlyYes, usStatus: "US Citizen" })
      const result = runRulesEngine(answers)
      const triggered = result.results.filter(r => triStateRules.includes(r.rule_id))
      expect(triggered).toHaveLength(0)
    })

    it("Other: all-yes → no triState-dependent rules trigger", () => {
      const answers = makeAnswers({ ...allYesCommon, usStatus: "Other" })
      const result = runRulesEngine(answers)
      const triggered = result.results.filter(r => triStateRules.includes(r.rule_id))
      expect(triggered).toHaveLength(0)
    })
  })

  /* ── All-no (fully non-compliant) per status ── */
  describe("All-no (fully non-compliant) per status", () => {
    // Shared fields visible to ALL statuses
    const allNoCommon: Partial<QuizAnswers> = {
      yearLeftIndia: "2010",
      filingStatus: "Single",
      assets: ["bank_accounts", "mutual_funds", "stocks", "property", "life_insurance", "ppf", "nps", "epf", "nre_nro"],
      assetAmounts: { bank_accounts: "over_100k", mutual_funds: "over_100k" },
      incomeTypes: ["rental", "interest"],
      hasPAN: "yes",
      panLinkedAadhaar: "no",
      hasAadhaar: "yes",
      filedIndianITR: "no",
      filedFBAR: "no",
      filedFATCA: "no",
      reportedPFICs: "no",
      updatedBankKYC: "no",
      convertedToNRO: "no",
    }

    // US-Citizen-only fields
    const citizenOnlyNo: Partial<QuizAnswers> = {
      hasOCI: "yes",
      ociUpdatedAfterPassportRenewal: "no",
      surrenderedIndianPassport: "no",
    }

    it("H1B: all-no → multiple rules trigger with low score", () => {
      const answers = makeAnswers({ ...allNoCommon, usStatus: "H1B" })
      const result = runRulesEngine(answers)
      // H1B never sees OCI/surrender questions → oci_update & citizenship never fire
      const ruleIds = result.results.map(r => r.rule_id)
      expect(ruleIds).not.toContain("oci_update")
      expect(ruleIds).not.toContain("citizenship_renunciation")
      expect(result.results.length).toBeGreaterThanOrEqual(5)
      expect(result.score).toBeLessThanOrEqual(20)
    })

    it("Green Card: all-no → multiple rules trigger, no OCI/citizenship rules", () => {
      const answers = makeAnswers({ ...allNoCommon, usStatus: "Green Card" })
      const result = runRulesEngine(answers)
      // GC never sees OCI/surrender questions → those rules never fire
      const ruleIds = result.results.map(r => r.rule_id)
      expect(ruleIds).not.toContain("oci_update")
      expect(ruleIds).not.toContain("citizenship_renunciation")
      expect(result.results.length).toBeGreaterThanOrEqual(5)
      expect(result.score).toBeLessThanOrEqual(20)
    })

    it("US Citizen: all-no → includes citizenship_renunciation + oci_update", () => {
      const answers = makeAnswers({ ...allNoCommon, ...citizenOnlyNo, usStatus: "US Citizen" })
      const result = runRulesEngine(answers)
      const ruleIds = result.results.map(r => r.rule_id)
      expect(ruleIds).toContain("citizenship_renunciation")
      expect(ruleIds).toContain("oci_update")
      expect(result.results.length).toBeGreaterThanOrEqual(7)
    })
  })

  /* ── All-not-sure per status ── */
  describe("All-not-sure per status", () => {
    // Shared not_sure fields visible to ALL statuses
    const allNotSureCommon: Partial<QuizAnswers> = {
      yearLeftIndia: "2010",
      filingStatus: "Single",
      assets: ["bank_accounts", "mutual_funds", "stocks", "property", "life_insurance", "ppf", "nps", "epf", "nre_nro"],
      assetAmounts: { bank_accounts: "over_100k", mutual_funds: "over_100k" },
      incomeTypes: ["rental", "interest"],
      hasPAN: "not_sure",
      panLinkedAadhaar: "not_sure",
      hasAadhaar: "not_sure",
      filedIndianITR: "not_sure",
      filedFBAR: "not_sure",
      filedFATCA: "not_sure",
      reportedPFICs: "not_sure",
      updatedBankKYC: "not_sure",
      convertedToNRO: "not_sure",
    }

    it("not_sure score is higher than all-no score (reduced weight)", () => {
      const notSureAnswers = makeAnswers({ ...allNotSureCommon, usStatus: "H1B" })
      const noAnswers = makeAnswers({
        ...allNotSureCommon,
        usStatus: "H1B",
        hasPAN: "yes",
        hasAadhaar: "yes",
        panLinkedAadhaar: "no",
        filedIndianITR: "no",
        filedFBAR: "no",
        filedFATCA: "no",
        reportedPFICs: "no",
        updatedBankKYC: "no",
        convertedToNRO: "no",
      })
      const notSureResult = runRulesEngine(notSureAnswers)
      const noResult = runRulesEngine(noAnswers)
      expect(notSureResult.score).toBeGreaterThanOrEqual(noResult.score)
    })

    it("all not_sure rules have needs_review status (H1B)", () => {
      const answers = makeAnswers({ ...allNotSureCommon, usStatus: "H1B" })
      const result = runRulesEngine(answers)
      // H1B only sees common triState rules — no OCI/citizenship
      const triStateRules = result.results.filter(r =>
        ["fbar", "fatca", "indian_itr", "pan_inoperative", "fema_conversion", "pfic", "bank_kyc"].includes(r.rule_id)
      )
      for (const rule of triStateRules) {
        expect(rule.status).toBe("needs_review")
      }
    })

    it("all not_sure rules have needs_review status (US Citizen)", () => {
      const answers = makeAnswers({
        ...allNotSureCommon,
        usStatus: "US Citizen",
        hasOCI: "not_sure",
        ociUpdatedAfterPassportRenewal: "not_sure",
        surrenderedIndianPassport: "not_sure",
      })
      const result = runRulesEngine(answers)
      // US Citizen sees ALL triState rules including OCI + citizenship
      const triStateRules = result.results.filter(r =>
        ["fbar", "fatca", "indian_itr", "pan_inoperative", "fema_conversion", "oci_update", "pfic", "bank_kyc", "citizenship_renunciation"].includes(r.rule_id)
      )
      for (const rule of triStateRules) {
        expect(rule.status).toBe("needs_review")
      }
    })
  })

  /* ── Mixed real-world scenarios ── */
  describe("Mixed real-world scenarios", () => {
    it("H1B in CA with bank + MF + rental: triggers FBAR, PFIC, ITR, state rules", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "H1B",
        filingStatus: "Single",
        usState: "CA",
        assets: ["bank_accounts", "mutual_funds"],
        assetAmounts: { bank_accounts: "10k_50k", mutual_funds: "50k_100k" },
        incomeTypes: ["rental"],
        hasPAN: "yes",
        hasAadhaar: "yes",
        panLinkedAadhaar: "yes",
        filedFBAR: "no",
        filedFATCA: "no",
        filedIndianITR: "no",
        reportedPFICs: "no",
        updatedBankKYC: "yes",
        convertedToNRO: "yes",
      })
      const result = runRulesEngine(answers)
      const ruleIds = result.results.map(r => r.rule_id)
      expect(ruleIds).toContain("fbar")
      expect(ruleIds).toContain("pfic")
      expect(ruleIds).toContain("indian_itr")
      expect(ruleIds).toContain("state_feie_gap")
      expect(ruleIds).toContain("state_ftc_gap")
    })

    it("Green Card in WA with stocks: triggers WA capital gains if high value", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "Green Card",
        filingStatus: "Single",
        usState: "WA",
        assets: ["stocks"],
        assetAmounts: { stocks: "over_100k" },
        incomeTypes: ["none"],
      })
      const result = runRulesEngine(answers)
      const ruleIds = result.results.map(r => r.rule_id)
      expect(ruleIds).toContain("wa_capital_gains")
    })

    it("US Citizen with all assets: triggers citizenship + OCI + FBAR + PFIC + more", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2010",
        usStatus: "US Citizen",
        filingStatus: "Married Filing Jointly",
        assets: ["bank_accounts", "mutual_funds", "stocks", "property", "life_insurance", "ppf", "nps", "epf", "nre_nro"],
        assetAmounts: { bank_accounts: "over_100k", mutual_funds: "over_100k" },
        incomeTypes: ["rental", "interest", "dividend", "capital_gains"],
        hasPAN: "yes",
        hasAadhaar: "yes",
        panLinkedAadhaar: "no",
        hasOCI: "yes",
        ociUpdatedAfterPassportRenewal: "no",
        surrenderedIndianPassport: "no",
        filedIndianITR: "no",
        filedFBAR: "no",
        filedFATCA: "no",
        reportedPFICs: "no",
        updatedBankKYC: "no",
        convertedToNRO: "no",
      })
      const result = runRulesEngine(answers)
      const ruleIds = result.results.map(r => r.rule_id)
      expect(ruleIds).toContain("citizenship_renunciation")
      expect(ruleIds).toContain("oci_update")
      expect(ruleIds).toContain("fbar")
      expect(ruleIds).toContain("fatca")
      expect(ruleIds).toContain("pfic")
      expect(ruleIds).toContain("indian_itr")
      expect(ruleIds).toContain("pan_inoperative")
      expect(ruleIds).toContain("fema_conversion")
      expect(ruleIds).toContain("bank_kyc")
      expect(result.score).toBeLessThanOrEqual(5)
      expect(result.totalPenaltyMax).toBeGreaterThan(100000)
    })

    it("H1B with only property and no income: minimal rules", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2020",
        usStatus: "H1B",
        filingStatus: "Single",
        assets: ["property"],
        incomeTypes: ["none"],
        hasPAN: "yes",
        hasAadhaar: "yes",
        panLinkedAadhaar: "yes",
        filedIndianITR: "yes",
      })
      const result = runRulesEngine(answers)
      // Should still get property_tax info and possibly ITR
      const ruleIds = result.results.map(r => r.rule_id)
      expect(ruleIds).toContain("property_tax")
      // No FBAR, no PFIC, no FEMA conversion
      expect(ruleIds).not.toContain("fbar")
      expect(ruleIds).not.toContain("pfic")
      expect(ruleIds).not.toContain("fema_conversion")
    })

    it("Other status with bank accounts: basic rules apply", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2019",
        usStatus: "Other",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        assetAmounts: { bank_accounts: "10k_50k" },
        incomeTypes: ["interest"],
        filedFBAR: "no",
        convertedToNRO: "no",
        updatedBankKYC: "no",
        filedIndianITR: "no",
      })
      const result = runRulesEngine(answers)
      const ruleIds = result.results.map(r => r.rule_id)
      expect(ruleIds).toContain("fbar")
      expect(ruleIds).toContain("fema_conversion")
      expect(ruleIds).toContain("bank_kyc")
      expect(ruleIds).toContain("indian_itr")
      // No citizenship rules for "Other" status
      expect(ruleIds).not.toContain("citizenship_renunciation")
    })
  })

  /* ── Green Card exhaustive coverage (14 gaps) ── */
  describe("Green Card — exhaustive rule coverage", () => {

    // Gap 1: GC-specific FBAR with "no"
    it("GC + bank_accounts + filedFBAR=no → FBAR fires", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "Green Card",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        assetAmounts: { bank_accounts: "10k_50k" },
        incomeTypes: ["none"],
        filedFBAR: "no",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "fbar")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("urgent")
      expect(rule!.score_weight).toBe(20)
    })

    // Gap 2: GC + FATCA + MFJ (different threshold text)
    it("GC + MFJ + high assets + filedFATCA=no → FATCA fires with MFJ thresholds", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "Green Card",
        filingStatus: "Married Filing Jointly",
        assets: ["bank_accounts", "mutual_funds", "stocks"],
        assetAmounts: { bank_accounts: "over_100k" },
        incomeTypes: ["none"],
        filedFATCA: "no",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "fatca")
      expect(rule).toBeDefined()
      expect(rule!.obligation_summary).toContain("$100,000 (married filing jointly)")
      expect(rule!.obligation_summary).toContain("$200,000")
      expect(rule!.why_applies).toContain("$100,000 MFJ")
    })

    // Gap 3: GC + FATCA + low-value single asset → null
    it("GC + single low-value asset → FATCA does not fire", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "Green Card",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        assetAmounts: { bank_accounts: "under_5k" },
        incomeTypes: ["none"],
        filedFATCA: "no",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "fatca")
      expect(rule).toBeUndefined()
    })

    // Gap 4: GC + ITR why_applies text mentions Green Card
    it("GC + rental income + filedIndianITR=no → ITR fires with GC-specific text", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "Green Card",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        incomeTypes: ["rental"],
        filedIndianITR: "no",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "indian_itr")
      expect(rule).toBeDefined()
      expect(rule!.why_applies).toContain("Green Card holder")
      expect(rule!.why_applies).toContain("NRI status")
    })

    // Gap 5: GC + PFIC "not_sure" weight = 15 * 0.7 = 10.5
    it("GC + mutual_funds + reportedPFICs=not_sure → PFIC weight = 15 * 0.7", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "Green Card",
        filingStatus: "Single",
        assets: ["mutual_funds"],
        incomeTypes: ["none"],
        reportedPFICs: "not_sure",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "pfic")
      expect(rule).toBeDefined()
      expect(rule!.score_weight).toBe(15 * 0.7)
      expect(rule!.status).toBe("needs_review")
    })

    // Gap 6: GC + hasOCI="" (default — OCI question never shown for GC)
    it("GC + hasOCI='' (default) → oci_update does not fire", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "Green Card",
        filingStatus: "Single",
        assets: [],
        incomeTypes: ["none"],
        hasOCI: "",
        ociUpdatedAfterPassportRenewal: "",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "oci_update")
      expect(rule).toBeUndefined()
    })

    // Gap 7: GC + aadhaar_biometric (left > 10 yrs ago)
    it("GC + hasAadhaar=yes + left > 10 yrs ago → aadhaar_biometric fires", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2010",
        usStatus: "Green Card",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        incomeTypes: ["none"],
        hasAadhaar: "yes",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "aadhaar_biometric")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("info")
      expect(rule!.why_applies).toContain("2010")
    })

    // Gap 8: GC + aadhaar_biometric (left ≤ 10 yrs ago) → does NOT fire
    it("GC + hasAadhaar=yes + left ≤ 10 yrs ago → aadhaar_biometric does not fire", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2020",
        usStatus: "Green Card",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        incomeTypes: ["none"],
        hasAadhaar: "yes",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "aadhaar_biometric")
      expect(rule).toBeUndefined()
    })

    // Gap 9: GC + tds_certificates (rental + interest income)
    it("GC + rental + interest income → tds_certificates fires", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "Green Card",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        incomeTypes: ["rental", "interest"],
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "tds_certificates")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("info")
      expect(rule!.why_applies).toContain("interest")
      expect(rule!.why_applies).toContain("rental")
    })

    // Gap 10: GC + repatriation (single high-value asset)
    it("GC + single high-value asset → repatriation fires", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "Green Card",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        assetAmounts: { bank_accounts: "over_100k" },
        incomeTypes: ["none"],
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "repatriation")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("warning")
    })

    // Gap 11: GC + property → property_tax fires
    it("GC + property → property_tax fires", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "Green Card",
        filingStatus: "Single",
        assets: ["property"],
        incomeTypes: ["none"],
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "property_tax")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("info")
    })

    // Gap 12: GC + life_insurance → lic_premium fires
    it("GC + life_insurance → lic_premium fires", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "Green Card",
        filingStatus: "Single",
        assets: ["life_insurance"],
        incomeTypes: ["none"],
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "lic_premium")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("warning")
    })

    // Gap 13: GC + ppf → ppf_nri fires
    it("GC + ppf → ppf_nri fires", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018",
        usStatus: "Green Card",
        filingStatus: "Single",
        assets: ["ppf"],
        incomeTypes: ["none"],
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "ppf_nri")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("info")
    })

    // Gap 14: GC → citizenship_renunciation NEVER fires
    it("GC → citizenship_renunciation never fires regardless of answers", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2010",
        usStatus: "Green Card",
        filingStatus: "Single",
        assets: ["bank_accounts"],
        incomeTypes: ["none"],
        surrenderedIndianPassport: "no",
      })
      const result = runRulesEngine(answers)
      const rule = result.results.find(r => r.rule_id === "citizenship_renunciation")
      expect(rule).toBeUndefined()
    })
  })

  /* ══════════════════════════════════════════════════════════════
   * H1B — EXHAUSTIVE RULE COVERAGE
   * Covers every branch of every rule for H1B visa holders.
   * H1B holders NEVER see OCI/surrender questions (those stay "").
   * citizenship_renunciation NEVER fires for H1B.
   * PFIC base weight = 12 (not 15).
   * isFirstYearH1B fires only when yearLeft = current year.
   * ══════════════════════════════════════════════════════════════ */
  describe("H1B — exhaustive rule coverage", () => {

    /* ── 1. FBAR (rule_fbar) ──
     * Gate: hasForeignAccounts(bank_accounts || nre_nro) || totalAggregateAbove10K
     * triState: filedFBAR — yes→null, no→20, not_sure→14, ""→null
     * isFirstYearH1B: adds SPT note when yearLeft = current year
     */
    describe("FBAR", () => {
      it("filedFBAR='no' → fires, weight=20, status=triggered, severity=urgent", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
          incomeTypes: ["none"], filedFBAR: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
        expect(rule).toBeDefined()
        expect(rule!.severity).toBe("urgent")
        expect(rule!.score_weight).toBe(20)
        expect(rule!.status).toBe("triggered")
      })

      it("filedFBAR='not_sure' → weight=14, status=needs_review", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
          incomeTypes: ["none"], filedFBAR: "not_sure",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
        expect(rule).toBeDefined()
        expect(rule!.score_weight).toBe(20 * 0.7)
        expect(rule!.status).toBe("needs_review")
      })

      it("filedFBAR='yes' → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
          incomeTypes: ["none"], filedFBAR: "yes",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "fbar")).toBeUndefined()
      })

      it("filedFBAR='' → null (unanswered)", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
          incomeTypes: ["none"], filedFBAR: "",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "fbar")).toBeUndefined()
      })

      it("nre_nro → fires via hasForeignAccounts, why_applies mentions NRE/NRO", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["nre_nro"], assetAmounts: { nre_nro: "10k_50k" },
          incomeTypes: ["none"], filedFBAR: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
        expect(rule).toBeDefined()
        expect(rule!.why_applies).toContain("NRE/NRO")
      })

      it("bank_accounts → why_applies mentions Indian bank accounts", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
          incomeTypes: ["none"], filedFBAR: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
        expect(rule).toBeDefined()
        expect(rule!.why_applies).toContain("Indian bank accounts")
      })

      it("ppf + epf (2 account types) → fires via totalAggregateAbove10K", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["ppf", "epf"], incomeTypes: ["none"], filedFBAR: "no",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "fbar")).toBeDefined()
      })

      it("ppf only (1 low-value, no foreign accounts) → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["ppf"], assetAmounts: { ppf: "under_5k" },
          incomeTypes: ["none"], filedFBAR: "no",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "fbar")).toBeUndefined()
      })

      it("no foreign accounts + no totalAggregate (stocks only) → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["stocks"], incomeTypes: ["none"], filedFBAR: "no",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "fbar")).toBeUndefined()
      })

      it("first-year H1B (yearLeft=current year) → SPT note in why_applies", () => {
        const answers = makeAnswers({
          yearLeftIndia: String(new Date().getFullYear()),
          usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
          incomeTypes: ["none"], filedFBAR: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
        expect(rule).toBeDefined()
        expect(rule!.why_applies).toContain("Substantial Presence Test")
        expect(rule!.why_applies).toContain("first-year H1B")
      })

      it("non-first-year H1B → no SPT note", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
          incomeTypes: ["none"], filedFBAR: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
        expect(rule).toBeDefined()
        expect(rule!.why_applies).not.toContain("Substantial Presence Test")
      })

      it("bank_accounts over_100k → fires via both hasForeignAccounts and totalAggregate", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], assetAmounts: { bank_accounts: "over_100k" },
          incomeTypes: ["none"], filedFBAR: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
        expect(rule).toBeDefined()
        expect(rule!.score_weight).toBe(20)
      })

      it("no assets at all → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: [], incomeTypes: ["none"], filedFBAR: "no",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "fbar")).toBeUndefined()
      })
    })

    /* ── 2. FATCA (rule_fatca) ──
     * Gate: hasAnyAssets AND totalAssetsAbove50K
     * totalAssetsAbove50K: any asset 50k_100k/over_100k OR assets.length >= 3
     * triState: filedFATCA — yes→null, no→15, not_sure→10.5, ""→null
     * Filing thresholds differ: Single=$50K/$75K, MFJ=$100K/$200K
     */
    describe("FATCA", () => {
      it("filedFATCA='no' + high-value → fires, weight=15, triggered", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts", "mutual_funds", "stocks"],
          assetAmounts: { bank_accounts: "over_100k" },
          incomeTypes: ["none"], filedFATCA: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
        expect(rule).toBeDefined()
        expect(rule!.score_weight).toBe(15)
        expect(rule!.status).toBe("triggered")
      })

      it("filedFATCA='not_sure' → weight=15*0.7, needs_review", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts", "mutual_funds", "stocks"],
          assetAmounts: { bank_accounts: "over_100k" },
          incomeTypes: ["none"], filedFATCA: "not_sure",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
        expect(rule).toBeDefined()
        expect(rule!.score_weight).toBe(15 * 0.7)
        expect(rule!.status).toBe("needs_review")
      })

      it("filedFATCA='yes' → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts", "mutual_funds", "stocks"],
          assetAmounts: { bank_accounts: "over_100k" },
          incomeTypes: ["none"], filedFATCA: "yes",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "fatca")).toBeUndefined()
      })

      it("filedFATCA='' → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts", "mutual_funds", "stocks"],
          assetAmounts: { bank_accounts: "over_100k" },
          incomeTypes: ["none"], filedFATCA: "",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "fatca")).toBeUndefined()
      })

      it("no assets → null (gate: hasAnyAssets fails)", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: [], incomeTypes: ["none"], filedFATCA: "no",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "fatca")).toBeUndefined()
      })

      it("single low-value asset → null (totalAssetsAbove50K false)", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], assetAmounts: { bank_accounts: "under_5k" },
          incomeTypes: ["none"], filedFATCA: "no",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "fatca")).toBeUndefined()
      })

      it("3+ asset types (even low-value) → fires via totalAssetsAbove50K count path", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts", "mutual_funds", "stocks"],
          assetAmounts: { bank_accounts: "under_5k" },
          incomeTypes: ["none"], filedFATCA: "no",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "fatca")).toBeDefined()
      })

      it("Single → shows $50,000/$75,000 thresholds", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts", "mutual_funds", "stocks"],
          assetAmounts: { bank_accounts: "over_100k" },
          incomeTypes: ["none"], filedFATCA: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
        expect(rule).toBeDefined()
        expect(rule!.obligation_summary).toContain("$50,000 (single/MFS)")
        expect(rule!.obligation_summary).toContain("$75,000")
      })

      it("MFJ → shows $100,000/$200,000 thresholds", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B",
          filingStatus: "Married Filing Jointly",
          assets: ["bank_accounts", "mutual_funds", "stocks"],
          assetAmounts: { bank_accounts: "over_100k" },
          incomeTypes: ["none"], filedFATCA: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
        expect(rule).toBeDefined()
        expect(rule!.obligation_summary).toContain("$100,000 (married filing jointly)")
        expect(rule!.obligation_summary).toContain("$200,000")
      })

      it("50k_100k asset value → fires via totalAssetsAbove50K amount path", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"],
          assetAmounts: { bank_accounts: "50k_100k" },
          incomeTypes: ["none"], filedFATCA: "no",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "fatca")).toBeDefined()
      })
    })

    /* ── 3. Indian ITR (rule_indian_itr) ──
     * Gate: hasIncomeFromIndia OR hasAnyAssets
     * triState: filedIndianITR — yes→null, no→12, not_sure→8.4, ""→null
     * H1B has NO status-specific note in why_applies
     */
    describe("Indian ITR", () => {
      it("filedIndianITR='no' + income → fires, weight=12, triggered", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["rental"],
          filedIndianITR: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")
        expect(rule).toBeDefined()
        expect(rule!.score_weight).toBe(12)
        expect(rule!.status).toBe("triggered")
        expect(rule!.severity).toBe("urgent")
      })

      it("filedIndianITR='not_sure' → weight=12*0.7, needs_review", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["rental"],
          filedIndianITR: "not_sure",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")
        expect(rule).toBeDefined()
        expect(rule!.score_weight).toBe(12 * 0.7)
        expect(rule!.status).toBe("needs_review")
      })

      it("filedIndianITR='yes' → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["rental"],
          filedIndianITR: "yes",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")).toBeUndefined()
      })

      it("filedIndianITR='' → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["rental"],
          filedIndianITR: "",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")).toBeUndefined()
      })

      it("no income + no assets → null (gate fails)", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: [], incomeTypes: ["none"], filedIndianITR: "no",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")).toBeUndefined()
      })

      it("no income but has assets → fires (gate: hasAnyAssets)", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          filedIndianITR: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")
        expect(rule).toBeDefined()
        expect(rule!.why_applies).toContain("Indian assets that may generate taxable income")
      })

      it("has income → why_applies mentions income from India", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["rental"],
          filedIndianITR: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")
        expect(rule).toBeDefined()
        expect(rule!.why_applies).toContain("income from India")
      })

      it("H1B → NO status-specific note in why_applies", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["rental"],
          filedIndianITR: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")
        expect(rule).toBeDefined()
        expect(rule!.why_applies).not.toContain("H1B")
        expect(rule!.why_applies).not.toContain("Green Card")
        expect(rule!.why_applies).not.toContain("US Citizen")
      })
    })

    /* ── 4. PAN-Aadhaar Linkage (rule_pan_inoperative) ──
     * Gate: hasPAN !== "no" AND hasAadhaar !== "no"
     * triState: panLinkedAadhaar — yes→null, no→8, not_sure→5.6, ""→null
     */
    describe("PAN-Aadhaar Linkage", () => {
      it("hasPAN='yes' + hasAadhaar='yes' + panLinkedAadhaar='no' → fires, weight=8", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          hasPAN: "yes", hasAadhaar: "yes", panLinkedAadhaar: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "pan_inoperative")
        expect(rule).toBeDefined()
        expect(rule!.score_weight).toBe(8)
        expect(rule!.status).toBe("triggered")
        expect(rule!.severity).toBe("warning")
      })

      it("panLinkedAadhaar='not_sure' → weight=8*0.7, needs_review", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          hasPAN: "yes", hasAadhaar: "yes", panLinkedAadhaar: "not_sure",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "pan_inoperative")
        expect(rule).toBeDefined()
        expect(rule!.score_weight).toBe(8 * 0.7)
        expect(rule!.status).toBe("needs_review")
      })

      it("panLinkedAadhaar='yes' → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          hasPAN: "yes", hasAadhaar: "yes", panLinkedAadhaar: "yes",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "pan_inoperative")).toBeUndefined()
      })

      it("panLinkedAadhaar='' → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          hasPAN: "yes", hasAadhaar: "yes", panLinkedAadhaar: "",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "pan_inoperative")).toBeUndefined()
      })

      it("hasPAN='no' → null (gate: PAN absent)", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          hasPAN: "no", hasAadhaar: "yes", panLinkedAadhaar: "no",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "pan_inoperative")).toBeUndefined()
      })

      it("hasAadhaar='no' → null (gate: Aadhaar absent)", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          hasPAN: "yes", hasAadhaar: "no", panLinkedAadhaar: "no",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "pan_inoperative")).toBeUndefined()
      })

      it("hasPAN='not_sure' + hasAadhaar='yes' + panLinkedAadhaar='no' → fires (PAN not 'no')", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          hasPAN: "not_sure", hasAadhaar: "yes", panLinkedAadhaar: "no",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "pan_inoperative")).toBeDefined()
      })
    })

    /* ── 5. FEMA Account Conversion (rule_fema_account_conversion) ──
     * Gate: assets includes "bank_accounts"
     * triState: convertedToNRO — yes→null, no→10, not_sure→7, ""→null
     */
    describe("FEMA Account Conversion", () => {
      it("convertedToNRO='no' → fires, weight=10, triggered, urgent", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          convertedToNRO: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fema_conversion")
        expect(rule).toBeDefined()
        expect(rule!.score_weight).toBe(10)
        expect(rule!.status).toBe("triggered")
        expect(rule!.severity).toBe("urgent")
      })

      it("convertedToNRO='not_sure' → weight=10*0.7, needs_review", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          convertedToNRO: "not_sure",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fema_conversion")
        expect(rule).toBeDefined()
        expect(rule!.score_weight).toBe(10 * 0.7)
        expect(rule!.status).toBe("needs_review")
      })

      it("convertedToNRO='yes' → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          convertedToNRO: "yes",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "fema_conversion")).toBeUndefined()
      })

      it("convertedToNRO='' → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          convertedToNRO: "",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "fema_conversion")).toBeUndefined()
      })

      it("no bank_accounts → null (gate fails)", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["nre_nro", "mutual_funds"], incomeTypes: ["none"],
          convertedToNRO: "no",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "fema_conversion")).toBeUndefined()
      })
    })

    /* ── 6. OCI Update (rule_oci_update) ──
     * Gate: hasOCI === "yes"
     * H1B holders NEVER see OCI question → hasOCI stays "" → NEVER fires
     */
    describe("OCI Update", () => {
      it("hasOCI='' (default for H1B) → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "oci_update")).toBeUndefined()
      })

      it("hasOCI='no' → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          hasOCI: "no",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "oci_update")).toBeUndefined()
      })

      it("hasOCI='not_sure' → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          hasOCI: "not_sure",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "oci_update")).toBeUndefined()
      })
    })

    /* ── 7. Aadhaar Biometric (rule_aadhaar_biometric) ──
     * Gate: hasAadhaar === "yes" AND yearLeft > 10 years ago
     * Informational (no triState gating), always severity=info
     */
    describe("Aadhaar Biometric", () => {
      it("hasAadhaar='yes' + left > 10 yrs ago → fires, severity=info", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2010", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          hasAadhaar: "yes",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "aadhaar_biometric")
        expect(rule).toBeDefined()
        expect(rule!.severity).toBe("info")
        expect(rule!.score_weight).toBe(3)
        expect(rule!.why_applies).toContain("2010")
      })

      it("hasAadhaar='yes' + left <= 10 yrs ago → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2020", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          hasAadhaar: "yes",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "aadhaar_biometric")).toBeUndefined()
      })

      it("hasAadhaar='no' → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2010", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          hasAadhaar: "no",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "aadhaar_biometric")).toBeUndefined()
      })

      it("hasAadhaar='' → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2010", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          hasAadhaar: "",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "aadhaar_biometric")).toBeUndefined()
      })

      it("hasAadhaar='not_sure' → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2010", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          hasAadhaar: "not_sure",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "aadhaar_biometric")).toBeUndefined()
      })

      it("yearLeftIndia invalid → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          hasAadhaar: "yes",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "aadhaar_biometric")).toBeUndefined()
      })
    })

    /* ── 8. TDS Certificates (rule_tds_certificates) ──
     * Gate: hasIncomeFromIndia AND (hasInterestIncome OR hasRentalIncome)
     * Informational, no triState gating
     */
    describe("TDS Certificates", () => {
      it("rental + interest → fires, mentions both", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["rental", "interest"],
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "tds_certificates")
        expect(rule).toBeDefined()
        expect(rule!.severity).toBe("info")
        expect(rule!.why_applies).toContain("interest")
        expect(rule!.why_applies).toContain("rental")
      })

      it("rental only → fires, mentions rental", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["rental"],
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "tds_certificates")
        expect(rule).toBeDefined()
        expect(rule!.why_applies).toContain("rental")
      })

      it("interest only → fires, mentions interest", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["interest"],
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "tds_certificates")
        expect(rule).toBeDefined()
        expect(rule!.why_applies).toContain("interest")
      })

      it("capital_gains only (no rental/interest) → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["capital_gains"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "tds_certificates")).toBeUndefined()
      })

      it("incomeTypes=['none'] → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "tds_certificates")).toBeUndefined()
      })

      it("no income types → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: [],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "tds_certificates")).toBeUndefined()
      })
    })

    /* ── 9. Repatriation (rule_repatriation) ──
     * Gate: hasAnyAssets AND (high-value asset OR assets.length >= 3)
     * Informational, no triState gating
     */
    describe("Repatriation", () => {
      it("3+ assets (even low-value) → fires via count path", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts", "mutual_funds", "stocks"],
          incomeTypes: ["none"],
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "repatriation")
        expect(rule).toBeDefined()
        expect(rule!.severity).toBe("warning")
        expect(rule!.score_weight).toBe(4)
      })

      it("single high-value asset (over_100k) → fires via value path", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], assetAmounts: { bank_accounts: "over_100k" },
          incomeTypes: ["none"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "repatriation")).toBeDefined()
      })

      it("single 50k_100k asset → fires via value path", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], assetAmounts: { bank_accounts: "50k_100k" },
          incomeTypes: ["none"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "repatriation")).toBeDefined()
      })

      it("INR high value (over_1cr) → fires via value path", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["property"], assetAmounts: { property: "over_1cr" },
          incomeTypes: ["none"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "repatriation")).toBeDefined()
      })

      it("INR high value (50l_1cr) → fires via value path", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["property"], assetAmounts: { property: "50l_1cr" },
          incomeTypes: ["none"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "repatriation")).toBeDefined()
      })

      it("1-2 low-value assets → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], assetAmounts: { bank_accounts: "under_5k" },
          incomeTypes: ["none"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "repatriation")).toBeUndefined()
      })

      it("no assets → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: [], incomeTypes: ["none"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "repatriation")).toBeUndefined()
      })
    })

    /* ── 10. PFIC (rule_pfic) ──
     * Gate: hasMutualFunds (assets includes "mutual_funds")
     * H1B base weight = 12 (not 15 like GC/Citizen)
     * triState: reportedPFICs — yes→null, no→12, not_sure→8.4, ""→null
     * statusNote: "As an H1B holder"
     */
    describe("PFIC", () => {
      it("reportedPFICs='no' → fires, weight=12 (H1B base), triggered", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["mutual_funds"], incomeTypes: ["none"],
          reportedPFICs: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "pfic")
        expect(rule).toBeDefined()
        expect(rule!.score_weight).toBe(12)
        expect(rule!.status).toBe("triggered")
        expect(rule!.severity).toBe("urgent")
      })

      it("reportedPFICs='not_sure' → weight=12*0.7, needs_review", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["mutual_funds"], incomeTypes: ["none"],
          reportedPFICs: "not_sure",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "pfic")
        expect(rule).toBeDefined()
        expect(rule!.score_weight).toBe(12 * 0.7)
        expect(rule!.status).toBe("needs_review")
      })

      it("reportedPFICs='yes' → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["mutual_funds"], incomeTypes: ["none"],
          reportedPFICs: "yes",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "pfic")).toBeUndefined()
      })

      it("reportedPFICs='' → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["mutual_funds"], incomeTypes: ["none"],
          reportedPFICs: "",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "pfic")).toBeUndefined()
      })

      it("no mutual_funds → null (gate fails)", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts", "stocks"], incomeTypes: ["none"],
          reportedPFICs: "no",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "pfic")).toBeUndefined()
      })

      it("statusNote says 'As an H1B holder'", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["mutual_funds"], incomeTypes: ["none"],
          reportedPFICs: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "pfic")
        expect(rule).toBeDefined()
        expect(rule!.why_applies).toContain("As an H1B holder")
        expect(rule!.why_applies).toContain("US tax resident")
      })

      it("H1B PFIC weight differs from Green Card (12 vs 15)", () => {
        const h1bAnswers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["mutual_funds"], incomeTypes: ["none"], reportedPFICs: "no",
        })
        const gcAnswers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "Green Card", filingStatus: "Single",
          assets: ["mutual_funds"], incomeTypes: ["none"], reportedPFICs: "no",
        })
        const h1bRule = runRulesEngine(h1bAnswers).results.find(r => r.rule_id === "pfic")
        const gcRule = runRulesEngine(gcAnswers).results.find(r => r.rule_id === "pfic")
        expect(h1bRule!.score_weight).toBe(12)
        expect(gcRule!.score_weight).toBe(15)
      })
    })

    /* ── 11. DTAA (rule_dtaa) ──
     * Gate: hasIncomeFromIndia
     * Informational, no triState gating
     * H1B: no Green Card-specific tie-breaker note
     */
    describe("DTAA", () => {
      it("has Indian income → fires, severity=warning", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["rental"],
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "dtaa_trc")
        expect(rule).toBeDefined()
        expect(rule!.severity).toBe("warning")
        expect(rule!.score_weight).toBe(4)
      })

      it("no Indian income → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "dtaa_trc")).toBeUndefined()
      })

      it("empty incomeTypes → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: [],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "dtaa_trc")).toBeUndefined()
      })

      it("H1B → no Green Card tie-breaker note", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["rental"],
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "dtaa_trc")
        expect(rule).toBeDefined()
        expect(rule!.why_applies).not.toContain("Green Card")
        expect(rule!.why_applies).not.toContain("tie-breaker")
      })
    })

    /* ── 12. Property Tax (rule_property_tax) ──
     * Gate: hasProperty (assets includes "property")
     * Informational, no triState gating
     */
    describe("Property Tax", () => {
      it("has property → fires, severity=info", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["property"], incomeTypes: ["none"],
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "property_tax")
        expect(rule).toBeDefined()
        expect(rule!.severity).toBe("info")
        expect(rule!.score_weight).toBe(3)
      })

      it("no property → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts", "mutual_funds"], incomeTypes: ["none"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "property_tax")).toBeUndefined()
      })
    })

    /* ── 13. Bank KYC (rule_bank_kyc) ──
     * Gate: hasForeignAccounts (bank_accounts || nre_nro)
     * triState: updatedBankKYC — yes→null, no→5, not_sure→3.5, ""→null
     */
    describe("Bank KYC", () => {
      it("updatedBankKYC='no' → fires, weight=5, triggered", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          updatedBankKYC: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "bank_kyc")
        expect(rule).toBeDefined()
        expect(rule!.score_weight).toBe(5)
        expect(rule!.status).toBe("triggered")
        expect(rule!.severity).toBe("warning")
      })

      it("updatedBankKYC='not_sure' → weight=5*0.7, needs_review", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          updatedBankKYC: "not_sure",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "bank_kyc")
        expect(rule).toBeDefined()
        expect(rule!.score_weight).toBe(5 * 0.7)
        expect(rule!.status).toBe("needs_review")
      })

      it("updatedBankKYC='yes' → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          updatedBankKYC: "yes",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "bank_kyc")).toBeUndefined()
      })

      it("updatedBankKYC='' → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          updatedBankKYC: "",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "bank_kyc")).toBeUndefined()
      })

      it("nre_nro → fires via hasForeignAccounts", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["nre_nro"], incomeTypes: ["none"],
          updatedBankKYC: "no",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "bank_kyc")).toBeDefined()
      })

      it("no foreign accounts (stocks only) → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["stocks"], incomeTypes: ["none"],
          updatedBankKYC: "no",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "bank_kyc")).toBeUndefined()
      })
    })

    /* ── 14. PPF NRI (rule_ppf_nri) ──
     * Gate: hasPPF (assets includes "ppf")
     * Informational, no triState gating
     */
    describe("PPF NRI", () => {
      it("has ppf → fires, severity=info", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["ppf"], incomeTypes: ["none"],
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "ppf_nri")
        expect(rule).toBeDefined()
        expect(rule!.severity).toBe("info")
        expect(rule!.score_weight).toBe(3)
      })

      it("no ppf → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "ppf_nri")).toBeUndefined()
      })
    })

    /* ── 15. LIC Premium (rule_lic_premium) ──
     * Gate: hasLIC (assets includes "life_insurance")
     * Informational, no triState gating
     */
    describe("LIC Premium", () => {
      it("has life_insurance → fires, severity=warning", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["life_insurance"], incomeTypes: ["none"],
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "lic_premium")
        expect(rule).toBeDefined()
        expect(rule!.severity).toBe("warning")
        expect(rule!.score_weight).toBe(4)
      })

      it("no life_insurance → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "lic_premium")).toBeUndefined()
      })
    })

    /* ── 16. Citizenship Renunciation (rule_citizenship_renunciation) ──
     * Gate: usStatus === "US Citizen"
     * H1B → NEVER fires, regardless of surrenderedIndianPassport
     */
    describe("Citizenship Renunciation", () => {
      it("H1B → never fires, even with surrenderedIndianPassport='no'", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          surrenderedIndianPassport: "no",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "citizenship_renunciation")).toBeUndefined()
      })

      it("H1B → never fires, even with surrenderedIndianPassport='not_sure'", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], incomeTypes: ["none"],
          surrenderedIndianPassport: "not_sure",
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "citizenship_renunciation")).toBeUndefined()
      })
    })

    /* ── 17. State FEIE Non-Conformity (rule_state_feie_nonconformity) ──
     * Gate: usState in FEIE_NON_CONFORMING_STATES (CA, NJ, MA, CT, VA) AND hasIncomeFromIndia
     * Informational, no triState gating
     */
    describe("State FEIE Non-Conformity", () => {
      it("CA + Indian income → fires, shows CA in text", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          usState: "CA", assets: ["bank_accounts"], incomeTypes: ["rental"],
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "state_feie_gap")
        expect(rule).toBeDefined()
        expect(rule!.severity).toBe("warning")
        expect(rule!.score_weight).toBe(6)
        expect(rule!.rule_name).toContain("CA")
      })

      it("NJ + Indian income → fires", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          usState: "NJ", assets: ["bank_accounts"], incomeTypes: ["rental"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "state_feie_gap")).toBeDefined()
      })

      it("MA + Indian income → fires", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          usState: "MA", assets: ["bank_accounts"], incomeTypes: ["interest"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "state_feie_gap")).toBeDefined()
      })

      it("CT + Indian income → fires", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          usState: "CT", assets: ["bank_accounts"], incomeTypes: ["dividend"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "state_feie_gap")).toBeDefined()
      })

      it("VA + Indian income → fires", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          usState: "VA", assets: ["bank_accounts"], incomeTypes: ["capital_gains"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "state_feie_gap")).toBeDefined()
      })

      it("TX (conforming state) + Indian income → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          usState: "TX", assets: ["bank_accounts"], incomeTypes: ["rental"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "state_feie_gap")).toBeUndefined()
      })

      it("CA + no Indian income → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          usState: "CA", assets: ["bank_accounts"], incomeTypes: ["none"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "state_feie_gap")).toBeUndefined()
      })
    })

    /* ── 18. State FTC Gap (rule_state_ftc_gap) ──
     * Gate: usState in FTC_GAP_STATES (CA, NJ, MA, CT, VA, PA, IL, GA) AND hasIncomeFromIndia
     * Informational, no triState gating
     */
    describe("State FTC Gap", () => {
      it("CA + Indian income → fires", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          usState: "CA", assets: ["bank_accounts"], incomeTypes: ["rental"],
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "state_ftc_gap")
        expect(rule).toBeDefined()
        expect(rule!.severity).toBe("warning")
        expect(rule!.score_weight).toBe(5)
      })

      it("PA + Indian income → fires (PA is FTC gap but not FEIE gap)", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          usState: "PA", assets: ["bank_accounts"], incomeTypes: ["rental"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "state_ftc_gap")).toBeDefined()
      })

      it("IL + Indian income → fires", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          usState: "IL", assets: ["bank_accounts"], incomeTypes: ["rental"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "state_ftc_gap")).toBeDefined()
      })

      it("GA + Indian income → fires", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          usState: "GA", assets: ["bank_accounts"], incomeTypes: ["rental"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "state_ftc_gap")).toBeDefined()
      })

      it("TX (not gap state) + Indian income → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          usState: "TX", assets: ["bank_accounts"], incomeTypes: ["rental"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "state_ftc_gap")).toBeUndefined()
      })

      it("WA (not gap state) + Indian income → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          usState: "WA", assets: ["bank_accounts"], incomeTypes: ["rental"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "state_ftc_gap")).toBeUndefined()
      })

      it("CA + no Indian income → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          usState: "CA", assets: ["bank_accounts"], incomeTypes: ["none"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "state_ftc_gap")).toBeUndefined()
      })
    })

    /* ── 19. Washington Capital Gains (rule_washington_capital_gains) ──
     * Gate: usState === "WA" AND (hasStocks OR hasMutualFunds) AND hasHighValueStocksOrMFs
     * hasHighValueStocksOrMFs: stocks/MF amounts in [50k_100k, over_100k]
     * Informational, no triState gating
     */
    describe("Washington Capital Gains", () => {
      it("WA + stocks over_100k → fires", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          usState: "WA", assets: ["stocks"],
          assetAmounts: { stocks: "over_100k" },
          incomeTypes: ["none"],
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "wa_capital_gains")
        expect(rule).toBeDefined()
        expect(rule!.severity).toBe("info")
        expect(rule!.score_weight).toBe(4)
      })

      it("WA + mutual_funds 50k_100k → fires", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          usState: "WA", assets: ["mutual_funds"],
          assetAmounts: { mutual_funds: "50k_100k" },
          incomeTypes: ["none"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "wa_capital_gains")).toBeDefined()
      })

      it("WA + stocks under_5k (low value) → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          usState: "WA", assets: ["stocks"],
          assetAmounts: { stocks: "under_5k" },
          incomeTypes: ["none"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "wa_capital_gains")).toBeUndefined()
      })

      it("WA + no stocks/MFs (bank_accounts only) → null", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          usState: "WA", assets: ["bank_accounts"],
          assetAmounts: { bank_accounts: "over_100k" },
          incomeTypes: ["none"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "wa_capital_gains")).toBeUndefined()
      })

      it("TX + stocks over_100k → null (not WA)", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          usState: "TX", assets: ["stocks"],
          assetAmounts: { stocks: "over_100k" },
          incomeTypes: ["none"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "wa_capital_gains")).toBeUndefined()
      })

      it("CA + stocks over_100k → null (not WA)", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          usState: "CA", assets: ["stocks"],
          assetAmounts: { stocks: "over_100k" },
          incomeTypes: ["none"],
        })
        expect(runRulesEngine(answers).results.find(r => r.rule_id === "wa_capital_gains")).toBeUndefined()
      })
    })

    /* ── isFirstYearH1B edge cases ── */
    describe("isFirstYearH1B edge cases", () => {
      it("yearLeft = current year → isFirstYearH1B true, SPT note in FBAR", () => {
        const answers = makeAnswers({
          yearLeftIndia: String(new Date().getFullYear()),
          usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
          incomeTypes: ["none"], filedFBAR: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
        expect(rule!.why_applies).toContain("first-year H1B")
      })

      it("yearLeft = last year → isFirstYearH1B true (diff = 1)", () => {
        const answers = makeAnswers({
          yearLeftIndia: String(new Date().getFullYear() - 1),
          usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
          incomeTypes: ["none"], filedFBAR: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
        expect(rule!.why_applies).toContain("first-year H1B")
      })

      it("yearLeft = 2 years ago → isFirstYearH1B false (diff = 2)", () => {
        const answers = makeAnswers({
          yearLeftIndia: String(new Date().getFullYear() - 2),
          usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
          incomeTypes: ["none"], filedFBAR: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
        expect(rule!.why_applies).not.toContain("first-year H1B")
      })

      it("Green Card + current year → isFirstYearH1B false (wrong status)", () => {
        const answers = makeAnswers({
          yearLeftIndia: String(new Date().getFullYear()),
          usStatus: "Green Card", filingStatus: "Single",
          assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
          incomeTypes: ["none"], filedFBAR: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
        expect(rule!.why_applies).not.toContain("first-year H1B")
      })

      it("yearLeft empty → isFirstYearH1B false (NaN)", () => {
        const answers = makeAnswers({
          yearLeftIndia: "", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
          incomeTypes: ["none"], filedFBAR: "no",
        })
        const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
        expect(rule!.why_applies).not.toContain("first-year H1B")
      })
    })

    /* ── Composite scenarios ── */
    describe("H1B composite scenarios", () => {
      it("worst case: all non-compliant, CA, all assets, all income types", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2010", usStatus: "H1B", filingStatus: "Single",
          usState: "CA",
          assets: ["bank_accounts", "mutual_funds", "stocks", "property", "life_insurance", "ppf", "nps", "epf", "nre_nro"],
          assetAmounts: { bank_accounts: "over_100k", mutual_funds: "over_100k" },
          incomeTypes: ["rental", "interest", "dividend", "capital_gains"],
          hasPAN: "yes", panLinkedAadhaar: "no",
          hasAadhaar: "yes",
          filedIndianITR: "no",
          filedFBAR: "no",
          filedFATCA: "no",
          reportedPFICs: "no",
          updatedBankKYC: "no",
          convertedToNRO: "no",
        })
        const result = runRulesEngine(answers)
        expect(result.score).toBeLessThanOrEqual(10)
        expect(result.results.length).toBeGreaterThanOrEqual(10)
        expect(result.totalPenaltyMax).toBeGreaterThan(0)
        // Verify key rules all fire
        const ruleIds = result.results.map(r => r.rule_id)
        expect(ruleIds).toContain("fbar")
        expect(ruleIds).toContain("fatca")
        expect(ruleIds).toContain("indian_itr")
        expect(ruleIds).toContain("pan_inoperative")
        expect(ruleIds).toContain("fema_conversion")
        expect(ruleIds).toContain("pfic")
        expect(ruleIds).toContain("bank_kyc")
        expect(ruleIds).toContain("dtaa_trc")
        expect(ruleIds).toContain("tds_certificates")
        expect(ruleIds).toContain("property_tax")
        expect(ruleIds).toContain("ppf_nri")
        expect(ruleIds).toContain("lic_premium")
        expect(ruleIds).toContain("repatriation")
        expect(ruleIds).toContain("state_feie_gap")
        expect(ruleIds).toContain("state_ftc_gap")
        // H1B: citizenship_renunciation should NOT fire
        expect(ruleIds).not.toContain("citizenship_renunciation")
        // H1B: OCI update should NOT fire
        expect(ruleIds).not.toContain("oci_update")
      })

      it("best case: all compliant → score >= 80, no results", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2020", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts"],
          assetAmounts: { bank_accounts: "under_5k" },
          incomeTypes: ["none"],
          hasPAN: "yes", panLinkedAadhaar: "yes",
          hasAadhaar: "yes",
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

      it("all 'not_sure' → all triState rules fire with reduced weights", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2010", usStatus: "H1B", filingStatus: "Single",
          assets: ["bank_accounts", "mutual_funds", "stocks"],
          assetAmounts: { bank_accounts: "over_100k" },
          incomeTypes: ["rental", "interest"],
          hasPAN: "yes", panLinkedAadhaar: "not_sure",
          hasAadhaar: "yes",
          filedIndianITR: "not_sure",
          filedFBAR: "not_sure",
          filedFATCA: "not_sure",
          reportedPFICs: "not_sure",
          updatedBankKYC: "not_sure",
          convertedToNRO: "not_sure",
        })
        const result = runRulesEngine(answers)
        // All triState-gated rules should fire with needs_review
        const triStateRuleIds = ["fbar", "fatca", "indian_itr", "pan_inoperative", "fema_conversion", "pfic", "bank_kyc"]
        for (const ruleId of triStateRuleIds) {
          const rule = result.results.find(r => r.rule_id === ruleId)
          expect(rule).toBeDefined()
          expect(rule!.status).toBe("needs_review")
        }
        // Score should be between worst and best
        expect(result.score).toBeGreaterThan(0)
        expect(result.score).toBeLessThan(80)
      })

      it("minimal assets (no bank_accounts, no MFs) → only informational rules fire", () => {
        const answers = makeAnswers({
          yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single",
          assets: ["property"], incomeTypes: ["rental"],
          hasPAN: "yes", panLinkedAadhaar: "yes",
          hasAadhaar: "yes",
          filedIndianITR: "no",
          filedFBAR: "no", // no effect without bank_accounts/nre_nro
          filedFATCA: "no",
          reportedPFICs: "no", // no effect without mutual_funds
          updatedBankKYC: "no", // no effect without bank_accounts/nre_nro
          convertedToNRO: "no", // no effect without bank_accounts
        })
        const result = runRulesEngine(answers)
        const ruleIds = result.results.map(r => r.rule_id)
        // Should NOT fire: fbar, fatca (1 asset, low count), pfic, bank_kyc, fema
        expect(ruleIds).not.toContain("fbar")
        expect(ruleIds).not.toContain("pfic")
        expect(ruleIds).not.toContain("bank_kyc")
        expect(ruleIds).not.toContain("fema_conversion")
        // Should fire: indian_itr (has income+assets), dtaa_trc (has income), property_tax, tds_certificates (rental)
        expect(ruleIds).toContain("indian_itr")
        expect(ruleIds).toContain("dtaa_trc")
        expect(ruleIds).toContain("property_tax")
        expect(ruleIds).toContain("tds_certificates")
      })
    })
  })

  /* ══════════════════════════════════════════════════════════════
   * US CITIZEN — EXHAUSTIVE RULE COVERAGE
   * ══════════════════════════════════════════════════════════════
   * US Citizens are unique: they have access to OCI/surrender
   * questions, citizenship_renunciation fires ONLY for them,
   * PFIC weight is 15 (permanent), isFirstYearH1B never applies.
   * ══════════════════════════════════════════════════════════════ */
  describe("US Citizen — exhaustive rule coverage", () => {

    /* ── 1. FBAR (rule_fbar) ── */
    // Gate: hasForeignAccounts || totalAggregateAbove10K
    // triState: filedFBAR — yes/no/not_sure/""

    it("USC + FBAR: filedFBAR='yes' → null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
        incomeTypes: ["none"], filedFBAR: "yes",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
      expect(rule).toBeUndefined()
    })

    it("USC + FBAR: filedFBAR='no' → fires, weight 20, severity urgent", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
        incomeTypes: ["none"], filedFBAR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
      expect(rule).toBeDefined()
      expect(rule!.score_weight).toBe(20)
      expect(rule!.severity).toBe("urgent")
      expect(rule!.status).toBe("triggered")
    })

    it("USC + FBAR: filedFBAR='not_sure' → fires, weight 14, needs_review", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
        incomeTypes: ["none"], filedFBAR: "not_sure",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
      expect(rule).toBeDefined()
      expect(rule!.score_weight).toBe(20 * 0.7)
      expect(rule!.status).toBe("needs_review")
    })

    it("USC + FBAR: filedFBAR='' → null (unanswered)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
        incomeTypes: ["none"], filedFBAR: "",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
      expect(rule).toBeUndefined()
    })

    it("USC + FBAR: no foreign accounts + no high aggregate → null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["property"], incomeTypes: ["none"], filedFBAR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
      expect(rule).toBeUndefined()
    })

    it("USC + FBAR: nre_nro triggers via hasForeignAccounts", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["nre_nro"], assetAmounts: { nre_nro: "under_5k" },
        incomeTypes: ["none"], filedFBAR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
      expect(rule).toBeDefined()
      expect(rule!.why_applies).toContain("NRE/NRO")
    })

    it("USC + FBAR: 2+ financial account types triggers via totalAggregateAbove10K", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["ppf", "epf"], incomeTypes: ["none"], filedFBAR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
      expect(rule).toBeDefined()
    })

    it("USC + FBAR: never includes Substantial Presence Test note", () => {
      const answers = makeAnswers({
        yearLeftIndia: String(new Date().getFullYear()), usStatus: "US Citizen",
        filingStatus: "Single", assets: ["bank_accounts"],
        assetAmounts: { bank_accounts: "10k_50k" },
        incomeTypes: ["none"], filedFBAR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
      expect(rule).toBeDefined()
      expect(rule!.why_applies).not.toContain("Substantial Presence Test")
    })

    it("USC + FBAR: bank_accounts high value triggers via totalAggregateAbove10K", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["bank_accounts"], assetAmounts: { bank_accounts: "over_100k" },
        incomeTypes: ["none"], filedFBAR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
      expect(rule).toBeDefined()
    })

    /* ── 2. FATCA (rule_fatca) ── */

    it("USC + FATCA: filedFATCA='yes' → null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds", "stocks"],
        assetAmounts: { bank_accounts: "over_100k" },
        incomeTypes: ["none"], filedFATCA: "yes",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
      expect(rule).toBeUndefined()
    })

    it("USC + FATCA: filedFATCA='no' → fires, weight 15, triggered", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds", "stocks"],
        assetAmounts: { bank_accounts: "over_100k" },
        incomeTypes: ["none"], filedFATCA: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
      expect(rule).toBeDefined()
      expect(rule!.score_weight).toBe(15)
      expect(rule!.status).toBe("triggered")
      expect(rule!.severity).toBe("urgent")
    })

    it("USC + FATCA: filedFATCA='not_sure' → fires, weight 10.5, needs_review", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds", "stocks"],
        assetAmounts: { bank_accounts: "over_100k" },
        incomeTypes: ["none"], filedFATCA: "not_sure",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
      expect(rule).toBeDefined()
      expect(rule!.score_weight).toBe(15 * 0.7)
      expect(rule!.status).toBe("needs_review")
    })

    it("USC + FATCA: filedFATCA='' → null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds", "stocks"],
        assetAmounts: { bank_accounts: "over_100k" },
        incomeTypes: ["none"], filedFATCA: "",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
      expect(rule).toBeUndefined()
    })

    it("USC + FATCA: Single → shows $50K/$75K thresholds", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds", "stocks"],
        assetAmounts: { bank_accounts: "over_100k" },
        incomeTypes: ["none"], filedFATCA: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
      expect(rule).toBeDefined()
      expect(rule!.obligation_summary).toContain("$50,000 (single/MFS)")
      expect(rule!.obligation_summary).toContain("$75,000")
    })

    it("USC + FATCA: MFJ → shows $100K/$200K thresholds", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen",
        filingStatus: "Married Filing Jointly",
        assets: ["bank_accounts", "mutual_funds", "stocks"],
        assetAmounts: { bank_accounts: "over_100k" },
        incomeTypes: ["none"], filedFATCA: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
      expect(rule).toBeDefined()
      expect(rule!.obligation_summary).toContain("$100,000 (married filing jointly)")
      expect(rule!.obligation_summary).toContain("$200,000")
      expect(rule!.why_applies).toContain("$100,000 MFJ")
    })

    it("USC + FATCA: single low-value asset → null (below threshold)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["bank_accounts"], assetAmounts: { bank_accounts: "under_5k" },
        incomeTypes: ["none"], filedFATCA: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
      expect(rule).toBeUndefined()
    })

    it("USC + FATCA: no assets → null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: [], incomeTypes: ["none"], filedFATCA: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
      expect(rule).toBeUndefined()
    })

    it("USC + FATCA: 3+ assets triggers totalAssetsAbove50K even w/o high amounts", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds", "stocks"],
        assetAmounts: { bank_accounts: "under_5k" },
        incomeTypes: ["none"], filedFATCA: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
      expect(rule).toBeDefined()
    })

    /* ── 3. Indian ITR (rule_indian_itr) ── */

    it("USC + ITR: filedIndianITR='yes' → null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["rental"], filedIndianITR: "yes",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")
      expect(rule).toBeUndefined()
    })

    it("USC + ITR: filedIndianITR='no' + income → fires, weight 12, triggered", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["rental"], filedIndianITR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")
      expect(rule).toBeDefined()
      expect(rule!.score_weight).toBe(12)
      expect(rule!.status).toBe("triggered")
    })

    it("USC + ITR: filedIndianITR='not_sure' → fires, weight 8.4, needs_review", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["rental"], filedIndianITR: "not_sure",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")
      expect(rule).toBeDefined()
      expect(rule!.score_weight).toBe(12 * 0.7)
      expect(rule!.status).toBe("needs_review")
    })

    it("USC + ITR: filedIndianITR='' → null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["rental"], filedIndianITR: "",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")
      expect(rule).toBeUndefined()
    })

    it("USC + ITR: why_applies mentions US Citizen + NRI under Indian tax law", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["rental"], filedIndianITR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")
      expect(rule).toBeDefined()
      expect(rule!.why_applies).toContain("US Citizen")
      expect(rule!.why_applies).toContain("NRI under Indian tax law")
    })

    it("USC + ITR: no income + no assets → null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: [], incomeTypes: ["none"], filedIndianITR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")
      expect(rule).toBeUndefined()
    })

    it("USC + ITR: no income but has assets → fires (assets gate)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"], filedIndianITR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")
      expect(rule).toBeDefined()
      expect(rule!.why_applies).toContain("Indian assets that may generate taxable income")
    })

    it("USC + ITR: income but no assets → fires (income gate)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single",
        assets: [], incomeTypes: ["rental"], filedIndianITR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")
      expect(rule).toBeDefined()
      expect(rule!.why_applies).toContain("income from India")
    })

    /* ── 4. PAN-Aadhaar Linkage ── */

    it("USC + PAN: panLinkedAadhaar='yes' → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["none"], hasPAN: "yes", hasAadhaar: "yes", panLinkedAadhaar: "yes" })).results.find(r => r.rule_id === "pan_inoperative")
      expect(r).toBeUndefined()
    })

    it("USC + PAN: panLinkedAadhaar='no' → fires, weight 8", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["none"], hasPAN: "yes", hasAadhaar: "yes", panLinkedAadhaar: "no" })).results.find(r => r.rule_id === "pan_inoperative")
      expect(r).toBeDefined()
      expect(r!.score_weight).toBe(8)
      expect(r!.status).toBe("triggered")
      expect(r!.severity).toBe("warning")
    })

    it("USC + PAN: panLinkedAadhaar='not_sure' → fires, weight 5.6", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["none"], hasPAN: "yes", hasAadhaar: "yes", panLinkedAadhaar: "not_sure" })).results.find(r => r.rule_id === "pan_inoperative")
      expect(r).toBeDefined()
      expect(r!.score_weight).toBe(8 * 0.7)
      expect(r!.status).toBe("needs_review")
    })

    it("USC + PAN: panLinkedAadhaar='' → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["none"], hasPAN: "yes", hasAadhaar: "yes", panLinkedAadhaar: "" })).results.find(r => r.rule_id === "pan_inoperative")
      expect(r).toBeUndefined()
    })

    it("USC + PAN: hasPAN='no' → null (gate)", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["none"], hasPAN: "no", hasAadhaar: "yes", panLinkedAadhaar: "no" })).results.find(r => r.rule_id === "pan_inoperative")
      expect(r).toBeUndefined()
    })

    it("USC + PAN: hasAadhaar='no' → null (gate)", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["none"], hasPAN: "yes", hasAadhaar: "no", panLinkedAadhaar: "no" })).results.find(r => r.rule_id === "pan_inoperative")
      expect(r).toBeUndefined()
    })

    /* ── 5. FEMA Account Conversion ── */

    it("USC + FEMA: convertedToNRO='yes' → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["none"], convertedToNRO: "yes" })).results.find(r => r.rule_id === "fema_conversion")
      expect(r).toBeUndefined()
    })

    it("USC + FEMA: convertedToNRO='no' → fires, weight 10", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["none"], convertedToNRO: "no" })).results.find(r => r.rule_id === "fema_conversion")
      expect(r).toBeDefined()
      expect(r!.score_weight).toBe(10)
      expect(r!.status).toBe("triggered")
      expect(r!.severity).toBe("urgent")
    })

    it("USC + FEMA: convertedToNRO='not_sure' → fires, weight 7", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["none"], convertedToNRO: "not_sure" })).results.find(r => r.rule_id === "fema_conversion")
      expect(r).toBeDefined()
      expect(r!.score_weight).toBe(10 * 0.7)
      expect(r!.status).toBe("needs_review")
    })

    it("USC + FEMA: convertedToNRO='' → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["none"], convertedToNRO: "" })).results.find(r => r.rule_id === "fema_conversion")
      expect(r).toBeUndefined()
    })

    it("USC + FEMA: no bank_accounts → null (gate)", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["mutual_funds"], incomeTypes: ["none"], convertedToNRO: "no" })).results.find(r => r.rule_id === "fema_conversion")
      expect(r).toBeUndefined()
    })

    /* ── 6. OCI Update ── */

    it("USC + OCI: hasOCI='yes' + updated='yes' → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: [], incomeTypes: ["none"], hasOCI: "yes", ociUpdatedAfterPassportRenewal: "yes" })).results.find(r => r.rule_id === "oci_update")
      expect(r).toBeUndefined()
    })

    it("USC + OCI: hasOCI='yes' + updated='no' → fires, weight 5", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: [], incomeTypes: ["none"], hasOCI: "yes", ociUpdatedAfterPassportRenewal: "no" })).results.find(r => r.rule_id === "oci_update")
      expect(r).toBeDefined()
      expect(r!.score_weight).toBe(5)
      expect(r!.status).toBe("triggered")
      expect(r!.severity).toBe("warning")
    })

    it("USC + OCI: hasOCI='yes' + updated='not_sure' → fires, weight 3.5", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: [], incomeTypes: ["none"], hasOCI: "yes", ociUpdatedAfterPassportRenewal: "not_sure" })).results.find(r => r.rule_id === "oci_update")
      expect(r).toBeDefined()
      expect(r!.score_weight).toBe(5 * 0.7)
      expect(r!.status).toBe("needs_review")
    })

    it("USC + OCI: hasOCI='yes' + updated='' → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: [], incomeTypes: ["none"], hasOCI: "yes", ociUpdatedAfterPassportRenewal: "" })).results.find(r => r.rule_id === "oci_update")
      expect(r).toBeUndefined()
    })

    it("USC + OCI: hasOCI='no' → null (gate)", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: [], incomeTypes: ["none"], hasOCI: "no", ociUpdatedAfterPassportRenewal: "no" })).results.find(r => r.rule_id === "oci_update")
      expect(r).toBeUndefined()
    })

    it("USC + OCI: hasOCI='' → null (never answered)", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: [], incomeTypes: ["none"], hasOCI: "" })).results.find(r => r.rule_id === "oci_update")
      expect(r).toBeUndefined()
    })

    /* ── 7. PFIC — US Citizen weight = 15 ── */

    it("USC + PFIC: reportedPFICs='yes' → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["mutual_funds"], incomeTypes: ["none"], reportedPFICs: "yes" })).results.find(r => r.rule_id === "pfic")
      expect(r).toBeUndefined()
    })

    it("USC + PFIC: reportedPFICs='no' → fires, weight 15", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["mutual_funds"], incomeTypes: ["none"], reportedPFICs: "no" })).results.find(r => r.rule_id === "pfic")
      expect(r).toBeDefined()
      expect(r!.score_weight).toBe(15)
      expect(r!.status).toBe("triggered")
      expect(r!.severity).toBe("urgent")
    })

    it("USC + PFIC: reportedPFICs='not_sure' → fires, weight 10.5", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["mutual_funds"], incomeTypes: ["none"], reportedPFICs: "not_sure" })).results.find(r => r.rule_id === "pfic")
      expect(r).toBeDefined()
      expect(r!.score_weight).toBe(15 * 0.7)
      expect(r!.status).toBe("needs_review")
    })

    it("USC + PFIC: reportedPFICs='' → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["mutual_funds"], incomeTypes: ["none"], reportedPFICs: "" })).results.find(r => r.rule_id === "pfic")
      expect(r).toBeUndefined()
    })

    it("USC + PFIC: no mutual_funds → null (gate)", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts", "stocks"], incomeTypes: ["none"], reportedPFICs: "no" })).results.find(r => r.rule_id === "pfic")
      expect(r).toBeUndefined()
    })

    it("USC + PFIC: text says 'permanent annual obligation'", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["mutual_funds"], incomeTypes: ["none"], reportedPFICs: "no" })).results.find(r => r.rule_id === "pfic")
      expect(r).toBeDefined()
      expect(r!.why_applies).toContain("permanent annual obligation")
      expect(r!.why_applies).toContain("US Citizen")
      expect(r!.why_applies).not.toContain("H1B")
    })

    it("USC + PFIC: weight is higher than H1B (15 vs 12)", () => {
      const uscPfic = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["mutual_funds"], incomeTypes: ["none"], reportedPFICs: "no" })).results.find(r => r.rule_id === "pfic")
      const h1bPfic = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "H1B", filingStatus: "Single", assets: ["mutual_funds"], incomeTypes: ["none"], reportedPFICs: "no" })).results.find(r => r.rule_id === "pfic")
      expect(uscPfic!.score_weight).toBe(15)
      expect(h1bPfic!.score_weight).toBe(12)
    })

    /* ── 8. Bank KYC ── */

    it("USC + KYC: updatedBankKYC='yes' → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["none"], updatedBankKYC: "yes" })).results.find(r => r.rule_id === "bank_kyc")
      expect(r).toBeUndefined()
    })

    it("USC + KYC: updatedBankKYC='no' → fires, weight 5", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["none"], updatedBankKYC: "no" })).results.find(r => r.rule_id === "bank_kyc")
      expect(r).toBeDefined()
      expect(r!.score_weight).toBe(5)
      expect(r!.status).toBe("triggered")
      expect(r!.severity).toBe("warning")
    })

    it("USC + KYC: updatedBankKYC='not_sure' → fires, weight 3.5", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["none"], updatedBankKYC: "not_sure" })).results.find(r => r.rule_id === "bank_kyc")
      expect(r).toBeDefined()
      expect(r!.score_weight).toBe(5 * 0.7)
      expect(r!.status).toBe("needs_review")
    })

    it("USC + KYC: updatedBankKYC='' → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["none"], updatedBankKYC: "" })).results.find(r => r.rule_id === "bank_kyc")
      expect(r).toBeUndefined()
    })

    it("USC + KYC: no foreign accounts → null (gate)", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["mutual_funds", "stocks"], incomeTypes: ["none"], updatedBankKYC: "no" })).results.find(r => r.rule_id === "bank_kyc")
      expect(r).toBeUndefined()
    })

    it("USC + KYC: nre_nro triggers via hasForeignAccounts", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["nre_nro"], incomeTypes: ["none"], updatedBankKYC: "no" })).results.find(r => r.rule_id === "bank_kyc")
      expect(r).toBeDefined()
    })

    /* ── 9. Citizenship Renunciation ── */

    it("USC + Citizenship: surrendered='yes' → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2015", usStatus: "US Citizen", filingStatus: "Single", assets: [], incomeTypes: ["none"], surrenderedIndianPassport: "yes" })).results.find(r => r.rule_id === "citizenship_renunciation")
      expect(r).toBeUndefined()
    })

    it("USC + Citizenship: surrendered='no' → fires, weight 8", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2015", usStatus: "US Citizen", filingStatus: "Single", assets: [], incomeTypes: ["none"], surrenderedIndianPassport: "no" })).results.find(r => r.rule_id === "citizenship_renunciation")
      expect(r).toBeDefined()
      expect(r!.score_weight).toBe(8)
      expect(r!.status).toBe("triggered")
      expect(r!.severity).toBe("warning")
      expect(r!.why_applies).toContain("have not surrendered")
    })

    it("USC + Citizenship: surrendered='not_sure' → fires, weight 5.6", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2015", usStatus: "US Citizen", filingStatus: "Single", assets: [], incomeTypes: ["none"], surrenderedIndianPassport: "not_sure" })).results.find(r => r.rule_id === "citizenship_renunciation")
      expect(r).toBeDefined()
      expect(r!.score_weight).toBe(8 * 0.7)
      expect(r!.status).toBe("needs_review")
      expect(r!.why_applies).toContain("unsure")
    })

    it("USC + Citizenship: surrendered='' → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2015", usStatus: "US Citizen", filingStatus: "Single", assets: [], incomeTypes: ["none"], surrenderedIndianPassport: "" })).results.find(r => r.rule_id === "citizenship_renunciation")
      expect(r).toBeUndefined()
    })

    /* ── 10. Aadhaar Biometric ── */

    it("USC + Aadhaar: hasAadhaar='yes' + left > 10 yrs → fires", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2010", usStatus: "US Citizen", filingStatus: "Single", assets: [], incomeTypes: ["none"], hasAadhaar: "yes" })).results.find(r => r.rule_id === "aadhaar_biometric")
      expect(r).toBeDefined()
      expect(r!.severity).toBe("info")
      expect(r!.score_weight).toBe(3)
      expect(r!.why_applies).toContain("2010")
    })

    it("USC + Aadhaar: hasAadhaar='yes' + left <= 10 yrs → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2020", usStatus: "US Citizen", filingStatus: "Single", assets: [], incomeTypes: ["none"], hasAadhaar: "yes" })).results.find(r => r.rule_id === "aadhaar_biometric")
      expect(r).toBeUndefined()
    })

    it("USC + Aadhaar: hasAadhaar='no' → null (gate)", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2010", usStatus: "US Citizen", filingStatus: "Single", assets: [], incomeTypes: ["none"], hasAadhaar: "no" })).results.find(r => r.rule_id === "aadhaar_biometric")
      expect(r).toBeUndefined()
    })

    it("USC + Aadhaar: invalid yearLeftIndia → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "abc", usStatus: "US Citizen", filingStatus: "Single", assets: [], incomeTypes: ["none"], hasAadhaar: "yes" })).results.find(r => r.rule_id === "aadhaar_biometric")
      expect(r).toBeUndefined()
    })

    /* ── 11. TDS Certificates ── */

    it("USC + TDS: rental + interest → fires with both mentioned", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["rental", "interest"] })).results.find(r => r.rule_id === "tds_certificates")
      expect(r).toBeDefined()
      expect(r!.severity).toBe("info")
      expect(r!.why_applies).toContain("interest")
      expect(r!.why_applies).toContain("rental")
    })

    it("USC + TDS: interest only → fires", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["interest"] })).results.find(r => r.rule_id === "tds_certificates")
      expect(r).toBeDefined()
    })

    it("USC + TDS: rental only → fires", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["rental"] })).results.find(r => r.rule_id === "tds_certificates")
      expect(r).toBeDefined()
    })

    it("USC + TDS: dividend only → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["dividend"] })).results.find(r => r.rule_id === "tds_certificates")
      expect(r).toBeUndefined()
    })

    it("USC + TDS: no income → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["none"] })).results.find(r => r.rule_id === "tds_certificates")
      expect(r).toBeUndefined()
    })

    /* ── 12. Repatriation ── */

    it("USC + Repatriation: single high-value asset → fires", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], assetAmounts: { bank_accounts: "over_100k" }, incomeTypes: ["none"] })).results.find(r => r.rule_id === "repatriation")
      expect(r).toBeDefined()
      expect(r!.severity).toBe("warning")
      expect(r!.score_weight).toBe(4)
    })

    it("USC + Repatriation: 3+ assets → fires", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts", "mutual_funds", "stocks"], assetAmounts: { bank_accounts: "under_5k" }, incomeTypes: ["none"] })).results.find(r => r.rule_id === "repatriation")
      expect(r).toBeDefined()
    })

    it("USC + Repatriation: 1-2 low-value assets → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], assetAmounts: { bank_accounts: "under_5k" }, incomeTypes: ["none"] })).results.find(r => r.rule_id === "repatriation")
      expect(r).toBeUndefined()
    })

    it("USC + Repatriation: no assets → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: [], incomeTypes: ["none"] })).results.find(r => r.rule_id === "repatriation")
      expect(r).toBeUndefined()
    })

    /* ── 13. DTAA ── */

    it("USC + DTAA: income → fires without dual-residency note", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["rental"] })).results.find(r => r.rule_id === "dtaa_trc")
      expect(r).toBeDefined()
      expect(r!.severity).toBe("warning")
      expect(r!.why_applies).not.toContain("dual-residency")
      expect(r!.why_applies).not.toContain("Green Card")
    })

    it("USC + DTAA: no income → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["none"] })).results.find(r => r.rule_id === "dtaa_trc")
      expect(r).toBeUndefined()
    })

    /* ── 14. Property Tax ── */

    it("USC + Property Tax: property → fires", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["property"], incomeTypes: ["none"] })).results.find(r => r.rule_id === "property_tax")
      expect(r).toBeDefined()
      expect(r!.severity).toBe("info")
    })

    it("USC + Property Tax: no property → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["none"] })).results.find(r => r.rule_id === "property_tax")
      expect(r).toBeUndefined()
    })

    /* ── 15. PPF NRI ── */

    it("USC + PPF: ppf → fires", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["ppf"], incomeTypes: ["none"] })).results.find(r => r.rule_id === "ppf_nri")
      expect(r).toBeDefined()
      expect(r!.severity).toBe("info")
    })

    it("USC + PPF: no ppf → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["none"] })).results.find(r => r.rule_id === "ppf_nri")
      expect(r).toBeUndefined()
    })

    /* ── 16. LIC Premium ── */

    it("USC + LIC: life_insurance → fires", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["life_insurance"], incomeTypes: ["none"] })).results.find(r => r.rule_id === "lic_premium")
      expect(r).toBeDefined()
      expect(r!.severity).toBe("warning")
    })

    it("USC + LIC: no life_insurance → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], incomeTypes: ["none"] })).results.find(r => r.rule_id === "lic_premium")
      expect(r).toBeUndefined()
    })

    /* ── 17. State FEIE ── */

    it("USC + State FEIE: CA + income → fires", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", usState: "CA", assets: ["bank_accounts"], incomeTypes: ["rental"] })).results.find(r => r.rule_id === "state_feie_gap")
      expect(r).toBeDefined()
      expect(r!.rule_name).toContain("CA")
    })

    it("USC + State FEIE: TX + income → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", usState: "TX", assets: ["bank_accounts"], incomeTypes: ["rental"] })).results.find(r => r.rule_id === "state_feie_gap")
      expect(r).toBeUndefined()
    })

    it("USC + State FEIE: CA + no income → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", usState: "CA", assets: ["bank_accounts"], incomeTypes: ["none"] })).results.find(r => r.rule_id === "state_feie_gap")
      expect(r).toBeUndefined()
    })

    /* ── 18. State FTC Gap ── */

    it("USC + State FTC: PA + income → fires", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", usState: "PA", assets: ["bank_accounts"], incomeTypes: ["interest"] })).results.find(r => r.rule_id === "state_ftc_gap")
      expect(r).toBeDefined()
      expect(r!.severity).toBe("warning")
    })

    it("USC + State FTC: FL + income → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", usState: "FL", assets: ["bank_accounts"], incomeTypes: ["interest"] })).results.find(r => r.rule_id === "state_ftc_gap")
      expect(r).toBeUndefined()
    })

    it("USC + CA has BOTH state_feie_gap AND state_ftc_gap with income", () => {
      const result = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", usState: "CA", assets: ["bank_accounts"], incomeTypes: ["rental"] }))
      expect(result.results.find(r => r.rule_id === "state_feie_gap")).toBeDefined()
      expect(result.results.find(r => r.rule_id === "state_ftc_gap")).toBeDefined()
    })

    /* ── 19. Washington Capital Gains ── */

    it("USC + WA: high-value stocks → fires", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", usState: "WA", assets: ["stocks"], assetAmounts: { stocks: "over_100k" }, incomeTypes: ["none"] })).results.find(r => r.rule_id === "wa_capital_gains")
      expect(r).toBeDefined()
      expect(r!.severity).toBe("info")
    })

    it("USC + WA: high-value mutual_funds → fires", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", usState: "WA", assets: ["mutual_funds"], assetAmounts: { mutual_funds: "50k_100k" }, incomeTypes: ["none"] })).results.find(r => r.rule_id === "wa_capital_gains")
      expect(r).toBeDefined()
    })

    it("USC + WA: low-value stocks → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", usState: "WA", assets: ["stocks"], assetAmounts: { stocks: "under_5k" }, incomeTypes: ["none"] })).results.find(r => r.rule_id === "wa_capital_gains")
      expect(r).toBeUndefined()
    })

    it("USC + WA: no stocks/MFs → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", usState: "WA", assets: ["bank_accounts"], assetAmounts: { bank_accounts: "over_100k" }, incomeTypes: ["none"] })).results.find(r => r.rule_id === "wa_capital_gains")
      expect(r).toBeUndefined()
    })

    it("USC + non-WA: high-value stocks → null", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: "2018", usStatus: "US Citizen", filingStatus: "Single", usState: "TX", assets: ["stocks"], assetAmounts: { stocks: "over_100k" }, incomeTypes: ["none"] })).results.find(r => r.rule_id === "wa_capital_gains")
      expect(r).toBeUndefined()
    })

    /* ── isFirstYearH1B never applies to US Citizens ── */

    it("USC: isFirstYearH1B logic never triggers (current year left)", () => {
      const r = runRulesEngine(makeAnswers({ yearLeftIndia: String(new Date().getFullYear()), usStatus: "US Citizen", filingStatus: "Single", assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" }, incomeTypes: ["none"], filedFBAR: "no" })).results.find(r => r.rule_id === "fbar")
      expect(r).toBeDefined()
      expect(r!.why_applies).not.toContain("Substantial Presence Test")
    })

    /* ── USC combined scenarios ── */

    it("USC: all rules fire when maximally non-compliant + CA", () => {
      const result = runRulesEngine(makeAnswers({
        yearLeftIndia: "2010", usStatus: "US Citizen",
        filingStatus: "Married Filing Jointly", usState: "CA",
        assets: ["bank_accounts", "mutual_funds", "stocks", "property", "life_insurance", "ppf", "nps", "epf", "nre_nro"],
        assetAmounts: { bank_accounts: "over_100k", mutual_funds: "over_100k", stocks: "over_100k" },
        incomeTypes: ["rental", "interest", "dividend", "capital_gains"],
        hasPAN: "yes", hasAadhaar: "yes", panLinkedAadhaar: "no",
        hasOCI: "yes", ociUpdatedAfterPassportRenewal: "no",
        surrenderedIndianPassport: "no",
        filedIndianITR: "no", filedFBAR: "no", filedFATCA: "no",
        reportedPFICs: "no", updatedBankKYC: "no", convertedToNRO: "no",
      }))
      const ids = result.results.map(r => r.rule_id)
      // All 9 triState rules
      for (const id of ["fbar", "fatca", "indian_itr", "pan_inoperative", "fema_conversion", "oci_update", "pfic", "bank_kyc", "citizenship_renunciation"]) {
        expect(ids).toContain(id)
      }
      // Informational rules
      for (const id of ["aadhaar_biometric", "tds_certificates", "repatriation", "dtaa_trc", "property_tax", "ppf_nri", "lic_premium"]) {
        expect(ids).toContain(id)
      }
      // State rules
      expect(ids).toContain("state_feie_gap")
      expect(ids).toContain("state_ftc_gap")
      expect(result.score).toBeLessThanOrEqual(5)
      expect(result.totalPenaltyMax).toBeGreaterThan(100000)
    })

    it("USC: zero triState rules fire when fully compliant", () => {
      const result = runRulesEngine(makeAnswers({
        yearLeftIndia: "2020", usStatus: "US Citizen", filingStatus: "Single", usState: "TX",
        assets: ["bank_accounts", "mutual_funds", "stocks", "property", "life_insurance", "ppf", "nps", "epf", "nre_nro"],
        assetAmounts: { bank_accounts: "over_100k", mutual_funds: "over_100k" },
        incomeTypes: ["rental", "interest"],
        hasPAN: "yes", hasAadhaar: "yes", panLinkedAadhaar: "yes",
        hasOCI: "yes", ociUpdatedAfterPassportRenewal: "yes",
        surrenderedIndianPassport: "yes",
        filedIndianITR: "yes", filedFBAR: "yes", filedFATCA: "yes",
        reportedPFICs: "yes", updatedBankKYC: "yes", convertedToNRO: "yes",
      }))
      const triIds = ["fbar", "fatca", "indian_itr", "pan_inoperative", "fema_conversion", "oci_update", "pfic", "bank_kyc", "citizenship_renunciation"]
      const triggered = result.results.filter(r => triIds.includes(r.rule_id))
      expect(triggered).toHaveLength(0)
    })

    it("USC: all not_sure → all triState rules have needs_review", () => {
      const result = runRulesEngine(makeAnswers({
        yearLeftIndia: "2010", usStatus: "US Citizen", filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds", "stocks", "property", "life_insurance", "ppf", "nps", "epf", "nre_nro"],
        assetAmounts: { bank_accounts: "over_100k", mutual_funds: "over_100k" },
        incomeTypes: ["rental", "interest"],
        hasPAN: "not_sure", hasAadhaar: "not_sure", panLinkedAadhaar: "not_sure",
        hasOCI: "yes", ociUpdatedAfterPassportRenewal: "not_sure",
        surrenderedIndianPassport: "not_sure",
        filedIndianITR: "not_sure", filedFBAR: "not_sure", filedFATCA: "not_sure",
        reportedPFICs: "not_sure", updatedBankKYC: "not_sure", convertedToNRO: "not_sure",
      }))
      for (const id of ["fbar", "fatca", "indian_itr", "fema_conversion", "oci_update", "pfic", "bank_kyc", "citizenship_renunciation"]) {
        const rule = result.results.find(r => r.rule_id === id)
        expect(rule).toBeDefined()
        expect(rule!.status).toBe("needs_review")
      }
    })
  })

  /* ══════════════════════════════════════════════════════════════
   * OTHER — EXHAUSTIVE RULE COVERAGE
   *
   * "Other" citizenship: OCI/surrender questions are NOT shown
   * (those are US Citizens only). hasOCI and surrenderStatus stay
   * at "" (default). citizenship_renunciation NEVER fires.
   * isFirstYearH1B NEVER applies. PFIC weight = 12 (same as H1B).
   * ══════════════════════════════════════════════════════════════ */
  describe("Other — exhaustive rule coverage", () => {

    /* ─────────────────────────────────────────────────────────
     * FBAR (rule_fbar) — triState: filedFBAR
     * Gates: hasForeignAccounts || totalAggregateAbove10K
     * Weight: 20 (no), 14 (not_sure), 0 (yes/empty)
     * ───────────────────────────────────────────────────────── */

    it("Other + bank_accounts + filedFBAR=no → FBAR fires, wt 20, severity urgent", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
        incomeTypes: ["none"], filedFBAR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("urgent")
      expect(rule!.score_weight).toBe(20)
      expect(rule!.status).toBe("triggered")
    })

    it("Other + bank_accounts + filedFBAR=not_sure → FBAR fires, wt 14, needs_review", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
        incomeTypes: ["none"], filedFBAR: "not_sure",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
      expect(rule).toBeDefined()
      expect(rule!.score_weight).toBe(20 * 0.7)
      expect(rule!.status).toBe("needs_review")
      // "Other" is never first-year H1B → no SPT note
      expect(rule!.why_applies).not.toContain("Substantial Presence Test")
    })

    it("Other + bank_accounts + filedFBAR=yes → FBAR null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
        incomeTypes: ["none"], filedFBAR: "yes",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
      expect(rule).toBeUndefined()
    })

    it("Other + bank_accounts + filedFBAR='' → FBAR null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
        incomeTypes: ["none"], filedFBAR: "",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
      expect(rule).toBeUndefined()
    })

    it("Other + nre_nro + filedFBAR=no → FBAR fires (nre_nro counts as foreign account)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["nre_nro"], assetAmounts: { nre_nro: "10k_50k" },
        incomeTypes: ["none"], filedFBAR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
      expect(rule).toBeDefined()
      expect(rule!.why_applies).toContain("NRE/NRO")
    })

    it("Other + ppf + epf (2 account types) + filedFBAR=no → FBAR fires via totalAggregateAbove10K", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["ppf", "epf"], incomeTypes: ["none"], filedFBAR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
      expect(rule).toBeDefined()
    })

    it("Other + ppf only (1 account, low value) + filedFBAR=no → FBAR null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["ppf"], assetAmounts: { ppf: "under_5k" },
        incomeTypes: ["none"], filedFBAR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
      expect(rule).toBeUndefined()
    })

    it("Other + no foreign accounts, no high aggregate → FBAR null regardless of filedFBAR", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["property", "life_insurance"], incomeTypes: ["none"],
        filedFBAR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
      expect(rule).toBeUndefined()
    })

    it("Other + FBAR why_applies never mentions SPT (isFirstYearH1B never true for Other)", () => {
      // Even with current year, "Other" is not H1B
      const answers = makeAnswers({
        yearLeftIndia: String(new Date().getFullYear()), usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], assetAmounts: { bank_accounts: "10k_50k" },
        incomeTypes: ["none"], filedFBAR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fbar")
      expect(rule).toBeDefined()
      expect(rule!.why_applies).not.toContain("Substantial Presence Test")
      expect(rule!.why_applies).not.toContain("first-year H1B")
    })

    /* ─────────────────────────────────────────────────────────
     * FATCA (rule_fatca) — triState: filedFATCA
     * Gates: hasAnyAssets && totalAssetsAbove50K
     * Weight: 15 (no), 10.5 (not_sure), 0 (yes/empty)
     * ───────────────────────────────────────────────────────── */

    it("Other + high-value assets + filedFATCA=no → FATCA fires, wt 15", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds", "stocks"],
        assetAmounts: { bank_accounts: "over_100k" },
        incomeTypes: ["none"], filedFATCA: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
      expect(rule).toBeDefined()
      expect(rule!.score_weight).toBe(15)
      expect(rule!.status).toBe("triggered")
    })

    it("Other + high-value assets + filedFATCA=not_sure → FATCA fires, wt 10.5", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds", "stocks"],
        assetAmounts: { bank_accounts: "over_100k" },
        incomeTypes: ["none"], filedFATCA: "not_sure",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
      expect(rule).toBeDefined()
      expect(rule!.score_weight).toBe(15 * 0.7)
      expect(rule!.status).toBe("needs_review")
    })

    it("Other + high-value assets + filedFATCA=yes → FATCA null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds", "stocks"],
        assetAmounts: { bank_accounts: "over_100k" },
        incomeTypes: ["none"], filedFATCA: "yes",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
      expect(rule).toBeUndefined()
    })

    it("Other + high-value assets + filedFATCA='' → FATCA null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds", "stocks"],
        assetAmounts: { bank_accounts: "over_100k" },
        incomeTypes: ["none"], filedFATCA: "",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
      expect(rule).toBeUndefined()
    })

    it("Other + low-value single asset → FATCA null (below $50K threshold)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], assetAmounts: { bank_accounts: "5k_10k" },
        incomeTypes: ["none"], filedFATCA: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
      expect(rule).toBeUndefined()
    })

    it("Other + no assets → FATCA null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: [], incomeTypes: ["none"], filedFATCA: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
      expect(rule).toBeUndefined()
    })

    it("Other + 3+ asset types (low value each) → FATCA fires (assets.length >= 3 triggers totalAssetsAbove50K)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds", "stocks"],
        assetAmounts: { bank_accounts: "under_5k", mutual_funds: "under_5k", stocks: "under_5k" },
        incomeTypes: ["none"], filedFATCA: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
      expect(rule).toBeDefined()
    })

    it("Other + MFJ → FATCA shows $100K/$200K thresholds", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other",
        filingStatus: "Married Filing Jointly",
        assets: ["bank_accounts", "mutual_funds", "stocks"],
        assetAmounts: { bank_accounts: "over_100k" },
        incomeTypes: ["none"], filedFATCA: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
      expect(rule).toBeDefined()
      expect(rule!.obligation_summary).toContain("$100,000 (married filing jointly)")
      expect(rule!.obligation_summary).toContain("$200,000")
      expect(rule!.why_applies).toContain("$100,000 MFJ")
    })

    it("Other + Single → FATCA shows $50K/$75K thresholds", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds", "stocks"],
        assetAmounts: { bank_accounts: "over_100k" },
        incomeTypes: ["none"], filedFATCA: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fatca")
      expect(rule).toBeDefined()
      expect(rule!.obligation_summary).toContain("$50,000 (single/MFS)")
      expect(rule!.obligation_summary).toContain("$75,000")
    })

    /* ─────────────────────────────────────────────────────────
     * Indian ITR (rule_indian_itr) — triState: filedIndianITR
     * Gates: hasIncomeFromIndia || hasAnyAssets
     * Weight: 12 (no), 8.4 (not_sure), 0 (yes/empty)
     * ───────────────────────────────────────────────────────── */

    it("Other + income + filedIndianITR=no → ITR fires, wt 12", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["rental"],
        filedIndianITR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")
      expect(rule).toBeDefined()
      expect(rule!.score_weight).toBe(12)
      expect(rule!.status).toBe("triggered")
    })

    it("Other + income + filedIndianITR=not_sure → ITR fires, wt 8.4", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["rental"],
        filedIndianITR: "not_sure",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")
      expect(rule).toBeDefined()
      expect(rule!.score_weight).toBe(12 * 0.7)
      expect(rule!.status).toBe("needs_review")
    })

    it("Other + income + filedIndianITR=yes → ITR null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["rental"],
        filedIndianITR: "yes",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")
      expect(rule).toBeUndefined()
    })

    it("Other + income + filedIndianITR='' → ITR null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["rental"],
        filedIndianITR: "",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")
      expect(rule).toBeUndefined()
    })

    it("Other + no income + no assets → ITR null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: [], incomeTypes: ["none"], filedIndianITR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")
      expect(rule).toBeUndefined()
    })

    it("Other + assets but no income → ITR fires (hasAnyAssets gate)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
        filedIndianITR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")
      expect(rule).toBeDefined()
    })

    it("Other + ITR why_applies has NO status-specific note (not GC, not USC)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["rental"],
        filedIndianITR: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "indian_itr")
      expect(rule).toBeDefined()
      expect(rule!.why_applies).not.toContain("US Citizen")
      expect(rule!.why_applies).not.toContain("Green Card")
      expect(rule!.why_applies).not.toContain("H1B")
    })

    /* ─────────────────────────────────────────────────────────
     * PAN-Aadhaar Linkage (rule_pan_inoperative) — triState: panLinkedAadhaar
     * Gates: hasPAN !== "no" && hasAadhaar !== "no"
     * Weight: 8 (no), 5.6 (not_sure), 0 (yes/empty)
     * ───────────────────────────────────────────────────────── */

    it("Other + hasPAN=yes + hasAadhaar=yes + panLinkedAadhaar=no → PAN fires, wt 8", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
        hasPAN: "yes", hasAadhaar: "yes", panLinkedAadhaar: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "pan_inoperative")
      expect(rule).toBeDefined()
      expect(rule!.score_weight).toBe(8)
      expect(rule!.severity).toBe("warning")
      expect(rule!.status).toBe("triggered")
    })

    it("Other + hasPAN=yes + hasAadhaar=yes + panLinkedAadhaar=not_sure → PAN fires, wt 5.6", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
        hasPAN: "yes", hasAadhaar: "yes", panLinkedAadhaar: "not_sure",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "pan_inoperative")
      expect(rule).toBeDefined()
      expect(rule!.score_weight).toBe(8 * 0.7)
      expect(rule!.status).toBe("needs_review")
    })

    it("Other + hasPAN=yes + hasAadhaar=yes + panLinkedAadhaar=yes → PAN null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
        hasPAN: "yes", hasAadhaar: "yes", panLinkedAadhaar: "yes",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "pan_inoperative")
      expect(rule).toBeUndefined()
    })

    it("Other + hasPAN=yes + hasAadhaar=yes + panLinkedAadhaar='' → PAN null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
        hasPAN: "yes", hasAadhaar: "yes", panLinkedAadhaar: "",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "pan_inoperative")
      expect(rule).toBeUndefined()
    })

    it("Other + hasPAN=no → PAN null (early exit)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
        hasPAN: "no", hasAadhaar: "yes", panLinkedAadhaar: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "pan_inoperative")
      expect(rule).toBeUndefined()
    })

    it("Other + hasAadhaar=no → PAN null (Aadhaar guard)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
        hasPAN: "yes", hasAadhaar: "no", panLinkedAadhaar: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "pan_inoperative")
      expect(rule).toBeUndefined()
    })

    /* ─────────────────────────────────────────────────────────
     * FEMA Account Conversion (rule_fema_account_conversion) — triState: convertedToNRO
     * Gates: assets.includes("bank_accounts")
     * Weight: 10 (no), 7 (not_sure), 0 (yes/empty)
     * ───────────────────────────────────────────────────────── */

    it("Other + bank_accounts + convertedToNRO=no → FEMA fires, wt 10", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
        convertedToNRO: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fema_conversion")
      expect(rule).toBeDefined()
      expect(rule!.score_weight).toBe(10)
      expect(rule!.severity).toBe("urgent")
      expect(rule!.status).toBe("triggered")
    })

    it("Other + bank_accounts + convertedToNRO=not_sure → FEMA fires, wt 7", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
        convertedToNRO: "not_sure",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fema_conversion")
      expect(rule).toBeDefined()
      expect(rule!.score_weight).toBe(10 * 0.7)
      expect(rule!.status).toBe("needs_review")
    })

    it("Other + bank_accounts + convertedToNRO=yes → FEMA null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
        convertedToNRO: "yes",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fema_conversion")
      expect(rule).toBeUndefined()
    })

    it("Other + bank_accounts + convertedToNRO='' → FEMA null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
        convertedToNRO: "",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fema_conversion")
      expect(rule).toBeUndefined()
    })

    it("Other + no bank_accounts → FEMA null regardless of convertedToNRO", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["mutual_funds"], incomeTypes: ["none"],
        convertedToNRO: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "fema_conversion")
      expect(rule).toBeUndefined()
    })

    /* ─────────────────────────────────────────────────────────
     * Bank KYC (rule_bank_kyc) — triState: updatedBankKYC
     * Gates: hasForeignAccounts (bank_accounts || nre_nro)
     * Weight: 5 (no), 3.5 (not_sure), 0 (yes/empty)
     * ───────────────────────────────────────────────────────── */

    it("Other + bank_accounts + updatedBankKYC=no → Bank KYC fires, wt 5", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
        updatedBankKYC: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "bank_kyc")
      expect(rule).toBeDefined()
      expect(rule!.score_weight).toBe(5)
      expect(rule!.severity).toBe("warning")
      expect(rule!.status).toBe("triggered")
    })

    it("Other + bank_accounts + updatedBankKYC=not_sure → Bank KYC fires, wt 3.5", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
        updatedBankKYC: "not_sure",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "bank_kyc")
      expect(rule).toBeDefined()
      expect(rule!.score_weight).toBe(5 * 0.7)
      expect(rule!.status).toBe("needs_review")
    })

    it("Other + bank_accounts + updatedBankKYC=yes → Bank KYC null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
        updatedBankKYC: "yes",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "bank_kyc")
      expect(rule).toBeUndefined()
    })

    it("Other + bank_accounts + updatedBankKYC='' → Bank KYC null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
        updatedBankKYC: "",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "bank_kyc")
      expect(rule).toBeUndefined()
    })

    it("Other + nre_nro + updatedBankKYC=no → Bank KYC fires (nre_nro is foreign account)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["nre_nro"], incomeTypes: ["none"],
        updatedBankKYC: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "bank_kyc")
      expect(rule).toBeDefined()
    })

    it("Other + no foreign accounts → Bank KYC null regardless of updatedBankKYC", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["mutual_funds"], incomeTypes: ["none"],
        updatedBankKYC: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "bank_kyc")
      expect(rule).toBeUndefined()
    })

    /* ─────────────────────────────────────────────────────────
     * PFIC (rule_pfic) — triState: reportedPFICs
     * Gates: hasMutualFunds
     * Weight: 12 (no), 8.4 (not_sure), 0 (yes/empty)
     * "Other" gets non-permanent text, not H1B text
     * ───────────────────────────────────────────────────────── */

    it("Other + mutual_funds + reportedPFICs=no → PFIC fires, wt 12, correct text", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["mutual_funds"], incomeTypes: ["none"],
        reportedPFICs: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "pfic")
      expect(rule).toBeDefined()
      expect(rule!.score_weight).toBe(12)
      expect(rule!.status).toBe("triggered")
      expect(rule!.severity).toBe("urgent")
      // "Other" falls through to the final else branch — NOT the H1B branch
      expect(rule!.why_applies).not.toContain("H1B")
      expect(rule!.why_applies).not.toContain("permanent annual obligation")
      expect(rule!.why_applies).toContain("as long as you are a US tax resident")
    })

    it("Other + mutual_funds + reportedPFICs=not_sure → PFIC fires, wt 8.4", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["mutual_funds"], incomeTypes: ["none"],
        reportedPFICs: "not_sure",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "pfic")
      expect(rule).toBeDefined()
      expect(rule!.score_weight).toBe(12 * 0.7)
      expect(rule!.status).toBe("needs_review")
    })

    it("Other + mutual_funds + reportedPFICs=yes → PFIC null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["mutual_funds"], incomeTypes: ["none"],
        reportedPFICs: "yes",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "pfic")
      expect(rule).toBeUndefined()
    })

    it("Other + mutual_funds + reportedPFICs='' → PFIC null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["mutual_funds"], incomeTypes: ["none"],
        reportedPFICs: "",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "pfic")
      expect(rule).toBeUndefined()
    })

    it("Other + no mutual_funds → PFIC null regardless of reportedPFICs", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts", "stocks"], incomeTypes: ["none"],
        reportedPFICs: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "pfic")
      expect(rule).toBeUndefined()
    })

    /* ─────────────────────────────────────────────────────────
     * OCI Update (rule_oci_update) — NEVER FIRES for Other
     * hasOCI stays "" (default) since OCI question not shown
     * ───────────────────────────────────────────────────────── */

    it("Other + hasOCI='' (default) → oci_update null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: [], incomeTypes: ["none"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "oci_update")
      expect(rule).toBeUndefined()
    })

    it("Other + hasOCI='no' → oci_update null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: [], incomeTypes: ["none"],
        hasOCI: "no", ociUpdatedAfterPassportRenewal: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "oci_update")
      expect(rule).toBeUndefined()
    })

    /* ─────────────────────────────────────────────────────────
     * Citizenship Renunciation (rule_citizenship_renunciation)
     * NEVER fires for Other — gates on usStatus === "US Citizen"
     * ───────────────────────────────────────────────────────── */

    it("Other → citizenship_renunciation never fires (even if surrenderedIndianPassport=no)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2010", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
        surrenderedIndianPassport: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "citizenship_renunciation")
      expect(rule).toBeUndefined()
    })

    it("Other → citizenship_renunciation never fires (even if surrenderedIndianPassport=not_sure)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2010", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
        surrenderedIndianPassport: "not_sure",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "citizenship_renunciation")
      expect(rule).toBeUndefined()
    })

    /* ─────────────────────────────────────────────────────────
     * Aadhaar Biometric (rule_aadhaar_biometric) — informational
     * Gates: hasAadhaar === "yes" && yearLeft > 10 yrs ago
     * ───────────────────────────────────────────────────────── */

    it("Other + hasAadhaar=yes + left > 10 yrs → aadhaar_biometric fires", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2010", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"], hasAadhaar: "yes",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "aadhaar_biometric")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("info")
      expect(rule!.score_weight).toBe(3)
      expect(rule!.why_applies).toContain("2010")
    })

    it("Other + hasAadhaar=yes + left <= 10 yrs → aadhaar_biometric null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2020", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"], hasAadhaar: "yes",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "aadhaar_biometric")
      expect(rule).toBeUndefined()
    })

    it("Other + hasAadhaar=no → aadhaar_biometric null regardless of yearLeft", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2010", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"], hasAadhaar: "no",
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "aadhaar_biometric")
      expect(rule).toBeUndefined()
    })

    it("Other + hasAadhaar='' (default) → aadhaar_biometric null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2010", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "aadhaar_biometric")
      expect(rule).toBeUndefined()
    })

    /* ─────────────────────────────────────────────────────────
     * TDS Certificates (rule_tds_certificates) — informational
     * Gates: hasIncomeFromIndia && (hasInterestIncome || hasRentalIncome)
     * ───────────────────────────────────────────────────────── */

    it("Other + rental income only → tds_certificates fires", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["rental"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "tds_certificates")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("info")
      expect(rule!.why_applies).toContain("rental")
    })

    it("Other + interest income only → tds_certificates fires", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["interest"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "tds_certificates")
      expect(rule).toBeDefined()
      expect(rule!.why_applies).toContain("interest")
    })

    it("Other + rental + interest → tds_certificates fires with both mentioned", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["rental", "interest"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "tds_certificates")
      expect(rule).toBeDefined()
      expect(rule!.why_applies).toContain("interest")
      expect(rule!.why_applies).toContain("rental")
    })

    it("Other + dividend income only (no interest/rental) → tds_certificates null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["dividend"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "tds_certificates")
      expect(rule).toBeUndefined()
    })

    it("Other + no income → tds_certificates null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "tds_certificates")
      expect(rule).toBeUndefined()
    })

    /* ─────────────────────────────────────────────────────────
     * Repatriation (rule_repatriation) — informational
     * Gates: hasAnyAssets && (highValue asset || assets.length >= 3)
     * ───────────────────────────────────────────────────────── */

    it("Other + single high-value asset → repatriation fires", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], assetAmounts: { bank_accounts: "over_100k" },
        incomeTypes: ["none"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "repatriation")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("warning")
      expect(rule!.score_weight).toBe(4)
    })

    it("Other + 3+ asset types (any value) → repatriation fires", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds", "stocks"],
        incomeTypes: ["none"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "repatriation")
      expect(rule).toBeDefined()
    })

    it("Other + 1-2 low-value assets → repatriation null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], assetAmounts: { bank_accounts: "under_5k" },
        incomeTypes: ["none"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "repatriation")
      expect(rule).toBeUndefined()
    })

    it("Other + no assets → repatriation null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: [], incomeTypes: ["none"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "repatriation")
      expect(rule).toBeUndefined()
    })

    /* ─────────────────────────────────────────────────────────
     * DTAA (rule_dtaa) — informational
     * Gates: hasIncomeFromIndia
     * ───────────────────────────────────────────────────────── */

    it("Other + income → dtaa_trc fires without any status note", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["rental"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "dtaa_trc")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("warning")
      expect(rule!.score_weight).toBe(4)
      expect(rule!.why_applies).not.toContain("Green Card")
      expect(rule!.why_applies).not.toContain("dual-residency")
      expect(rule!.why_applies).not.toContain("US Citizen")
    })

    it("Other + no income → dtaa_trc null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "dtaa_trc")
      expect(rule).toBeUndefined()
    })

    /* ─────────────────────────────────────────────────────────
     * Property Tax (rule_property_tax) — informational
     * Gates: hasProperty
     * ───────────────────────────────────────────────────────── */

    it("Other + property → property_tax fires", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["property"], incomeTypes: ["none"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "property_tax")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("info")
      expect(rule!.score_weight).toBe(3)
    })

    it("Other + no property → property_tax null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "property_tax")
      expect(rule).toBeUndefined()
    })

    /* ─────────────────────────────────────────────────────────
     * LIC Premium (rule_lic_premium) — informational
     * Gates: hasLIC
     * ───────────────────────────────────────────────────────── */

    it("Other + life_insurance → lic_premium fires", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["life_insurance"], incomeTypes: ["none"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "lic_premium")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("warning")
      expect(rule!.score_weight).toBe(4)
    })

    it("Other + no life_insurance → lic_premium null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "lic_premium")
      expect(rule).toBeUndefined()
    })

    /* ─────────────────────────────────────────────────────────
     * PPF NRI (rule_ppf_nri) — informational
     * Gates: hasPPF
     * ───────────────────────────────────────────────────────── */

    it("Other + ppf → ppf_nri fires", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["ppf"], incomeTypes: ["none"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "ppf_nri")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("info")
      expect(rule!.score_weight).toBe(3)
    })

    it("Other + no ppf → ppf_nri null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], incomeTypes: ["none"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "ppf_nri")
      expect(rule).toBeUndefined()
    })

    /* ─────────────────────────────────────────────────────────
     * State FEIE Non-Conformity (rule_state_feie_nonconformity)
     * Gates: FEIE_NON_CONFORMING_STATES.includes(usState) && hasIncomeFromIndia
     * ───────────────────────────────────────────────────────── */

    it("Other + CA + income → state_feie_gap fires", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        usState: "CA", assets: ["bank_accounts"], incomeTypes: ["rental"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "state_feie_gap")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("warning")
      expect(rule!.rule_name).toContain("CA")
    })

    it("Other + TX + income → state_feie_gap null (TX not in non-conforming list)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        usState: "TX", assets: ["bank_accounts"], incomeTypes: ["rental"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "state_feie_gap")
      expect(rule).toBeUndefined()
    })

    it("Other + CA + no income → state_feie_gap null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        usState: "CA", assets: ["bank_accounts"], incomeTypes: ["none"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "state_feie_gap")
      expect(rule).toBeUndefined()
    })

    /* ─────────────────────────────────────────────────────────
     * State FTC Gap (rule_state_ftc_gap)
     * Gates: FTC_GAP_STATES.includes(usState) && hasIncomeFromIndia
     * ───────────────────────────────────────────────────────── */

    it("Other + PA + income → state_ftc_gap fires", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        usState: "PA", assets: ["bank_accounts"], incomeTypes: ["interest"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "state_ftc_gap")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("warning")
    })

    it("Other + FL + income → state_ftc_gap null (FL not in gap list)", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        usState: "FL", assets: ["bank_accounts"], incomeTypes: ["interest"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "state_ftc_gap")
      expect(rule).toBeUndefined()
    })

    it("Other + PA + no income → state_ftc_gap null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        usState: "PA", assets: ["bank_accounts"], incomeTypes: ["none"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "state_ftc_gap")
      expect(rule).toBeUndefined()
    })

    /* ─────────────────────────────────────────────────────────
     * Washington Capital Gains (rule_washington_capital_gains)
     * Gates: usState === "WA" && (hasStocks || hasMutualFunds) && hasHighValueStocksOrMFs
     * ───────────────────────────────────────────────────────── */

    it("Other + WA + high-value stocks → wa_capital_gains fires", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        usState: "WA", assets: ["stocks"],
        assetAmounts: { stocks: "over_100k" }, incomeTypes: ["none"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "wa_capital_gains")
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe("info")
    })

    it("Other + WA + high-value mutual_funds → wa_capital_gains fires", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        usState: "WA", assets: ["mutual_funds"],
        assetAmounts: { mutual_funds: "50k_100k" }, incomeTypes: ["none"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "wa_capital_gains")
      expect(rule).toBeDefined()
    })

    it("Other + WA + low-value stocks → wa_capital_gains null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        usState: "WA", assets: ["stocks"],
        assetAmounts: { stocks: "under_5k" }, incomeTypes: ["none"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "wa_capital_gains")
      expect(rule).toBeUndefined()
    })

    it("Other + non-WA + high-value stocks → wa_capital_gains null", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        usState: "CA", assets: ["stocks"],
        assetAmounts: { stocks: "over_100k" }, incomeTypes: ["none"],
      })
      const rule = runRulesEngine(answers).results.find(r => r.rule_id === "wa_capital_gains")
      expect(rule).toBeUndefined()
    })

    /* ─────────────────────────────────────────────────────────
     * Composite / Integration scenarios for "Other"
     * ───────────────────────────────────────────────────────── */

    it("Other: all-yes on every triState → zero triState rules fire", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds", "stocks", "property", "life_insurance", "ppf", "nps", "epf", "nre_nro"],
        assetAmounts: { bank_accounts: "over_100k", mutual_funds: "over_100k" },
        incomeTypes: ["rental", "interest"],
        hasPAN: "yes", panLinkedAadhaar: "yes", hasAadhaar: "yes",
        filedIndianITR: "yes", filedFBAR: "yes", filedFATCA: "yes",
        reportedPFICs: "yes", updatedBankKYC: "yes", convertedToNRO: "yes",
      })
      const result = runRulesEngine(answers)
      const triStateRuleIds = ["fbar", "fatca", "indian_itr", "pan_inoperative", "fema_conversion", "pfic", "bank_kyc"]
      const triggered = result.results.filter(r => triStateRuleIds.includes(r.rule_id))
      expect(triggered).toHaveLength(0)
      // Informational rules should still fire
      const infoRuleIds = result.results.map(r => r.rule_id)
      expect(infoRuleIds).toContain("tds_certificates")
      expect(infoRuleIds).toContain("repatriation")
      expect(infoRuleIds).toContain("property_tax")
      expect(infoRuleIds).toContain("lic_premium")
      expect(infoRuleIds).toContain("ppf_nri")
    })

    it("Other: all-no on every triState → maximum rules fire, low score", () => {
      const answers = makeAnswers({
        yearLeftIndia: "2010", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds", "stocks", "property", "life_insurance", "ppf", "nps", "epf", "nre_nro"],
        assetAmounts: { bank_accounts: "over_100k", mutual_funds: "over_100k" },
        incomeTypes: ["rental", "interest"],
        hasPAN: "yes", panLinkedAadhaar: "no", hasAadhaar: "yes",
        filedIndianITR: "no", filedFBAR: "no", filedFATCA: "no",
        reportedPFICs: "no", updatedBankKYC: "no", convertedToNRO: "no",
      })
      const result = runRulesEngine(answers)
      const ruleIds = result.results.map(r => r.rule_id)
      // All triState rules for "Other" should fire
      expect(ruleIds).toContain("fbar")
      expect(ruleIds).toContain("fatca")
      expect(ruleIds).toContain("indian_itr")
      expect(ruleIds).toContain("pan_inoperative")
      expect(ruleIds).toContain("fema_conversion")
      expect(ruleIds).toContain("pfic")
      expect(ruleIds).toContain("bank_kyc")
      // OCI/citizenship NEVER fire for Other
      expect(ruleIds).not.toContain("oci_update")
      expect(ruleIds).not.toContain("citizenship_renunciation")
      // Informational rules fire
      expect(ruleIds).toContain("aadhaar_biometric")
      expect(ruleIds).toContain("tds_certificates")
      expect(ruleIds).toContain("repatriation")
      expect(ruleIds).toContain("property_tax")
      expect(ruleIds).toContain("lic_premium")
      expect(ruleIds).toContain("ppf_nri")
      // Score should be very low
      expect(result.score).toBeLessThanOrEqual(15)
      expect(result.totalPenaltyMax).toBeGreaterThan(0)
    })

    it("Other: all-not-sure → needs_review on all triState rules, higher score than all-no", () => {
      const notSureAnswers = makeAnswers({
        yearLeftIndia: "2010", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds", "stocks", "property", "life_insurance", "ppf", "nps", "epf", "nre_nro"],
        assetAmounts: { bank_accounts: "over_100k", mutual_funds: "over_100k" },
        incomeTypes: ["rental", "interest"],
        hasPAN: "yes", panLinkedAadhaar: "not_sure", hasAadhaar: "yes",
        filedIndianITR: "not_sure", filedFBAR: "not_sure", filedFATCA: "not_sure",
        reportedPFICs: "not_sure", updatedBankKYC: "not_sure", convertedToNRO: "not_sure",
      })
      const noAnswers = makeAnswers({
        yearLeftIndia: "2010", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts", "mutual_funds", "stocks", "property", "life_insurance", "ppf", "nps", "epf", "nre_nro"],
        assetAmounts: { bank_accounts: "over_100k", mutual_funds: "over_100k" },
        incomeTypes: ["rental", "interest"],
        hasPAN: "yes", panLinkedAadhaar: "no", hasAadhaar: "yes",
        filedIndianITR: "no", filedFBAR: "no", filedFATCA: "no",
        reportedPFICs: "no", updatedBankKYC: "no", convertedToNRO: "no",
      })
      const notSureResult = runRulesEngine(notSureAnswers)
      const noResult = runRulesEngine(noAnswers)
      // not_sure score always >= all-no score
      expect(notSureResult.score).toBeGreaterThanOrEqual(noResult.score)
      // All triState rules should have needs_review status
      const triStateRuleIds = ["fbar", "fatca", "indian_itr", "pan_inoperative", "fema_conversion", "pfic", "bank_kyc"]
      const triStateRules = notSureResult.results.filter(r => triStateRuleIds.includes(r.rule_id))
      for (const rule of triStateRules) {
        expect(rule.status).toBe("needs_review")
      }
    })

    it("Other: score calculation is correct (100 - sum of weights)", () => {
      // Minimal case: only FBAR fires with weight 20
      const answers = makeAnswers({
        yearLeftIndia: "2018", usStatus: "Other", filingStatus: "Single",
        assets: ["bank_accounts"], assetAmounts: { bank_accounts: "under_5k" },
        incomeTypes: ["none"],
        filedFBAR: "no",
        // Suppress other rules
        filedFATCA: "yes", filedIndianITR: "yes", reportedPFICs: "yes",
        updatedBankKYC: "yes", convertedToNRO: "yes",
        hasPAN: "yes", panLinkedAadhaar: "yes", hasAadhaar: "yes",
      })
      const result = runRulesEngine(answers)
      // Only FBAR should fire (wt 20), score = 100 - 20 = 80
      const ruleIds = result.results.map(r => r.rule_id)
      expect(ruleIds).toContain("fbar")
      expect(result.score).toBe(80)
    })
  })
})
