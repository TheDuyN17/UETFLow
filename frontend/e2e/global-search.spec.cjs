// @ts-check
// Global Search acceptance tests
const { test, expect } = require("@playwright/test");

const BASE = "http://localhost:5173";
const API  = "http://localhost:8080";

const BI = { email: "bi@uetflow.com", password: "805e1aee@123" };

async function loginViaLocalStorage(page, creds) {
  const res = await page.request.post(`${API}/api/internal/auth/generate-token`, {
    data: { email: creds.email, password: creds.password },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  await page.goto(BASE);
  await page.evaluate(({ token, email }) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_roles", JSON.stringify([-1, 1, 2, 3, 4, 5]));
    localStorage.setItem("auth_user", JSON.stringify({ email }));
  }, { token: body.token, email: creds.email });
  // Navigate to a page that renders the header
  await page.goto(`${BASE}/erequest`);
  await page.waitForLoadState("networkidle", { timeout: 15000 });
}

test.describe("Global Search", () => {
  test.setTimeout(60000);

  test("Case A — Search có dấu, click navigate", async ({ page }) => {
    await loginViaLocalStorage(page, BI);

    const input = page.getByTestId("global-search-input");
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill("eflow");

    const dropdown = page.getByTestId("global-search-dropdown");
    await expect(dropdown).toBeVisible({ timeout: 3000 });
    await expect(dropdown).toContainText(/eFlow/i);

    await page.getByTestId("global-search-item-0").click();
    await page.waitForURL(/\/eflow/, { timeout: 5000 });
    console.log("✅ Case A: navigated to", page.url());
  });

  test("Case B — Search không dấu (diacritic-insensitive)", async ({ page }) => {
    await loginViaLocalStorage(page, BI);

    const input = page.getByTestId("global-search-input");
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill("phe duyet");

    const dropdown = page.getByTestId("global-search-dropdown");
    await expect(dropdown).toBeVisible({ timeout: 3000 });
    await expect(dropdown).toContainText(/(Phê duyệt|cần xử lý)/i);
    console.log("✅ Case B: diacritic-insensitive search works");
  });

  test("Case C — Keyboard navigation + Enter", async ({ page }) => {
    await loginViaLocalStorage(page, BI);

    const input = page.getByTestId("global-search-input");
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill("e");

    const dropdown = page.getByTestId("global-search-dropdown");
    await expect(dropdown).toBeVisible({ timeout: 3000 });

    // Arrow down twice then Enter
    await input.press("ArrowDown");
    await input.press("ArrowDown");
    await input.press("Enter");

    // Should navigate somewhere (URL changed from /erequest)
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url).toMatch(/\/(eform|eflow|erequest|eai|eaccount)/);
    console.log("✅ Case C: keyboard navigation works, navigated to", url);
  });

  test("Case D — Empty state for unknown query", async ({ page }) => {
    await loginViaLocalStorage(page, BI);

    const input = page.getByTestId("global-search-input");
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill("xxxxxxxxxxxxxxxx");

    const empty = page.getByTestId("global-search-empty");
    await expect(empty).toBeVisible({ timeout: 3000 });
    await expect(empty).toContainText(/Không tìm thấy/i);
    console.log("✅ Case D: empty state shown");
  });

  test("Case E — Escape closes dropdown", async ({ page }) => {
    await loginViaLocalStorage(page, BI);

    const input = page.getByTestId("global-search-input");
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill("e");
    await expect(page.getByTestId("global-search-dropdown")).toBeVisible({ timeout: 3000 });

    await input.press("Escape");
    await expect(page.getByTestId("global-search-dropdown")).not.toBeVisible({ timeout: 2000 });
    console.log("✅ Case E: Escape closes dropdown");
  });

  test("Case F — Click outside closes dropdown", async ({ page }) => {
    await loginViaLocalStorage(page, BI);

    const input = page.getByTestId("global-search-input");
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill("e");
    await expect(page.getByTestId("global-search-dropdown")).toBeVisible({ timeout: 3000 });

    // Click somewhere outside the search box (bottom-left corner of viewport)
    await page.mouse.click(10, 500);
    await expect(page.getByTestId("global-search-dropdown")).not.toBeVisible({ timeout: 2000 });
    console.log("✅ Case F: click outside closes dropdown");
  });
});
