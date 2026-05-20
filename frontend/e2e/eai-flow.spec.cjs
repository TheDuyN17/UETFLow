// @ts-check
const { test, expect } = require("@playwright/test");
const path = require("path");

const BASE = "http://localhost:5173";

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
    localStorage.setItem("auth_roles", JSON.stringify([-1]));
    localStorage.setItem("auth_user", JSON.stringify({ email }));
  }, { token: body.token, email: creds.email });
}

// Mimic browser's btoa(unescape(encodeURIComponent(JSON.stringify(data))))
function makePrefillBase64(data) {
  const jsonStr = JSON.stringify(data);
  const uriEncoded = encodeURIComponent(jsonStr);
  const unescaped = uriEncoded.replace(/%([0-9A-F]{2})/gi, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  return Buffer.from(unescaped, "binary").toString("base64");
}

test.describe("eAi — Gemini Extract + Preview + Prefill Ticket", () => {
  test.setTimeout(90000);

  test("A+B: Upload PDF → Preview with real Gemini data → Create prefilled ticket URL", async ({ page }) => {
    await loginViaLocalStorage(page, { email: "user@uetflow.com", password: "8237cdf6@123" });

    // Navigate to eAi list, click first workflow
    await page.goto(`${BASE}/eai`);
    await expect(page.getByText("eAi — Trích xuất dữ liệu thông minh")).toBeVisible();

    // Click first workflow button (goes to /eai/upload/<id>)
    const firstWfBtn = page.locator("button").first();
    await firstWfBtn.click();
    await page.waitForURL(/\/eai\/upload\/.+/, { timeout: 10000 }).catch(async () => {
      // If no workflows, go directly
      await page.goto(`${BASE}/eai/upload/1`);
    });

    // Fill form name (use placeholder to find the right input, not the header search)
    const formNameInput = page.locator('input[placeholder*="form"]');
    await formNameInput.fill("Don xin nghi phep");

    // Upload PDF
    const filePath = path.join(__dirname, "../../scripts/don-nghi-phep-tran-thi-bich.pdf");
    await page.setInputFiles('input[type="file"]', filePath);

    // Click upload
    await page.click('button:has-text("Tải lên và xử lý bằng AI")');

    // Wait for success (up to 60s for Gemini)
    await page.waitForSelector('text=Trích xuất thành công', { timeout: 60000 });

    // Confidence should show
    await expect(page.getByText(/Độ tin cậy/)).toBeVisible();

    // The extracted field values are in <input> elements
    // Verify at least one input has a real value (not empty, not mock)
    const editableInputs = page.locator("input.border-b");
    const count = await editableInputs.count();
    expect(count).toBeGreaterThan(0);

    // Get value of the first editable field (ho_ten)
    const firstFieldValue = await editableInputs.first().inputValue();
    expect(firstFieldValue).not.toEqual("NGUYEN VAN A"); // Not mock
    expect(firstFieldValue.length).toBeGreaterThan(0); // Has some value

    console.log(`✅ Field ho_ten extracted: "${firstFieldValue}" (not mock!)`);

    // Click "Tạo yêu cầu"
    await page.click('button:has-text("Tạo yêu cầu")');

    // Wait for modal
    await expect(page.getByText("Tạo yêu cầu từ PDF")).toBeVisible({ timeout: 5000 });

    // Wait for workflows to load in select
    const select = page.locator("select");
    await page.waitForFunction(
      (sel) => sel.options.length > 1,
      await select.elementHandle(),
      { timeout: 10000 }
    ).catch(() => {}); // OK if no workflows

    const options = await select.locator("option").all();
    if (options.length > 1) {
      const flowValue = await options[1].getAttribute("value");
      if (flowValue) await select.selectOption(flowValue);
    }

    // Click continue
    await page.click('button:has-text("Tiếp tục")');

    // Should navigate to /erequest/new with prefill param
    await page.waitForURL(/\/erequest\/new/, { timeout: 10000 });
    const url = new URL(page.url());
    expect(url.searchParams.get("prefill")).toBeTruthy();

    console.log(`✅ Phase A+B: Navigated to ${page.url()}`);
  });

  test("C: NewTicket prefill decoding from URL", async ({ page }) => {
    await loginViaLocalStorage(page, { email: "user@uetflow.com", password: "8237cdf6@123" });

    const prefillData = {
      formName: "Don xin nghi phep",
      filledData: {
        ho_ten: "Tran Thi Bich",
        so_cccd: "023456789012",
        ngay_sinh: "15/08/1995",
        phong_ban: "Phong Ke toan",
      },
      confidence: 0.98,
      missingFields: "",
    };

    const prefillBase64 = makePrefillBase64(prefillData);

    await page.goto(`${BASE}/erequest/new?flowId=1&prefill=${prefillBase64}`);

    // Title should be pre-filled with formName + ho_ten
    const titleInput = page.locator('input[placeholder*="tiêu đề"]');
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    const titleValue = await titleInput.inputValue();
    expect(titleValue).toContain("Don xin nghi phep");
    expect(titleValue).toContain("Tran Thi Bich");

    // AI banner should show
    await expect(page.getByText(/AI đã trích xuất/)).toBeVisible();

    // Note should be prefilled
    const noteValue = await page.locator("textarea").inputValue();
    expect(noteValue).toContain("[AI Extract]");
    expect(noteValue).toContain("Tran Thi Bich");

    console.log(`✅ Phase C: Title="${titleValue}", has AI banner`);
  });

  test("E: Verify two PDFs produce different Gemini data", async ({ page }) => {
    await loginViaLocalStorage(page, { email: "user@uetflow.com", password: "8237cdf6@123" });

    const fs = require("fs");
    const pdf1 = fs.readFileSync(path.join(__dirname, "../../scripts/don-nghi-phep-tran-thi-bich.pdf"));
    const res1 = await page.request.post("http://localhost:8080/api/document-maps/sync", {
      multipart: {
        file: { name: "pdf1.pdf", mimeType: "application/pdf", buffer: pdf1 },
        formName: "Don xin nghi phep",
      },
      timeout: 60000,
    });
    expect(res1.ok()).toBeTruthy();
    const data1 = await res1.json();
    const filled1 = JSON.parse(data1.filledData);
    expect(filled1.ho_ten).not.toEqual("NGUYEN VAN A");

    const pdf2 = fs.readFileSync(path.join(__dirname, "../../scripts/don-nghi-phep-le-van-minh.pdf"));
    const res2 = await page.request.post("http://localhost:8080/api/document-maps/sync", {
      multipart: {
        file: { name: "pdf2.pdf", mimeType: "application/pdf", buffer: pdf2 },
        formName: "Don xin nghi phep",
      },
      timeout: 60000,
    });
    expect(res2.ok()).toBeTruthy();
    const data2 = await res2.json();
    const filled2 = JSON.parse(data2.filledData);
    expect(filled2.ho_ten).not.toEqual("NGUYEN VAN A");

    // Different PDFs → different names
    expect(filled1.ho_ten).not.toEqual(filled2.ho_ten);
    console.log(`✅ Phase E: PDF1="${filled1.ho_ten}", PDF2="${filled2.ho_ten}" — Different Gemini results!`);
  });
});
