import { test, expect } from "@playwright/test"

test.describe("Full Quiz Flow -> Results", () => {
  test("non-compliant NRI gets critical score", async ({ page }) => {
    await page.goto("/quiz")
    await page.waitForLoadState("networkidle")

    // Step 1
    await page.locator("[data-testid='year-select']").selectOption("2015")
    const greenCardBtn = page.locator("button", { hasText: "Green Card" })
    await greenCardBtn.click()
    await expect(greenCardBtn).toHaveClass(/brutal-btn-yellow/, { timeout: 10000 })
    await page.locator("button", { hasText: "Married Filing Jointly" }).click()
    await page.locator("[data-testid='state-select']").selectOption("CA")
    await page.locator("button", { hasText: "NEXT" }).click()

    // Step 2: multiple assets
    await page.locator("button", { hasText: "Bank Accounts" }).click()
    await page.locator("button", { hasText: "Mutual Funds" }).click()
    await page.locator("button", { hasText: "Property" }).click()
    await page.locator("button", { hasText: "Life Insurance" }).click()
    await page.locator("button", { hasText: "PPF" }).click()
    await page.locator("button", { hasText: "NEXT" }).click()

    // Step 3: high amounts
    const selects = page.locator("select")
    const count = await selects.count()
    for (let i = 0; i < count; i++) {
      await selects.nth(i).selectOption("over_100k")
    }
    await page.locator("button", { hasText: "NEXT" }).click()

    // Step 4: multiple income
    await page.locator("button", { hasText: "Rental income" }).click()
    await page.locator("button", { hasText: "Interest income" }).click()
    await page.locator("button", { hasText: "NEXT" }).click()

    // Step 5: all No
    const noBtns = page.locator(".tri-state-btn").filter({ hasText: "No" })
    const noBtnCount = await noBtns.count()
    for (let i = 0; i < noBtnCount; i++) {
      await noBtns.nth(i).click()
    }

    await page.locator("button", { hasText: "SHOW MY SCORE" }).click()

    // Verify results page
    await expect(page).toHaveURL("/results")
    await expect(page.locator(".score-circle")).toBeVisible()

    const scoreText = await page
      .locator(".score-circle .score-number")
      .textContent()
    const score = parseInt(scoreText || "100")
    expect(score).toBeLessThan(30)

    // Should show URGENT badges
    await expect(page.locator(".badge-urgent").first()).toBeVisible()

    // Should show money at risk
    await expect(page.getByText("Potential Money at Risk")).toBeVisible()

    // Multiple issue cards
    const issueCards = page.locator(".brutal-card").filter({
      has: page.locator(".badge-urgent, .badge-warning, .badge-info"),
    })
    expect(await issueCards.count()).toBeGreaterThan(3)
  })

  test("compliant NRI gets high score", async ({ page }) => {
    await page.goto("/quiz")

    // Step 1
    await page.locator("[data-testid='year-select']").selectOption("2020")
    await page.locator("button", { hasText: "H1B" }).click()
    await page.locator("button", { hasText: "Single" }).click()
    await page.locator("[data-testid='state-select']").selectOption("TX")
    await page.locator("button", { hasText: "NEXT" }).click()

    // Step 2: just bank accounts
    await page.locator("button", { hasText: "Bank Accounts" }).click()
    await page.locator("button", { hasText: "NEXT" }).click()

    // Step 3: small amount
    await page.selectOption("select", "under_5k")
    await page.locator("button", { hasText: "NEXT" }).click()

    // Step 4: no income
    await page.locator("button", { hasText: "None of the above" }).click()
    await page.locator("button", { hasText: "NEXT" }).click()

    // Step 5: all Yes
    const yesBtns = page.locator(".tri-state-btn").filter({ hasText: "Yes" })
    const count = await yesBtns.count()
    for (let i = 0; i < count; i++) {
      await yesBtns.nth(i).click()
    }

    await page.locator("button", { hasText: "SHOW MY SCORE" }).click()
    await expect(page).toHaveURL("/results")

    const scoreText = await page
      .locator(".score-circle .score-number")
      .textContent()
    const score = parseInt(scoreText || "0")
    expect(score).toBeGreaterThanOrEqual(70)
  })
})
