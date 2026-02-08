import { test, expect } from "@playwright/test"

const screenshotDir = "/Users/meethmaharana/NRI Document Vault/app/ui-screenshots"

test.describe("Visual UI — Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
  })

  test("full landing page — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.screenshot({
      path: `${screenshotDir}/01-landing-desktop-full.png`,
      fullPage: true,
    })
  })

  test("full landing page — mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.screenshot({
      path: `${screenshotDir}/02-landing-mobile-full.png`,
      fullPage: true,
    })
  })

  test("full landing page — tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.screenshot({
      path: `${screenshotDir}/03-landing-tablet-full.png`,
      fullPage: true,
    })
  })

  test("nav bar rendering", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const nav = page.locator("nav")
    await nav.screenshot({ path: `${screenshotDir}/04-nav-desktop.png` })

    await page.setViewportSize({ width: 375, height: 812 })
    await nav.screenshot({ path: `${screenshotDir}/05-nav-mobile.png` })
  })

  test("hero section rendering", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const hero = page.locator("section").first()
    await hero.screenshot({ path: `${screenshotDir}/06-hero-desktop.png` })

    await page.setViewportSize({ width: 375, height: 812 })
    await hero.screenshot({ path: `${screenshotDir}/07-hero-mobile.png` })
  })

  test("stat cards grid — desktop vs mobile", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const statsSection = page.locator("section").nth(1)
    await statsSection.screenshot({ path: `${screenshotDir}/08-stats-desktop.png` })

    await page.setViewportSize({ width: 375, height: 812 })
    await statsSection.screenshot({ path: `${screenshotDir}/09-stats-mobile.png` })
  })

  test("how it works cards", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const howSection = page.locator("#how-it-works")
    await howSection.screenshot({ path: `${screenshotDir}/10-howitworks-desktop.png` })

    await page.setViewportSize({ width: 375, height: 812 })
    await howSection.screenshot({ path: `${screenshotDir}/11-howitworks-mobile.png` })
  })

  test("final CTA card", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const cta = page.locator(".brutal-card-lg").first()
    await cta.screenshot({ path: `${screenshotDir}/12-cta-desktop.png` })

    await page.setViewportSize({ width: 375, height: 812 })
    await cta.screenshot({ path: `${screenshotDir}/13-cta-mobile.png` })
  })

  test("footer rendering", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const footer = page.locator("footer")
    await footer.screenshot({ path: `${screenshotDir}/14-footer-desktop.png` })

    await page.setViewportSize({ width: 375, height: 812 })
    await footer.screenshot({ path: `${screenshotDir}/15-footer-mobile.png` })
  })

  test("button hover states", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const checkBtn = page.locator("a", { hasText: "CHECK NOW" }).first()
    await checkBtn.screenshot({ path: `${screenshotDir}/16-btn-check-default.png` })
    await checkBtn.hover()
    await page.waitForTimeout(200)
    await checkBtn.screenshot({ path: `${screenshotDir}/17-btn-check-hover.png` })
  })

  test("highlight text rendering", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const pinkHighlight = page.locator(".highlight-pink").first()
    await pinkHighlight.screenshot({ path: `${screenshotDir}/18-highlight-pink.png` })
    const yellowHighlight = page.locator(".highlight-yellow").first()
    await yellowHighlight.screenshot({ path: `${screenshotDir}/19-highlight-yellow.png` })
  })

  test("font rendering — Space Mono headings vs DM Sans body", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })

    // Check h1 font
    const h1Font = await page.locator("h1").evaluate(
      (el) => getComputedStyle(el).fontFamily
    )
    expect(h1Font).toContain("Space Mono")

    // Check body text font (target a font-sans paragraph, not the deadline banner)
    const bodyFont = await page.locator(".brutal-card p").first().evaluate(
      (el) => getComputedStyle(el).fontFamily
    )
    expect(bodyFont).toContain("DM Sans")

    // Screenshot heading for visual inspection
    await page.locator("h1").screenshot({ path: `${screenshotDir}/20-font-h1-spacemono.png` })
    // Screenshot body text
    const bodyP = page.locator(".brutal-card p").first()
    await bodyP.screenshot({ path: `${screenshotDir}/21-font-body-dmsans.png` })
  })

  test("gradient blob visibility", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    // Screenshot top-left area where purple blob should be
    await page.screenshot({
      path: `${screenshotDir}/22-blob-area.png`,
      clip: { x: 0, y: 0, width: 600, height: 600 },
    })
  })
})

