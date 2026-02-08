import { test, expect } from "@playwright/test"

test.describe("Quiz Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/quiz")
  })

  test("shows Step 1 of N initially", async ({ page }) => {
    await expect(page.getByText(/STEP 1 OF \d+/)).toBeVisible()
    await expect(page.getByText("Your NRI Journey")).toBeVisible()
  })

  test("progress bar starts at correct percentage", async ({ page }) => {
    const fill = page.locator(".progress-fill")
    await expect(fill).toBeVisible()
    const width = await fill.evaluate((el) => el.style.width)
    // Step 1 of N: width should be a valid percentage
    expect(parseFloat(width)).toBeGreaterThan(0)
  })

  test("NEXT is disabled until required fields filled", async ({ page }) => {
    const nextBtn = page.locator("button", { hasText: "NEXT" })
    await expect(nextBtn).toBeDisabled()
  })

  test("complete Step 1 and advance to Step 2", async ({ page }) => {
    await page.locator("[data-testid='year-select']").selectOption("2018")
    await page.locator("button", { hasText: "H1B" }).click()
    await page.locator("button", { hasText: "Single" }).click()
    await page.locator("[data-testid='state-select']").selectOption("TX")
    await page.locator("button", { hasText: "NEXT" }).click()
    await expect(page.getByText("STEP 2 OF")).toBeVisible()
    await expect(page.getByText("Your India Footprint")).toBeVisible()
  })

  test("Step 2: assets toggle on and off", async ({ page }) => {
    // Complete step 1
    await page.locator("[data-testid='year-select']").selectOption("2018")
    await page.locator("button", { hasText: "H1B" }).click()
    await page.locator("button", { hasText: "Single" }).click()
    await page.locator("[data-testid='state-select']").selectOption("TX")
    await page.locator("button", { hasText: "NEXT" }).click()

    const bankBtn = page.locator("button", { hasText: "Bank Accounts" })

    // Select
    await bankBtn.click()
    expect(
      await bankBtn.evaluate((el) => el.classList.contains("brutal-btn-yellow"))
    ).toBe(true)

    // Deselect
    await bankBtn.click()
    expect(
      await bankBtn.evaluate((el) => el.classList.contains("brutal-btn-yellow"))
    ).toBe(false)
  })

  test("Step 3: shows amount dropdowns for selected assets", async ({ page }) => {
    await page.locator("[data-testid='year-select']").selectOption("2018")
    await page.locator("button", { hasText: "H1B" }).click()
    await page.locator("button", { hasText: "Single" }).click()
    await page.locator("[data-testid='state-select']").selectOption("TX")
    await page.locator("button", { hasText: "NEXT" }).click()

    await page.locator("button", { hasText: "Bank Accounts" }).click()
    await page.locator("button", { hasText: "Property" }).click()
    await page.locator("button", { hasText: "NEXT" }).click()

    await expect(page.getByText(/STEP 3 OF \d+/)).toBeVisible()
    await expect(page.getByText("Ballpark Amounts")).toBeVisible()
    // Should see 2 dropdowns for 2 selected assets
    const selects = page.locator("select")
    expect(await selects.count()).toBe(2)
  })

  test("Step 4: income types and None toggle correctly", async ({ page }) => {
    // Navigate to step 4
    await page.locator("[data-testid='year-select']").selectOption("2018")
    await page.locator("button", { hasText: "H1B" }).click()
    await page.locator("button", { hasText: "Single" }).click()
    await page.locator("[data-testid='state-select']").selectOption("TX")
    await page.locator("button", { hasText: "NEXT" }).click()
    await page.locator("button", { hasText: "Bank Accounts" }).click()
    await page.locator("button", { hasText: "NEXT" }).click()
    await page.locator("button", { hasText: "NEXT" }).click()

    await expect(page.getByText(/STEP 4 OF \d+/)).toBeVisible()

    // Select rental income
    await page.locator("button", { hasText: "Rental income" }).click()
    expect(
      await page
        .locator("button", { hasText: "Rental income" })
        .evaluate((el) => el.classList.contains("brutal-btn-yellow"))
    ).toBe(true)

    // Select "None" should deselect rental
    await page.locator("button", { hasText: "None of the above" }).click()
    expect(
      await page
        .locator("button", { hasText: "Rental income" })
        .evaluate((el) => el.classList.contains("brutal-btn-yellow"))
    ).toBe(false)
  })

  test("Step 5: one-per-screen auto-advances on click", async ({ page }) => {
    // Navigate to step 5
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

    await expect(page.getByText("Quick Document Check")).toBeVisible()
    await expect(page.getByText("Question 1 of")).toBeVisible()

    // Click YES — should auto-advance to question 2
    await page.getByRole("button", { name: "YES", exact: true }).click()
    await expect(page.getByText("Question 2 of")).toBeVisible()

    // Click NO on question 2 — should auto-advance to question 3
    await page.getByRole("button", { name: "NO", exact: true }).click()
    await expect(page.getByText("Question 3 of")).toBeVisible()
  })

  test("BACK button returns to previous step", async ({ page }) => {
    await page.locator("[data-testid='year-select']").selectOption("2018")
    await page.locator("button", { hasText: "H1B" }).click()
    await page.locator("button", { hasText: "Single" }).click()
    await page.locator("[data-testid='state-select']").selectOption("TX")
    await page.locator("button", { hasText: "NEXT" }).click()
    await expect(page.getByText("STEP 2 OF")).toBeVisible()

    await page.locator("button", { hasText: "BACK" }).click()
    await expect(page.getByText(/STEP 1 OF \d+/)).toBeVisible()
  })

  test("ALERTDOC logo links back to home", async ({ page }) => {
    await page.locator("nav").getByText("ALERTDOC").click()
    await expect(page).toHaveURL("/")
  })

  test("progress bar updates on each step", async ({ page }) => {
    const fill = page.locator(".progress-fill")

    // Step 1: should be a valid percentage > 0
    const step1Width = parseFloat(await fill.evaluate((el) => el.style.width))
    expect(step1Width).toBeGreaterThan(0)

    // Go to step 2: width should increase
    await page.locator("[data-testid='year-select']").selectOption("2018")
    await page.locator("button", { hasText: "H1B" }).click()
    await page.locator("button", { hasText: "Single" }).click()
    await page.locator("[data-testid='state-select']").selectOption("TX")
    await page.locator("button", { hasText: "NEXT" }).click()
    const step2Width = parseFloat(await fill.evaluate((el) => el.style.width))
    expect(step2Width).toBeGreaterThan(step1Width)
  })

  test("OCI questions do not appear for H1B users", async ({ page }) => {
    // Navigate to step 5 as H1B
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

    // Walk through all doc check steps — none should show OCI questions
    while (await page.getByText("Quick Document Check").isVisible()) {
      await expect(page.getByText("I have an OCI card")).not.toBeVisible()
      await expect(page.getByText("I've surrendered my Indian passport")).not.toBeVisible()
      // Click YES to auto-advance to next question
      await page.getByRole("button", { name: "YES", exact: true }).click()
      await page.waitForTimeout(100)
    }
  })
})
