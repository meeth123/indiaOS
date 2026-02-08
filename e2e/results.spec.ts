import { test, expect } from "@playwright/test"

// Helper to seed quiz data into localStorage
async function seedQuizData(
  page: import("@playwright/test").Page,
  overrides: Record<string, unknown> = {}
) {
  const defaults = {
    yearLeftIndia: "2018",
    usStatus: "H1B",
    filingStatus: "Single",
    usState: "TX",
    assets: ["bank_accounts"],
    assetAmounts: { bank_accounts: "10k_50k" },
    incomeTypes: ["none"],
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
    reportedPFICs: "yes",
    updatedBankKYC: "no",
    convertedToNRO: "no",
  }
  const data = { ...defaults, ...overrides }
  await page.goto("/quiz")
  await page.evaluate(
    (d) => localStorage.setItem("indiaos_quiz", JSON.stringify(d)),
    data
  )
  await page.goto("/results")
}

test.describe("Results Page", () => {
  test("shows 'No quiz data found' without quiz data", async ({ page }) => {
    await page.goto("/results")
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await expect(page.getByText("No quiz data found")).toBeVisible()
    await expect(
      page.locator("a", { hasText: "TAKE THE QUIZ" })
    ).toBeVisible()
  })

  test("TAKE THE QUIZ navigates to /quiz", async ({ page }) => {
    await page.goto("/results")
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.locator("a", { hasText: "TAKE THE QUIZ" }).click()
    await expect(page).toHaveURL("/quiz")
  })

  test("shows score circle with seeded data", async ({ page }) => {
    await seedQuizData(page)
    await expect(page.locator(".score-circle")).toBeVisible()
    const scoreText = await page
      .locator(".score-circle .score-number")
      .textContent()
    expect(parseInt(scoreText || "")).not.toBeNaN()
  })

  test("email capture form works", async ({ page }) => {
    await seedQuizData(page)

    // Mock the API route
    await page.route("**/api/report", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, reportId: "test-id" }),
      })
    })

    const emailInput = page.locator('input[type="email"]')
    await emailInput.fill("test@example.com")
    await page.locator("button", { hasText: "SEND MY REPORT" }).click()
    await expect(page.getByText("Report sent! Check your email for the PDF.")).toBeVisible()
  })

  test("issue cards expand and collapse fix steps", async ({ page }) => {
    await seedQuizData(page)

    // Expand first fix
    const fixBtn = page
      .locator("button", { hasText: "HOW TO FIX" })
      .first()
    await fixBtn.click()
    await expect(page.locator("ol.list-decimal").first()).toBeVisible()

    // Collapse
    await page
      .locator("button", { hasText: "HIDE FIX STEPS" })
      .first()
      .click()
    await expect(page.locator("ol.list-decimal")).not.toBeVisible()
  })

  test("share buttons are visible", async ({ page }) => {
    await seedQuizData(page)
    await expect(
      page.locator("button", { hasText: "TWITTER / X" })
    ).toBeVisible()
    await expect(
      page.locator("button", { hasText: "LINKEDIN" })
    ).toBeVisible()
    await expect(
      page.locator("button", { hasText: "WHATSAPP" })
    ).toBeVisible()
    await expect(
      page.locator("button", { hasText: "COPY LINK" })
    ).toBeVisible()
  })

  test("RETAKE QUIZ links to /quiz", async ({ page }) => {
    await seedQuizData(page)
    const retake = page.locator("a", { hasText: "RETAKE QUIZ" })
    await expect(retake).toBeVisible()
    await expect(retake).toHaveAttribute("href", "/quiz")
  })

  test("waitlist CTA shows pricing", async ({ page }) => {
    await seedQuizData(page)
    await expect(page.getByText("$9.99/mo")).toBeVisible()
    await expect(
      page.locator("button", { hasText: "JOIN WAITLIST" })
    ).toBeVisible()
  })

  test("severity badges render with correct styling", async ({ page }) => {
    await seedQuizData(page, {
      filedFBAR: "no",
      filedFATCA: "no",
      filedIndianITR: "no",
      panLinkedAadhaar: "no",
      convertedToNRO: "no",
    })

    // Should have urgent badges
    const urgent = page.locator(".badge-urgent").first()
    await expect(urgent).toBeVisible()
    const bg = await urgent.evaluate((el) => getComputedStyle(el).backgroundColor)
    // Red background
    expect(bg).toContain("239")
  })
})
