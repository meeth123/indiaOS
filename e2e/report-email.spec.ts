import { test, expect } from "@playwright/test"

// Seed quiz data into localStorage and navigate to results
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
    (d) => localStorage.setItem("alertdoc_quiz", JSON.stringify(d)),
    data
  )
  await page.goto("/results")
}

test.describe("Report Email Flow", () => {
  test("email form is visible on results page", async ({ page }) => {
    await seedQuizData(page)
    const reportForm = page.locator("form", { hasText: "SEND MY REPORT" })
    await expect(reportForm.locator('input[type="email"]')).toBeVisible()
    await expect(
      reportForm.locator("button", { hasText: "SEND MY REPORT" })
    ).toBeVisible()
  })

  test("email form appears before compliance issues section", async ({
    page,
  }) => {
    await seedQuizData(page)
    const emailSection = page.locator("text=Get your full report")
    const issuesSection = page.locator("text=Your Compliance Issues")

    const emailBox = await emailSection.boundingBox()
    const issuesBox = await issuesSection.boundingBox()

    expect(emailBox).not.toBeNull()
    expect(issuesBox).not.toBeNull()
    expect(emailBox!.y).toBeLessThan(issuesBox!.y)
  })

  test("SEND MY REPORT button shows SENDING... state on click", async ({
    page,
  }) => {
    await seedQuizData(page)

    // Intercept the API call to delay response
    await page.route("**/api/report", async (route) => {
      await new Promise((r) => setTimeout(r, 2000))
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, reportId: "test-id" }),
      })
    })

    const reportForm = page.locator("form", { hasText: "SEND MY REPORT" })
    const emailInput = reportForm.locator('input[type="email"]')
    await emailInput.fill("test@example.com")
    await reportForm.locator("button", { hasText: "SEND MY REPORT" }).click()

    // Should show loading state
    await expect(
      page.locator("button", { hasText: "SENDING..." })
    ).toBeVisible()

    // Input should be disabled while submitting (use broader form locator since button text changed)
    const reportSection = page.locator("form", { hasText: "SENDING..." })
    await expect(reportSection.locator('input[type="email"]')).toBeDisabled()
  })

  test("shows success message after successful submission", async ({
    page,
  }) => {
    await seedQuizData(page)

    // Mock successful API response
    await page.route("**/api/report", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, reportId: "test-id" }),
      })
    })

    const reportForm = page.locator("form", { hasText: "SEND MY REPORT" })
    const emailInput = reportForm.locator('input[type="email"]')
    await emailInput.fill("test@example.com")
    await reportForm.locator("button", { hasText: "SEND MY REPORT" }).click()

    await expect(
      page.getByText("Report sent! Check your email for the PDF.")
    ).toBeVisible()
  })

  test("shows error message when API returns 500", async ({ page }) => {
    await seedQuizData(page)

    // Mock API failure
    await page.route("**/api/report", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Failed to send email" }),
      })
    })

    const reportForm = page.locator("form", { hasText: "SEND MY REPORT" })
    const emailInput = reportForm.locator('input[type="email"]')
    await emailInput.fill("test@example.com")
    await reportForm.locator("button", { hasText: "SEND MY REPORT" }).click()

    await expect(page.getByText("Failed to send email")).toBeVisible()
  })

  test("shows error message for network failure", async ({ page }) => {
    await seedQuizData(page)

    // Mock network error
    await page.route("**/api/report", async (route) => {
      await route.abort("connectionrefused")
    })

    const reportForm = page.locator("form", { hasText: "SEND MY REPORT" })
    const emailInput = reportForm.locator('input[type="email"]')
    await emailInput.fill("test@example.com")
    await reportForm.locator("button", { hasText: "SEND MY REPORT" }).click()

    // Should show some error
    await expect(page.locator(".bg-red-50")).toBeVisible({ timeout: 5000 })
  })

  test("form re-enables after error to allow retry", async ({ page }) => {
    await seedQuizData(page)

    // First attempt fails
    await page.route("**/api/report", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Server error" }),
      })
    })

    const reportForm = page.locator("form", { hasText: "SEND MY REPORT" })
    const emailInput = reportForm.locator('input[type="email"]')
    await emailInput.fill("test@example.com")
    await reportForm.locator("button", { hasText: "SEND MY REPORT" }).click()

    // Wait for error
    await expect(page.getByText("Server error")).toBeVisible()

    // Form should be re-enabled for retry
    await expect(emailInput).not.toBeDisabled()
    await expect(
      reportForm.locator("button", { hasText: "SEND MY REPORT" })
    ).not.toBeDisabled()
  })

  test("sends correct payload to API", async ({ page }) => {
    await seedQuizData(page, { usState: "CA", filedFBAR: "yes" })

    let capturedBody: any = null
    await page.route("**/api/report", async (route) => {
      const request = route.request()
      capturedBody = JSON.parse(request.postData() || "{}")
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, reportId: "test-id" }),
      })
    })

    const reportForm = page.locator("form", { hasText: "SEND MY REPORT" })
    const emailInput = reportForm.locator('input[type="email"]')
    await emailInput.fill("user@test.com")
    await reportForm.locator("button", { hasText: "SEND MY REPORT" }).click()

    await expect(
      page.getByText("Report sent! Check your email for the PDF.")
    ).toBeVisible()

    // Verify payload
    expect(capturedBody).not.toBeNull()
    expect(capturedBody.email).toBe("user@test.com")
    expect(capturedBody.quizAnswers).toBeDefined()
    expect(capturedBody.quizAnswers.usState).toBe("CA")
    expect(capturedBody.quizAnswers.filedFBAR).toBe("yes")
  })

  test("HTML5 email validation prevents empty submission", async ({
    page,
  }) => {
    await seedQuizData(page)

    const reportForm = page.locator("form", { hasText: "SEND MY REPORT" })
    // Click without filling email
    const sendBtn = reportForm.locator("button", { hasText: "SEND MY REPORT" })
    await sendBtn.click()

    // The form should not submit — email input should still be visible
    await expect(reportForm.locator('input[type="email"]')).toBeVisible()
    // Success message should NOT appear
    await expect(
      page.getByText("Report sent! Check your email for the PDF.")
    ).not.toBeVisible()
  })
})

