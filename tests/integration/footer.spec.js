import { test, expect } from "@playwright/test";

const footer = page => page.getByRole("contentinfo");

test("footer shows the logo, the current year and the rights notice", async ({ page }) => {
    await page.goto("/");
    const year = new Date().getFullYear();
    await expect(footer(page)).toContainText(`© ${year} Coffee Masters. All rights reserved.`);
    const logoWidth = await footer(page).locator("img").evaluate(img =>
        img.complete ? img.naturalWidth : new Promise(r => img.onload = () => r(img.naturalWidth)));
    expect(logoWidth).toBeGreaterThan(0);
});

test("footer is translated", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "ភាសាខ្មែរ" }).click();
    await expect(footer(page)).toContainText("រក្សាសិទ្ធិគ្រប់យ៉ាង");
});

test("footer sits at the bottom of short pages", async ({ page }) => {
    await page.goto("/order");
    const box = await footer(page).boundingBox();
    const viewport = page.viewportSize();
    expect(Math.round(box.y + box.height)).toBe(viewport.height);
});

test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("footer is not hidden behind the tab bar", async ({ page }) => {
        await page.goto("/");
        await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
        const text = await footer(page).locator("p").boundingBox();
        const tabs = await page.locator("nav.tabs").boundingBox();
        expect(text.y + text.height).toBeLessThanOrEqual(tabs.y);
    });
});
