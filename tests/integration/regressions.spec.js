import { test, expect } from "@playwright/test";

const menu = page => page.locator("menu-page");
const details = page => page.locator("details-page");
const order = page => page.locator("order-page");
const badge = page => page.locator("#badge");

// Fail any test in this file that throws an uncaught error in the page
test.beforeEach(async ({ page }) => {
    page.errors = [];
    page.on("pageerror", e => page.errors.push(e.message));
});
test.afterEach(async ({ page }) => {
    expect(page.errors).toEqual([]);
});

test("unknown product id shows a not-found message", async ({ page }) => {
    await page.goto("/product-999");
    await expect(details(page).locator("h2")).toHaveText("Product not found");
    await expect(details(page).getByRole("button", { name: "Add to cart" })).toBeHidden();
});

test("going back past the first page does not throw", async ({ page }) => {
    await page.goto("/");
    await menu(page).locator("product-item h4").first().click();
    await expect(page).toHaveURL("/product-11");
    await page.goBack();
    await expect(page).toHaveURL("/");
    await page.goBack().catch(() => {});
    await page.goForward().catch(() => {});
    await expect(page.locator("main > *")).toHaveCount(1);
});

test("pages that are no longer shown stop re-rendering", async ({ page }) => {
    await page.goto("/");
    await expect(menu(page).locator("product-item").first()).toBeVisible();
    for (let i = 0; i < 3; i++) {
        await page.locator("#linkOrder").click();
        await page.locator("#linkHome").click();
    }
    const renders = await page.evaluate(async () => {
        const count = { order: 0, menu: 0 };
        for (const [tag, key] of [["order-page", "order"], ["menu-page", "menu"]]) {
            const proto = customElements.get(tag).prototype;
            const original = proto.render;
            proto.render = function () { count[key]++; return original.call(this); };
        }
        app.store.cart = [...app.store.cart];
        app.store.menu = [...app.store.menu];
        return count;
    });
    // Only the one menu page on screen should react
    expect(renders).toEqual({ order: 0, menu: 1 });
});

test("typed customer details survive a cart change", async ({ page }) => {
    await page.goto("/");
    const items = menu(page).locator("product-item");
    await items.nth(0).getByRole("button", { name: "Add" }).click();
    await items.nth(1).getByRole("button", { name: "Add" }).click();
    await expect(badge(page)).toHaveText("2");
    await page.locator("#linkOrder").click();

    await order(page).locator("input[name=name]").fill("Alex");
    await order(page).locator("input[name=phone]").fill("555-1234");
    await order(page).locator("input[name=phone]").blur();
    await order(page).locator("cart-item .delete-button").first().click();
    await expect(order(page).locator("cart-item")).toHaveCount(1);
    await expect(order(page).locator("input[name=name]")).toHaveValue("Alex");
    await expect(order(page).locator("input[name=phone]")).toHaveValue("555-1234");

    await order(page).getByRole("button", { name: "Place Order" }).click();
    await expect(page.locator("confirmation-page h2")).toHaveText("Thank you, Alex!");
});

test("each cart item is rendered once per update", async ({ page }) => {
    await page.goto("/");
    await menu(page).locator("product-item").first().getByRole("button", { name: "Add" }).click();
    await expect(badge(page)).toHaveText("1");
    await page.locator("#linkOrder").click();
    await expect(order(page).locator("cart-item")).toHaveCount(1);

    const created = await page.evaluate(async () => {
        let n = 0;
        const observer = new MutationObserver(records => {
            for (const r of records) {
                for (const node of r.addedNodes) {
                    if (node.nodeName === "CART-ITEM") n++;
                }
            }
        });
        observer.observe(document.querySelector("order-page").shadowRoot, { childList: true, subtree: true });
        app.store.cart = [...app.store.cart];
        await new Promise(r => setTimeout(r));
        observer.disconnect();
        return n;
    });
    expect(created).toBe(1);
});

test.describe("small screen", () => {
    test.use({ viewport: { width: 375, height: 400 } });

    test("navigating scrolls back to the top", async ({ page }) => {
        await page.goto("/");
        const last = menu(page).locator("product-item").last();
        await last.scrollIntoViewIfNeeded();
        // Read scrollTop: the old router overwrote window.scrollY with a plain value
        const scrollTop = () => page.evaluate(() => document.documentElement.scrollTop);
        expect(await scrollTop()).toBeGreaterThan(0);
        await last.locator("h4").click();
        await expect(page).toHaveURL(/\/product-\d+/);
        await expect(details(page).locator("h2")).not.toBeEmpty();
        expect(await scrollTop()).toBe(0);
    });
});

test("stylesheets are downloaded once", async ({ page }) => {
    const cssRequests = [];
    page.on("request", r => { if (r.url().includes("/styles/")) cssRequests.push(new URL(r.url()).pathname); });
    await page.goto("/");
    await expect(menu(page).locator("product-item").first()).toBeVisible();
    await menu(page).locator("product-item h4").first().click();
    await expect(details(page).locator("h2")).toHaveText("Black Americano");
    for (let i = 0; i < 3; i++) {
        await page.locator("#linkOrder").click();
        await page.locator("#linkHome").click();
    }
    await menu(page).locator("product-item h4").first().click();
    await expect(details(page).locator("h2")).toHaveText("Black Americano");
    await expect.poll(() => cssRequests.length).toBeGreaterThan(0);
    expect(cssRequests.filter(u => u.endsWith(".css")).sort()).toEqual([
        "/styles/DetailsPage.css",
        "/styles/MenuPage.css",
        "/styles/OrderPage.css",
        "/styles/global.css",
        "/styles/shared.css",
    ]);
});

test("menu.json is only requested once", async ({ page }) => {
    let requests = 0;
    page.on("request", r => { if (r.url().endsWith("/data/menu.json")) requests++; });
    await page.goto("/product-12");
    await expect(details(page).locator("h2")).toHaveText("Cappuccino");
    expect(requests).toBe(1);
});

test("placing an order empties the cart", async ({ page }) => {
    await page.goto("/");
    const items = menu(page).locator("product-item");
    await items.nth(0).getByRole("button", { name: "Add" }).click();
    await items.nth(1).getByRole("button", { name: "Add" }).click();
    await expect(badge(page)).toHaveText("2");
    await page.locator("#linkOrder").click();

    await order(page).locator("input[name=name]").fill("Alex");
    await order(page).locator("input[name=phone]").fill("555-1234");
    await order(page).getByRole("button", { name: "Place Order" }).click();
    await expect(page).toHaveURL("/order/confirmed");
    await expect(badge(page)).toBeHidden();

    await page.locator("#linkOrder").click();
    await expect(order(page).locator(".empty")).toHaveText("Your order is empty");

    // A new order starts with a blank form
    await page.locator("#linkHome").click();
    await menu(page).locator("product-item").first().getByRole("button", { name: "Add" }).click();
    await page.locator("#linkOrder").click();
    await expect(order(page).locator("cart-item")).toHaveCount(1);
    await expect(order(page).locator("input[name=name]")).toHaveValue("");
});