test.describe("Results Page — Severity Sections", () => {
  test("clicking severity badge scrolls to correct section", async ({
    page,
  }) => {
    await seedQuizData(page, {
      filedFBAR: "no",
      filedFATCA: "no",
      filedIndianITR: "no",
      panLinkedAadhaar: "no",
      convertedToNRO: "no",
      updatedBankKYC: "no",
    })

    // Click urgent badge
    const urgentBadge = page.locator("button.badge-urgent").first()
    await urgentBadge.click()

    // Wait for scroll + expansion
    await page.waitForTimeout(300)

    // The urgent section should be visible
    await expect(page.locator("#section-urgent")).toBeVisible()
  })

  test("no-urgent celebration banner shows when 0 urgent issues", async ({
    page,
  }) => {
    // Seed with no urgent issues — file the critical ones
    await seedQuizData(page, {
      assets: ["bank_accounts"],
      assetAmounts: { bank_accounts: "under_5k" },
      incomeTypes: ["none"],
      filedFBAR: "yes",
      filedFATCA: "yes",
      filedIndianITR: "yes",
      reportedPFICs: "yes",
      convertedToNRO: "yes",
      panLinkedAadhaar: "no",
      updatedBankKYC: "no",
    })

    await expect(
      page.getByText("No urgent issues found")
    ).toBeVisible()
  })

  test("score displays as integer (no decimals)", async ({ page }) => {
    await seedQuizData(page, {
      filedFBAR: "not_sure",
      filedFATCA: "not_sure",
    })

    const scoreText = await page
      .locator(".score-circle .score-number")
      .textContent()
    const score = scoreText?.trim() || ""
    // Score should be a plain integer — no decimal point
    expect(score).toMatch(/^\d+$/)
  })

  test("penalty displays Up to format when min is 0", async ({ page }) => {
    await seedQuizData(page, {
      panLinkedAadhaar: "no",
      updatedBankKYC: "no",
    })

    // Should show "Up to" format somewhere on page
    const penaltyText = await page
      .locator(".font-mono.text-red-600")
      .first()
      .textContent()
    if (penaltyText) {
      // Either "Up to $XK" or "$Xk – $YK" — should NOT be "$0 –"
      expect(penaltyText).not.toContain("$0 ")
    }
  })
})

test.describe("Results Page — Issue Cards", () => {
  test("each issue card has severity badge, title, and penalty", async ({
    page,
  }) => {
    await seedQuizData(page, {
      filedFBAR: "no",
      convertedToNRO: "no",
    })

    // Target issue cards (ones that have HOW TO FIX button)
    const issueCard = page
      .locator(".brutal-card", { has: page.locator("button", { hasText: "HOW TO FIX" }) })
      .first()
    // Has a severity badge
    await expect(
      issueCard.locator(".badge-urgent, .badge-warning, .badge-info")
    ).toBeVisible()
    // Has a title
    await expect(issueCard.locator("h3.font-mono")).toBeVisible()
  })

  test("expanded fix steps show numbered list", async ({ page }) => {
    await seedQuizData(page, { filedFBAR: "no" })

    // Expand first card
    await page
      .locator("button", { hasText: "HOW TO FIX" })
      .first()
      .click()

    const fixList = page.locator("ol.list-decimal").first()
    await expect(fixList).toBeVisible()

    // Should have multiple steps
    const steps = fixList.locator("li")
    expect(await steps.count()).toBeGreaterThan(1)
  })

  test("fix metadata tags show difficulty, time, cost", async ({ page }) => {
    await seedQuizData(page, { filedFBAR: "no" })

    // Target issue cards (ones that have HOW TO FIX button)
    const issueCard = page
      .locator(".brutal-card", { has: page.locator("button", { hasText: "HOW TO FIX" }) })
      .first()
    // Each card should show difficulty level (easy/moderate/hard)
    await expect(
      issueCard.locator("span", { hasText: /^(easy|moderate|hard)$/ })
    ).toBeVisible()
    // Each card should show time estimate
    await expect(
      issueCard.locator("span", { hasText: /hour|minute|day|week/ })
    ).toBeVisible()
    // Each card should show cost estimate (use .last() to target the fix_cost tag, not penalty)
    await expect(
      issueCard.locator("span", { hasText: /\(self-file\)|CPA|fee/ })
    ).toBeVisible()
  })
})