test.describe("Visual UI — Quiz Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/quiz")
    await page.waitForLoadState("networkidle")
  })

  test("Step 1 full view — desktop + mobile", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.screenshot({
      path: `${screenshotDir}/23-quiz-step1-desktop.png`,
      fullPage: true,
    })

    await page.setViewportSize({ width: 375, height: 812 })
    await page.screenshot({
      path: `${screenshotDir}/24-quiz-step1-mobile.png`,
      fullPage: true,
    })
  })

  test("progress bar rendering", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const progressBar = page.locator(".progress-bar-brutal")
    await progressBar.screenshot({ path: `${screenshotDir}/25-progress-bar.png` })
  })

  test("year dropdown styling", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const selectEl = page.locator("select").first()
    await selectEl.screenshot({ path: `${screenshotDir}/26-year-dropdown.png` })
  })

  test("status buttons — default vs selected", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    // Screenshot button grid before selection
    const statusGrid = page.locator(".grid.grid-cols-2").first()
    await statusGrid.screenshot({ path: `${screenshotDir}/27-status-btns-default.png` })

    // Select H1B
    await page.locator("button", { hasText: "H1B" }).click()
    await statusGrid.screenshot({ path: `${screenshotDir}/28-status-btns-selected.png` })
  })

  test("Step 2 asset grid — desktop + mobile", async ({ page }) => {
    // Navigate to step 2
    await page.locator("[data-testid='year-select']").selectOption("2018")
    await page.locator("button", { hasText: "H1B" }).click()
    await page.locator("button", { hasText: "Single" }).click()
    await page.locator("[data-testid='state-select']").selectOption("TX")
    await page.locator("button", { hasText: "NEXT" }).click()

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.screenshot({
      path: `${screenshotDir}/29-quiz-step2-desktop.png`,
      fullPage: true,
    })

    await page.setViewportSize({ width: 375, height: 812 })
    await page.screenshot({
      path: `${screenshotDir}/30-quiz-step2-mobile.png`,
      fullPage: true,
    })
  })

  test("Step 2 asset buttons — selected state", async ({ page }) => {
    await page.locator("[data-testid='year-select']").selectOption("2018")
    await page.locator("button", { hasText: "H1B" }).click()
    await page.locator("button", { hasText: "Single" }).click()
    await page.locator("[data-testid='state-select']").selectOption("TX")
    await page.locator("button", { hasText: "NEXT" }).click()

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.locator("button", { hasText: "Bank Accounts" }).click()
    await page.locator("button", { hasText: "Property" }).click()
    await page.locator("button", { hasText: "Mutual Funds" }).click()

    const grid = page.locator(".grid.grid-cols-2.md\\:grid-cols-3")
    await grid.screenshot({ path: `${screenshotDir}/31-assets-selected.png` })
  })

  test("Step 3 amount dropdowns", async ({ page }) => {
    await page.locator("[data-testid='year-select']").selectOption("2018")
    await page.locator("button", { hasText: "H1B" }).click()
    await page.locator("button", { hasText: "Single" }).click()
    await page.locator("[data-testid='state-select']").selectOption("TX")
    await page.locator("button", { hasText: "NEXT" }).click()
    await page.locator("button", { hasText: "Bank Accounts" }).click()
    await page.locator("button", { hasText: "Property" }).click()
    await page.locator("button", { hasText: "NEXT" }).click()

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.screenshot({
      path: `${screenshotDir}/32-quiz-step3-desktop.png`,
      fullPage: true,
    })
  })

  test("Step 4 income buttons", async ({ page }) => {
    await page.locator("[data-testid='year-select']").selectOption("2018")
    await page.locator("button", { hasText: "H1B" }).click()
    await page.locator("button", { hasText: "Single" }).click()
    await page.locator("[data-testid='state-select']").selectOption("TX")
    await page.locator("button", { hasText: "NEXT" }).click()
    await page.locator("button", { hasText: "Bank Accounts" }).click()
    await page.locator("button", { hasText: "NEXT" }).click()
    await page.locator("button", { hasText: "NEXT" }).click()

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.screenshot({
      path: `${screenshotDir}/33-quiz-step4-desktop.png`,
      fullPage: true,
    })

    // Select some income types
    await page.locator("button", { hasText: "Rental income" }).click()
    await page.locator("button", { hasText: "Interest income" }).click()
    await page.screenshot({
      path: `${screenshotDir}/34-quiz-step4-with-amounts.png`,
      fullPage: true,
    })
  })

  test("Step 5 one-per-screen doc check", async ({ page }) => {
    await page.locator("[data-testid='year-select']").selectOption("2018")
    await page.locator("button", { hasText: "H1B" }).click()
    await page.locator("button", { hasText: "Single" }).click()
    await page.locator("[data-testid='state-select']").selectOption("TX")
    await page.locator("button", { hasText: "NEXT" }).click()
    await page.locator("button", { hasText: "Bank Accounts" }).click()
    await page.locator("button", { hasText: "NEXT" }).click()
    await page.locator("button", { hasText: "NEXT" }).click()
    await page.locator("button", { hasText: "None of the above" }).click()
    await page.locator("button", { hasText: "NEXT" }).click()

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.screenshot({
      path: `${screenshotDir}/35-quiz-step5-default.png`,
      fullPage: true,
    })

    // Click YES on first question
    await page.locator("button", { hasText: "YES" }).click()
    await page.screenshot({
      path: `${screenshotDir}/36-quiz-step5-yes-selected.png`,
      fullPage: true,
    })
  })

  test("navigation buttons styling", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    // Step 1: only NEXT (no BACK)
    const navArea = page.locator(".flex.justify-between.mt-8")
    await navArea.screenshot({ path: `${screenshotDir}/37-nav-step1-next-only.png` })

    // Go to step 2: both BACK and NEXT
    await page.locator("[data-testid='year-select']").selectOption("2018")
    await page.locator("button", { hasText: "H1B" }).click()
    await page.locator("button", { hasText: "Single" }).click()
    await page.locator("[data-testid='state-select']").selectOption("TX")
    await page.locator("button", { hasText: "NEXT" }).click()
    await navArea.screenshot({ path: `${screenshotDir}/38-nav-step2-back-and-next.png` })
  })
})

