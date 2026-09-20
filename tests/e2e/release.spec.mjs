import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { resolve } from "node:path";

const PASSWORD = "ReleaseTest123!";
const NEW_PASSWORD = "ReleaseTest456!";
const imagePaths = [
  resolve("frontend/public/assets/sample_yellow.jpg"),
  resolve("frontend/public/assets/sample_turtleneck.jpg"),
  resolve("frontend/public/assets/sample_sport.jpg"),
];

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
}

function watchBrowser(page, { allowedErrors = [], allowedResponses = [] } = {}) {
  const unexpected = [];
  page.on("pageerror", (error) => unexpected.push(`pageerror:${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (text.startsWith("Failed to load resource:")) return;
    if (!allowedErrors.some((pattern) => pattern.test(text))) {
      unexpected.push(`console:${text}`);
    }
  });
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (url.startsWith("https://fonts.googleapis.com/") || url.startsWith("https://fonts.gstatic.com/")) {
      return;
    }
    const failure = request.failure()?.errorText || "unknown";
    if (
      failure === "net::ERR_ABORTED" &&
      url.startsWith("http://127.0.0.1:8085/google.firestore.v1.Firestore/")
    ) {
      return;
    }
    unexpected.push(`requestfailed:${url}:${failure}`);
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    const url = response.url();
    if (!allowedResponses.some((pattern) => pattern.test(url))) {
      unexpected.push(`response:${response.status()}:${url}`);
    }
  });
  return unexpected;
}

async function signUp(page, email, password = PASSWORD) {
  await page.goto("/signup");
  await page.locator("#signup-email").fill(email);
  await page.locator("#signup-password").fill(password);
  await page.locator("#signup-confirm-password").fill(password);
  await page.getByRole("button", { name: "Sign Up" }).click();
  await expect(page).toHaveURL(/\/upload$/);
}

async function logOut(page) {
  await page.getByRole("button", { name: "Open account menu" }).click();
  await page.getByRole("button", { name: "Sign Out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
}

async function addLook(page, path) {
  await page.locator('input[type="file"]').first().setInputFiles(path);
}

async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

async function assertNoCriticalA11yViolations(page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const critical = result.violations.filter(
    (violation) => violation.impact === "critical"
  );
  expect(critical).toEqual([]);
}

test("logged-out routes, responsive landing, and auth errors are safe", async ({ page }) => {
  const browserErrors = watchBrowser(page, {
    allowedResponses: [/\/identitytoolkit\.googleapis\.com\/v1\/accounts:signInWithPassword/],
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Analyze and Improve/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Get Started" })).toBeVisible();
  await assertNoCriticalA11yViolations(page);
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);

  for (const path of ["/upload", "/recommendations", "/account-settings"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Build Your Moodboard")).toHaveCount(0);
  }

  await page.locator("#login-email").fill(uniqueEmail("missing"));
  await page.locator("#login-password").fill("incorrect-password");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText(/email or password is incorrect|login failed/i)).toBeVisible();

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await assertNoHorizontalOverflow(page);
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Analyze and Improve/i })).toBeVisible();

  expect(browserErrors).toEqual([]);
});

test("complete authenticated journey persists data and isolates a second user", async ({ page }) => {
  const browserErrors = watchBrowser(page);
  const apiRequests = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:5001/analyze-")) return;
    apiRequests.push({
      url: request.url(),
      hasAuthorization: Boolean(request.headers().authorization),
    });
  });

  const userA = uniqueEmail("user-a");
  await signUp(page, userA);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Build Your Moodboard" })).toBeVisible();

  const analyzeButton = page.getByRole("button", { name: "Explore Your Style Report" });
  await expect(analyzeButton).toBeDisabled();

  await page.locator('input[type="file"]').first().setInputFiles({
    name: "unsupported.gif",
    mimeType: "image/gif",
    buffer: Buffer.from("GIF89a"),
  });
  await expect(page.getByText(/Only JPEG, PNG, and WebP/i)).toBeVisible();

  await page.locator('input[type="file"]').first().setInputFiles({
    name: "oversized.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });
  await expect(page.getByText(/larger than 5 MB/i)).toBeVisible();

  await addLook(page, imagePaths[0]);
  await addLook(page, imagePaths[0]);
  await expect(page.getByText(/already on your moodboard/i)).toBeVisible();
  await addLook(page, imagePaths[1]);
  await addLook(page, imagePaths[2]);
  await expect(page.getByText("3/6 looks selected")).toBeVisible();
  await page.getByRole("button", { name: "Remove look 2" }).click();
  await expect(page.getByText("2/6 looks selected")).toBeVisible();
  await addLook(page, imagePaths[1]);

  await analyzeButton.click();
  await expect(page.getByRole("button", { name: /Analyzing 3 looks/i })).toBeDisabled();
  await expect(page).toHaveURL(/\/recommendations$/, { timeout: 30_000 });
  await expect(page.locator(".editorial-card")).toHaveCount(3);
  await expect(page.getByText(/Sharpen the blazer line/i).first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText('"imageNumber"');

  const shoppingLink = page.locator("a.curated-tag").first();
  await expect(shoppingLink).toHaveAttribute("href", /^https:\/\/www\.google\.com\/search\?q=shop\+/);
  await expect(shoppingLink).toHaveAttribute("rel", "noopener noreferrer");
  expect(apiRequests.length).toBe(4);
  expect(apiRequests.every((request) => request.hasAuthorization)).toBe(true);
  expect(apiRequests.every((request) => !new URL(request.url).search)).toBe(true);

  await page.reload();
  await expect(page.locator(".editorial-card")).toHaveCount(3);
  await expect(page.getByText(/3 looks learned/i)).toBeVisible();

  await page.getByRole("button", { name: "Open account menu" }).click();
  await page.getByRole("link", { name: "Account Settings" }).click();
  await page.locator("#name").fill("Release Candidate User");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Account settings updated.")).toBeVisible();
  await page.reload();
  await expect(page.locator("#name")).toHaveValue("Release Candidate User");

  const avatarInput = page.locator("#profile-photo");
  await avatarInput.setInputFiles(imagePaths[0]);
  await expect(page.getByText("Profile photo updated.")).toBeVisible();
  await expect(avatarInput).toBeEnabled();
  const firstAvatar = await page.getByAltText("Current profile").getAttribute("src");
  expect(firstAvatar).toContain("127.0.0.1:9199");
  await avatarInput.setInputFiles(imagePaths[1]);
  await expect(page.getByAltText("Current profile")).not.toHaveAttribute("src", firstAvatar);
  await expect(page.getByRole("button", { name: "Remove Photo" })).toBeEnabled();
  await page.getByRole("button", { name: "Remove Photo" }).click();
  await expect(page.getByAltText("Current profile")).toHaveAttribute("src", "/assets/default-avatar.jpg");
  await expect(page.getByText("Profile photo removed.")).toBeVisible();

  await page.locator("#current-password").fill(PASSWORD);
  await page.locator("#new-password").fill(NEW_PASSWORD);
  await page.locator("#confirm-password").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Profile and password updated.")).toBeVisible();

  await logOut(page);
  await page.goto("/login");
  await page.locator("#login-email").fill(userA);
  await page.locator("#login-password").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/upload$/);

  await logOut(page);
  const userB = uniqueEmail("user-b");
  await signUp(page, userB);
  await page.goto("/recommendations");
  await expect(page.getByText(/No fashion records found yet/i)).toBeVisible();
  await expect(page.locator(".editorial-card")).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/upload", "/recommendations", "/account-settings"]) {
    await page.goto(path);
    await assertNoHorizontalOverflow(page);
  }
  await assertNoCriticalA11yViolations(page);

  await logOut(page);
  await page.goBack();
  await page.goto("/recommendations");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator(".editorial-card")).toHaveCount(0);
  expect(browserErrors).toEqual([]);
});

test("Vision and malformed recommendation failures recover without crashing", async ({ page }) => {
  const browserErrors = watchBrowser(page, {
    allowedErrors: [/Fashion analysis failed/],
    allowedResponses: [/127\.0\.0\.1:5001\/analyze-image/],
  });
  await signUp(page, uniqueEmail("failures"));
  for (const imagePath of imagePaths) await addLook(page, imagePath);

  await page.route("**/analyze-image", (route) => route.fulfill({
    status: 502,
    contentType: "application/json",
    body: JSON.stringify({ error: "Image analysis is temporarily unavailable. Please try again." }),
  }));
  await page.getByRole("button", { name: "Explore Your Style Report" }).click();
  await expect(page.getByText(/Image analysis is temporarily unavailable/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Explore Your Style Report" })).toBeEnabled();
  await page.unroute("**/analyze-image");

  await page.route("**/analyze-fashion", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ recommendations: [{ imageNumber: 1, recommendations: [] }] }),
  }));
  await page.getByRole("button", { name: "Explore Your Style Report" }).click();
  await expect(page.getByText(/incomplete report/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: "Explore Your Style Report" })).toBeEnabled();
  await expect(page.getByRole("heading", { name: "Build Your Moodboard" })).toBeVisible();
  expect(browserErrors).toEqual([]);
});
