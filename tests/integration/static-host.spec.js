import { test, expect } from "@playwright/test";

// This server answers app routes like /product-12 with 404, the way a plain
// static host (e.g. VS Code's Live Server without its SPA setting) does
const HOST = "http://localhost:3001";

const details = page => page.locator("details-page");

async function openAppAndWaitForServiceWorker(page) {
    await page.goto(`${HOST}/`);
    await expect(page.locator("menu-page product-item").first()).toBeVisible();
    await page.waitForFunction(() => navigator.serviceWorker.controller);
}

test("the host really has no fallback", async ({ request }) => {
    const response = await request.get(`${HOST}/product-12`);
    expect(response.status()).toBe(404);
});

test("refreshing a product page still works", async ({ page }) => {
    await openAppAndWaitForServiceWorker(page);
    await page.locator("menu-page product-item h4").nth(1).click();
    await expect(page).toHaveURL(`${HOST}/product-12`);

    await page.reload();
    await expect(details(page).locator("h2")).toHaveText("Cappuccino");
    await expect(details(page).locator(".price")).toHaveText("$ 3.75 ea");
});

test("refreshing the other app pages still works", async ({ page }) => {
    await openAppAndWaitForServiceWorker(page);
    for (const [route, selector, text] of [
        ["/order", "order-page .empty", "Your order is empty"],
        ["/orders", "orders-page .empty", "No past orders yet"],
        ["/order/confirmed", "confirmation-page h2", "No recent order"],
    ]) {
        await page.goto(`${HOST}${route}`);
        await page.reload();
        await expect(page.locator(selector)).toHaveText(text);
    }
});

test("an unknown page shows the app's 404, not the server's", async ({ page }) => {
    await openAppAndWaitForServiceWorker(page);
    await page.goto(`${HOST}/nope`);
    await expect(page.locator("main")).toHaveText("Oups, 404!");
});

test("a first visit to /index.html, as Live Server opens it, shows the menu", async ({ page }) => {
    await page.goto(`${HOST}/index.html`);
    await expect(page.locator("menu-page product-item").first()).toBeVisible();
    await expect(page).toHaveURL(`${HOST}/`);
    await expect(page.locator("#linkHome")).toHaveAttribute("aria-current", "page");
});