test.describe("Visual UI — Results Page", () => {
  async function seedAndGo(
    page: import("@playwright/test").Page,
    overrides: Record<string, unknown> = {}
  ) {
    const defaults = {
      yearLeftIndia: "2015",
      usStatus: "Green Card",
      filingStatus: "Married Filing Jointly",
      usState: "CA",
      assets: ["bank_accounts", "mutual_funds", "property", "life_insurance", "ppf"],
      assetAmounts: { bank_accounts: "over_100k", mutual_funds: "50k_100k" },
      incomeTypes: ["rental", "interest"],
      incomeAmounts: {},
      hasPAN: "yes",
      panLinkedAadhaar: "no",
      hasAadhaar: "yes",
      hasOCI: "no",
      ociUpdatedAfterPassportRenewal: "",
      surrenderedIndianPassport: "",
      filedIndianITR: "no",
      filedFBAR: "no",
      filedFATCA: "no",
      reportedPFICs: "no",
      updatedBankKYC: "no",
      convertedToNRO: "no",
    }
    await page.goto("/quiz")
    await page.evaluate(
      (d) => localStorage.setItem("alertdoc_quiz", JSON.stringify(d)),
      { ...defaults, ...overrides }
    )
    await page.goto("/results")
    await page.waitForLoadState("networkidle")
  }

  test("full results — critical score — desktop", async ({ page }) => {
    await seedAndGo(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.screenshot({
      path: `${screenshotDir}/39-results-critical-desktop.png`,
      fullPage: true,
    })
  })

  test("full results — critical score — mobile", async ({ page }) => {
    await seedAndGo(page)
    await page.setViewportSize({ width: 375, height: 812 })
    await page.screenshot({
      path: `${screenshotDir}/40-results-critical-mobile.png`,
      fullPage: true,
    })
  })

  test("score circle rendering", async ({ page }) => {
    await seedAndGo(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    const circle = page.locator(".score-circle")
    await circle.screenshot({ path: `${screenshotDir}/41-score-circle-critical.png` })

    // High score version
    await seedAndGo(page, {
      assets: ["bank_accounts"],
      assetAmounts: { bank_accounts: "under_5k" },
      incomeTypes: ["none"],
      hasPAN: "yes",
      panLinkedAadhaar: "yes",
      filedIndianITR: "yes",
      filedFBAR: "yes",
      filedFATCA: "yes",
      reportedPFICs: "yes",
      updatedBankKYC: "yes",
      convertedToNRO: "yes",
      hasOCI: "yes",
      ociUpdatedAfterPassportRenewal: "yes",
      hasAadhaar: "yes",
    })
    await circle.screenshot({ path: `${screenshotDir}/42-score-circle-good.png` })
  })

  test("money at risk banner", async ({ page }) => {
    await seedAndGo(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    const scoreSection = page.locator(".brutal-card-lg").first()
    await scoreSection.screenshot({ path: `${screenshotDir}/43-score-section-with-risk.png` })
  })

  test("severity badges rendering", async ({ page }) => {
    await seedAndGo(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    const urgent = page.locator(".badge-urgent").first()
    await urgent.screenshot({ path: `${screenshotDir}/44-badge-urgent.png` })
    const warning = page.locator(".badge-warning").first()
    await warning.screenshot({ path: `${screenshotDir}/45-badge-warning.png` })
  })

  test("issue card — collapsed", async ({ page }) => {
    await seedAndGo(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    // First issue card
    const cards = page.locator(".brutal-card").filter({
      has: page.locator(".badge-urgent, .badge-warning, .badge-info"),
    })
    await cards.first().screenshot({ path: `${screenshotDir}/46-issue-card-collapsed.png` })
  })

  test("issue card — expanded with fix steps", async ({ page }) => {
    await seedAndGo(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    // Expand first card
    await page.locator("button", { hasText: "HOW TO FIX" }).first().click()
    const cards = page.locator(".brutal-card").filter({
      has: page.locator(".badge-urgent, .badge-warning, .badge-info"),
    })
    await cards.first().screenshot({ path: `${screenshotDir}/47-issue-card-expanded.png` })
  })

  test("why-applies and consequence boxes", async ({ page }) => {
    await seedAndGo(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    // Yellow "why this applies" box
    const whyBox = page.locator(".why-applies-box").first()
    await whyBox.screenshot({ path: `${screenshotDir}/48-why-applies-box.png` })
    // Red consequence box
    const redBox = page.locator(".consequence-box").first()
    await redBox.screenshot({ path: `${screenshotDir}/49-consequence-box.png` })
  })

  test("email capture section", async ({ page }) => {
    await seedAndGo(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    const emailSection = page.locator("form", { hasText: "SEND MY REPORT" }).locator("..")
    await emailSection.screenshot({ path: `${screenshotDir}/50-email-capture.png` })

    await page.setViewportSize({ width: 375, height: 812 })
    await emailSection.screenshot({ path: `${screenshotDir}/51-email-capture-mobile.png` })
  })

  test("share buttons section", async ({ page }) => {
    await seedAndGo(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    const shareSection = page
      .locator(".brutal-card")
      .filter({ hasText: "Think your NRI friends" })
    await shareSection.screenshot({ path: `${screenshotDir}/52-share-buttons.png` })
  })

  test("waitlist CTA section", async ({ page }) => {
    await seedAndGo(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    const waitlist = page
      .locator(".brutal-card-lg")
      .filter({ hasText: "Get ongoing protection" })
    await waitlist.screenshot({ path: `${screenshotDir}/53-waitlist-cta.png` })
  })

  test("empty state — no quiz data", async ({ page }) => {
    await page.goto("/results")
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.screenshot({
      path: `${screenshotDir}/54-results-empty-state.png`,
      fullPage: true,
    })
  })
})
