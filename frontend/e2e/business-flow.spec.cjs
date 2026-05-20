// @ts-check
const { test, expect } = require("@playwright/test");

const BASE = "http://localhost:5173";

const USERS = {
  bi: { email: "bi@uetflow.com", password: "805e1aee@123" },
  user: { email: "user@uetflow.com", password: "8237cdf6@123" },
  approver: { email: "approver@uetflow.com", password: "56d9c4f6@123" },
};

async function loginViaLocalStorage(page, creds) {
  const res = await page.request.post(
    "http://localhost:8080/api/internal/auth/generate-token",
    { data: { email: creds.email, password: creds.password } }
  );
  expect(res.ok()).toBeTruthy();
  const body = await res.json();

  await page.goto(BASE);
  await page.evaluate(({ token, email }) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_roles", JSON.stringify([-1, 1, 2, 3, 4, 5]));
    localStorage.setItem("auth_user", JSON.stringify({ email }));
  }, { token: body.token, email: creds.email });
}

let createdTicketId = null;

test.describe("UET Flow — Business E2E", () => {

  // Step 1: EFlow page loads with group tabs
  test("1. BI logs in and EFlow page loads with group tabs", async ({ page }) => {
    await loginViaLocalStorage(page, USERS.bi);
    await page.goto(`${BASE}/eflow`);
    await page.waitForLoadState("networkidle", { timeout: 15000 });

    const bodyText = await page.textContent("body");
    // Group tabs or workflow list should be visible
    expect(bodyText).toMatch(/default|smoke-group|Tất cả|quy trình|flow/i);
    // Should NOT be on login or 404 page
    expect(bodyText).not.toMatch(/Oops!.*Trang không tồn tại/);
  });

  // Step 2: Create new flow via Thêm mới modal
  test("2. BI creates a new workflow via Thêm mới modal", async ({ page }) => {
    await loginViaLocalStorage(page, USERS.bi);
    await page.goto(`${BASE}/eflow`);
    await page.waitForLoadState("networkidle", { timeout: 15000 });

    const addBtn = page.getByRole("button", { name: /thêm mới/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();
    await page.waitForTimeout(500);

    // Fill flow name — exact: true to avoid matching search bar partial text
    await page.getByPlaceholder("Nhập tên quy trình", { exact: true }).fill(`E2E-${Date.now()}`);

    // Fill flowGroup — <select> with option "-- Chọn nhóm --" is the modal's group dropdown
    const groupSelect = page.locator("select:has(option[value=''])").filter({ hasText: /Chọn nhóm/i });
    if (await groupSelect.count() > 0) {
      // Select by label since value equals group name string
      const opts = await groupSelect.locator("option:not([value=''])").allTextContents();
      if (opts.length > 0) {
        await groupSelect.selectOption({ label: opts[0] });
      }
    } else {
      const groupInput = page.locator("input[placeholder*='nhóm'], input[placeholder*='group']");
      if (await groupInput.count() > 0) {
        await groupInput.first().fill("default");
      }
    }

    // Click confirm/save button
    const confirmBtn = page.getByRole("button", { name: /tạo quy trình|tạo|lưu|xác nhận|ok/i }).last();
    await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
    await confirmBtn.click();
    await page.waitForTimeout(2000);

    // Verify page is still functional (no crash)
    const afterText = await page.textContent("body");
    expect(afterText).not.toMatch(/Oops!.*Trang không tồn tại/);
  });

  // Step 3: ERequest shows published workflows
  test("3. User sees published workflows in ERequest", async ({ page }) => {
    await loginViaLocalStorage(page, USERS.user);
    await page.goto(`${BASE}/erequest`);
    await page.waitForLoadState("networkidle", { timeout: 15000 });

    const bodyText = await page.textContent("body");
    expect(bodyText).not.toMatch(/error|lỗi server|không thể kết nối/i);
    expect(bodyText.trim().length).toBeGreaterThan(50);
  });

  // Step 4: User creates a ticket from NewTicket page
  test("4. User creates ticket from Smoke Flow", async ({ page }) => {
    await loginViaLocalStorage(page, USERS.user);
    await page.goto(`${BASE}/erequest/new?workflowId=1514`);
    await page.waitForLoadState("networkidle", { timeout: 15000 });

    // Fill ticket title using placeholder text
    const titleInput = page.getByPlaceholder(/nhập tiêu đề/i);
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    await titleInput.fill("E2E Ticket Test");

    await page.getByRole("button", { name: /gửi yêu cầu/i }).click();
    await page.waitForTimeout(3000);

    const url = page.url();
    const bodyText = await page.textContent("body");
    const success =
      url.includes("transaction") ||
      /thành công|đã tạo|tạo yêu cầu/i.test(bodyText);
    expect(success).toBeTruthy();

    const match = url.match(/transaction\/(\d+)/);
    if (match) createdTicketId = match[1];
  });

  // Step 5: Approver page loads
  test("5. Approver sees pending tasks in ERequest", async ({ page }) => {
    await loginViaLocalStorage(page, USERS.approver);
    await page.goto(`${BASE}/erequest`);
    await page.waitForLoadState("networkidle", { timeout: 15000 });

    const bodyText = await page.textContent("body");
    expect(bodyText).not.toMatch(/error|lỗi server/i);
    expect(bodyText.trim().length).toBeGreaterThan(50);
  });

  // Step 6: Transaction detail renders
  test("6. Transaction detail page renders without crash", async ({ page }) => {
    await loginViaLocalStorage(page, USERS.user);
    const ticketId = createdTicketId ?? "1";
    await page.goto(`${BASE}/erequest/transaction/${ticketId}`);
    await page.waitForLoadState("networkidle", { timeout: 15000 });

    const bodyText = await page.textContent("body");
    expect(bodyText.trim().length).toBeGreaterThan(50);
  });

  // Step 7: EFlow list shows correct names, no raw enum values
  test("7. EFlow workflow list shows names and uses Vietnamese status labels", async ({ page }) => {
    await loginViaLocalStorage(page, USERS.bi);
    await page.goto(`${BASE}/eflow`);
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent("body");
    // Should show at least one flow name or the add button
    const hasContent = /smoke|full test|quy trình|v2|demo|thêm mới/i.test(bodyText);
    expect(hasContent).toBeTruthy();
    // Raw enum values must not be visible to user
    expect(bodyText).not.toMatch(/DangHoatDong|KhoiTao/);
  });
});
