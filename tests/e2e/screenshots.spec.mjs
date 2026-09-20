import { test, expect } from "@playwright/test";
import { resolve } from "node:path";

const imagePaths = [
  resolve("frontend/public/assets/sample_yellow.jpg"),
  resolve("frontend/public/assets/sample_turtleneck.jpg"),
  resolve("frontend/public/assets/sample_sport.jpg"),
];

async function signUpAndUpload(page) {
  const email = `user-${Date.now()}@example.test`;
  await page.goto("/signup");
  await page.locator("#signup-email").fill(email);
  await page.locator("#signup-password").fill("Password123!");
  await page.locator("#signup-confirm-password").fill("Password123!");
  await page.getByRole("button", { name: "Sign Up" }).click();
  await expect(page).toHaveURL(/\/upload$/, { timeout: 15000 });
  
  for (const p of imagePaths) {
      await page.locator(`input[type="file"]`).first().setInputFiles(p);
  }
}

test("Capture visual screenshots", async ({ page }) => {
  test.setTimeout(120000);
  const viewports = [
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    
    // Landing
    await page.goto("/");
    await page.screenshot({ path: `.test-artifacts/screenshots/${vp.name}-01-landing.png`, fullPage: true });

    // Login
    await page.goto("/login");
    await page.screenshot({ path: `.test-artifacts/screenshots/${vp.name}-02-login.png`, fullPage: true });

    // Signup + Upload
    await signUpAndUpload(page);
    await page.screenshot({ path: `.test-artifacts/screenshots/${vp.name}-03-upload.png`, fullPage: true });

    // Recommendations
    await page.getByRole("button", { name: "Explore Your Style Report" }).click();
    await expect(page).toHaveURL(/\/recommendations$/, { timeout: 30000 });
    await expect(page.locator(".editorial-card")).toHaveCount(3);
    await page.screenshot({ path: `.test-artifacts/screenshots/${vp.name}-04-recommendations.png`, fullPage: true });

    // Account
    await page.getByRole("button", { name: "Open account menu" }).click();
    await page.getByRole("link", { name: "Account Settings" }).click();
    await page.screenshot({ path: `.test-artifacts/screenshots/${vp.name}-05-account.png`, fullPage: true });
    
    // Navbar/Menu check for tablet and mobile
    if (vp.name === "tablet" || vp.name === "mobile") {
       await page.getByRole("button", { name: "Open account menu" }).click();
       await page.screenshot({ path: `.test-artifacts/screenshots/${vp.name}-06-menu.png` });
    }

    // Logout
    await page.getByRole("button", { name: "Open account menu" }).click();
    await page.getByRole("button", { name: "Sign Out" }).click();
  }
});