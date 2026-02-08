import { test, expect } from "@playwright/test"

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("renders hero headline", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("You left India")
    await expect(page.locator("h1")).toContainText("India didn't leave")
  })

  test("renders INDIAOS logo in nav", async ({ page }) => {
    await expect(page.locator("nav").getByText("INDIAOS")).toBeVisible()
  })

  test("CHECK NOW button links to /quiz", async ({ page }) => {
    const btn = page.locator("a", { hasText: "CHECK NOW" }).first()
    await expect(btn).toBeVisible()
    await expect(btn).toHaveAttribute("href", "/quiz")
  })

  test("renders 4 stat cards", async ({ page }) => {
    await expect(page.getByText("$10,000+")).toBeVisible()
    await expect(page.getByText("100 Million")).toBeVisible()
    await expect(page.getByText("$25,000+")).toBeVisible()
    await expect(page.getByText("4.4 Million")).toBeVisible()
  })

  test("renders How It Works with 3 steps", async ({ page }) => {
    await expect(page.getByText("Answer 5 questions")).toBeVisible()
    await expect(page.getByText("Get your score")).toBeVisible()
    await expect(page.getByText("Fix what matters")).toBeVisible()
  })

  test("renders footer with disclaimer", async ({ page }) => {
    await expect(page.getByText("Built by NRIs, for NRIs.")).toBeVisible()
    await expect(page.getByText("Not legal or tax advice")).toBeVisible()
  })

  test("CHECK NOW navigates to quiz page", async ({ page }) => {
    await page.locator("a", { hasText: "CHECK NOW" }).first().click()
    await expect(page).toHaveURL("/quiz")
  })

  test("neo-brutalist: cards have thick borders and offset shadows", async ({ page }) => {
    const card = page.locator(".brutal-card").first()
    await expect(card).toBeVisible()
    const shadow = await card.evaluate((el) => getComputedStyle(el).boxShadow)
    expect(shadow).not.toBe("none")
  })

  test("dotted grid background on body", async ({ page }) => {
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundImage)
    expect(bg).toContain("radial-gradient")
  })
})
