import { test, expect } from "@playwright/test"

test.describe("Quiz Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/quiz")
  })

  test("shows Step 1 of 5 initially", async ({ page }) => {
    await expect(page.getByText("STEP 1 OF 5")).toBeVisible()
    await expect(page.getByText("Your NRI Journey")).toBeVisible()
  })

  test("progress bar starts at 20%", async ({ page }) => {
    const fill = page.locator(".progress-fill")
    await expect(fill).toBeVisible()
    const width = await fill.evaluate((el) => el.style.width)
    expect(width).toBe("20%")
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
    await expect(page.getByText("STEP 2 OF 5")).toBeVisible()
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

    await expect(page.getByText("STEP 3 OF 5")).toBeVisible()
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

    await expect(page.getByText("STEP 4 OF 5")).toBeVisible()

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

  test("Step 5: tri-state buttons work (Yes/No/Not Sure)", async ({ page }) => {
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

    // Find first Yes button and click it
    const firstYes = page.locator(".tri-state-btn").filter({ hasText: "Yes" }).first()
    await firstYes.click()
    expect(
      await firstYes.evaluate((el) => el.classList.contains("active-yes"))
    ).toBe(true)

    // Click No on same row
    const firstNo = page.locator(".tri-state-btn").filter({ hasText: "No" }).first()
    await firstNo.click()
    expect(
      await firstNo.evaluate((el) => el.classList.contains("active-no"))
    ).toBe(true)
  })

  test("BACK button returns to previous step", async ({ page }) => {
    await page.locator("[data-testid='year-select']").selectOption("2018")
    await page.locator("button", { hasText: "H1B" }).click()
    await page.locator("button", { hasText: "Single" }).click()
    await page.locator("[data-testid='state-select']").selectOption("TX")
    await page.locator("button", { hasText: "NEXT" }).click()
    await expect(page.getByText("STEP 2 OF 5")).toBeVisible()

    await page.locator("button", { hasText: "BACK" }).click()
    await expect(page.getByText("STEP 1 OF 5")).toBeVisible()
  })

  test("INDIAOS logo links back to home", async ({ page }) => {
    await page.locator("nav").getByText("INDIAOS").click()
    await expect(page).toHaveURL("/")
  })

  test("progress bar updates on each step", async ({ page }) => {
    const fill = page.locator(".progress-fill")

    // Step 1: 20%
    expect(await fill.evaluate((el) => el.style.width)).toBe("20%")

    // Go to step 2: 40%
    await page.locator("[data-testid='year-select']").selectOption("2018")
    await page.locator("button", { hasText: "H1B" }).click()
    await page.locator("button", { hasText: "Single" }).click()
    await page.locator("[data-testid='state-select']").selectOption("TX")
    await page.locator("button", { hasText: "NEXT" }).click()
    expect(await fill.evaluate((el) => el.style.width)).toBe("40%")
  })

  test("Step 5: OCI questions only show for US Citizens", async ({ page }) => {
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

    // H1B should NOT see OCI or passport surrender questions
    await expect(page.getByText("I have an OCI card")).not.toBeVisible()
    await expect(page.getByText("I've surrendered my Indian passport")).not.toBeVisible()
  })
})
