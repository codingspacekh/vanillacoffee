import { test, expect } from "@playwright/test";

const menu = page => page.locator("menu-page");
const details = page => page.locator("details-page");
const order = page => page.locator("order-page");
const orders = page => page.locator("orders-page");
const confirmation = page => page.locator("confirmation-page");
const badge = page => page.locator("#badge");
const toast = page => page.locator("toast-message");
const productNames = page => menu(page).locator("product-item h4");
const search = page => menu(page).getByRole("searchbox", { name: "Search the menu" });
const chip = (page, name) => menu(page).getByRole("button", { name, exact: true });
const card = (page, name) => menu(page).locator("product-item").filter({ has: page.locator(`h4:text-is("${name}")`) }).first();

test.beforeEach(async ({ page }) => {
    page.errors = [];
    page.on("pageerror", e => page.errors.push(e.message));
});
test.afterEach(async ({ page }) => {
    expect(page.errors).toEqual([]);
});

async function placeOrder(page, name = "Alex") {
    await page.locator("#linkOrder").click();
    await order(page).getByLabel("Your Name").fill(name);
    await order(page).getByLabel("Your Phone Number").fill("012 345 678");
    await order(page).getByRole("button", { name: "Place Order" }).click();
    await expect(page).toHaveURL("/order/confirmed");
}

test.describe("6. Search and category filter", () => {
    test("search filters products by name", async ({ page }) => {
        await page.goto("/");
        await search(page).fill("cap");
        await expect(productNames(page)).toHaveText(["Cappuccino"]);
        await expect(page).toHaveURL("/?q=cap");
        await search(page).fill("");
        await expect(productNames(page)).toHaveCount(11);
        await expect(page).toHaveURL("/");
    });

    test("search also matches category names", async ({ page }) => {
        await page.goto("/");
        await search(page).fill("snack");
        await expect(productNames(page)).toHaveText(["Croissant", "Chocolate Chip Muffin"]);
    });

    test("category chips filter and show which is selected", async ({ page }) => {
        await page.goto("/");
        await chip(page, "ICED COFFEE").click();
        await expect(productNames(page)).toHaveText(["Frappuccino", "Iced Coffee", "Cold Brew"]);
        await expect(chip(page, "ICED COFFEE")).toHaveAttribute("aria-pressed", "true");
        await expect(chip(page, "All")).toHaveAttribute("aria-pressed", "false");
        await expect(page).toHaveURL("/?category=iced-coffee");

        await chip(page, "All").click();
        await expect(productNames(page)).toHaveCount(11);
        await expect(page).toHaveURL("/");
    });

    test("search and category combine", async ({ page }) => {
        await page.goto("/?category=tea&q=green");
        await expect(search(page)).toHaveValue("green");
        await expect(chip(page, "TEA")).toHaveAttribute("aria-pressed", "true");
        await expect(productNames(page)).toHaveText(["Green Tea"]);
    });

    test("no results shows a message with a way to clear", async ({ page }) => {
        await page.goto("/");
        await search(page).fill("zzz");
        await expect(menu(page).locator(".no-results")).toContainText('No items match "zzz"');
        await menu(page).getByRole("button", { name: "Clear filters" }).click();
        await expect(search(page)).toHaveValue("");
        await expect(productNames(page)).toHaveCount(11);
    });

    test("typing keeps focus in the search box", async ({ page }) => {
        await page.goto("/");
        await search(page).pressSequentially("tea");
        await expect(search(page)).toBeFocused();
        await expect(search(page)).toHaveValue("tea");
    });

    test("the filter survives visiting a product and going back", async ({ page }) => {
        await page.goto("/");
        await search(page).fill("cap");
        await productNames(page).first().click();
        await expect(page).toHaveURL("/product-12");
        await page.goBack();
        await expect(search(page)).toHaveValue("cap");
        await expect(productNames(page)).toHaveText(["Cappuccino"]);
    });

    test("the menu link clears the filter", async ({ page }) => {
        await page.goto("/?q=cap");
        await expect(productNames(page)).toHaveText(["Cappuccino"]);
        await page.locator("#linkOrder").click();
        await page.locator("#linkHome").click();
        await expect(page).toHaveURL("/");
        await expect(productNames(page)).toHaveCount(11);
    });
});

test.describe("7. Product options", () => {
    test("choices change the price and appear in the cart", async ({ page }) => {
        await page.goto("/product-12");
        const d = details(page);
        await expect(d.locator(".price")).toHaveText("$ 3.75 ea");
        await expect(d.getByRole("radio", { name: "Small" })).toBeChecked();

        await d.getByRole("radio", { name: /^Large/ }).check();
        await d.getByRole("radio", { name: /^Oat/ }).check();
        await d.getByRole("group", { name: "Extra shot" }).getByRole("radio", { name: /^Yes/ }).check();
        await expect(d.locator(".price")).toHaveText("$ 6.15 ea");

        await d.getByRole("button", { name: "Add to cart" }).click();
        await expect(page).toHaveURL("/order");
        const item = order(page).locator("cart-item");
        await expect(item.locator(".name")).toHaveText("Cappuccino");
        await expect(item.locator(".options")).toHaveText("Size: Large · Milk: Oat · Extra shot: Yes");
        await expect(item.locator(".price")).toHaveText("$6.15");
        await expect(order(page).locator(".price-total")).toHaveText("$6.15");
    });

    test("the menu Add button uses the default choices", async ({ page }) => {
        await page.goto("/");
        await card(page, "Cappuccino").getByRole("button", { name: "Add" }).click();
        await page.locator("#linkOrder").click();
        await expect(order(page).locator("cart-item .options")).toBeEmpty();
        await expect(order(page).locator("cart-item .price")).toHaveText("$3.75");
    });

    test("different choices are separate cart lines; same choices merge", async ({ page }) => {
        await page.goto("/");
        await card(page, "Cappuccino").getByRole("button", { name: "Add" }).click();
        await card(page, "Cappuccino").getByRole("button", { name: "Add" }).click();
        await page.goto("/product-12");
        await details(page).getByRole("radio", { name: /^Large/ }).check();
        await details(page).getByRole("button", { name: "Add to cart" }).click();

        await expect(order(page).locator("cart-item .qty")).toHaveText(["2", "1"]);
        await expect(order(page).locator("cart-item .options")).toHaveText(["", "Size: Large"]);
        await expect(order(page).locator(".price-total")).toHaveText("$12.25");

        // Quantity buttons act on one line only
        await order(page).locator("cart-item").nth(1).getByRole("button", { name: /Increase quantity/ }).click();
        await expect(order(page).locator("cart-item .qty")).toHaveText(["2", "2"]);
        await order(page).locator("cart-item").nth(0).locator(".delete-button").click();
        await expect(order(page).locator("cart-item .options")).toHaveText(["Size: Large"]);
    });

    test("snacks have no options", async ({ page }) => {
        await page.goto("/product-41");
        await expect(details(page).locator("h2")).toHaveText("Croissant");
        await expect(details(page).getByRole("radio")).toHaveCount(0);
        await details(page).getByRole("button", { name: "Add to cart" }).click();
        await expect(order(page).locator("cart-item .price")).toHaveText("$2.80");
    });

    test("confirmation lists the chosen options", async ({ page }) => {
        await page.goto("/product-12");
        await details(page).getByRole("radio", { name: /^Oat/ }).check();
        await details(page).getByRole("button", { name: "Add to cart" }).click();
        await placeOrder(page);
        await expect(confirmation(page).locator("li .options")).toHaveText(["Milk: Oat"]);
        await expect(confirmation(page).locator(".total")).toHaveText("Total $4.35");
    });

    test("a cart saved in the old format still loads", async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem("cm-cart", JSON.stringify([
            { product: { id: 12, name: "Cappuccino", price: 3.75, image: "cappuccino.png" }, quantity: 2 },
        ])));
        await page.goto("/order");
        await expect(order(page).locator("cart-item .qty")).toHaveText("2");
        await expect(order(page).locator(".price-total")).toHaveText("$7.50");
        await order(page).getByRole("button", { name: /Increase quantity/ }).click();
        await expect(order(page).locator("cart-item .qty")).toHaveText("3");
    });
});

test.describe("8. Order history", () => {
    test("shows past orders newest first", async ({ page }) => {
        await page.goto("/");
        await card(page, "Black Americano").getByRole("button", { name: "Add" }).click();
        await placeOrder(page, "Alex");
        await page.goto("/");
        await card(page, "Cappuccino").getByRole("button", { name: "Add" }).click();
        await card(page, "Cappuccino").getByRole("button", { name: "Add" }).click();
        await placeOrder(page, "Sam");

        await page.getByRole("link", { name: "Order history" }).click();
        await expect(page).toHaveURL("/orders");
        const entries = orders(page).locator("article");
        await expect(entries).toHaveCount(2);
        await expect(entries.locator(".number")).toHaveText(["Order #1002", "Order #1001"]);
        await expect(entries.locator(".items")).toHaveText(["2x Cappuccino", "1x Black Americano"]);
        await expect(entries.locator(".total")).toHaveText(["$7.50", "$1.50"]);
        await expect(entries.first().locator("time")).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}T/);

        await page.reload();
        await expect(orders(page).locator("article")).toHaveCount(2);
    });

    test("reorder adds the items to the cart", async ({ page }) => {
        await page.goto("/product-12");
        await details(page).getByRole("radio", { name: /^Large/ }).check();
        await details(page).getByRole("button", { name: "Add to cart" }).click();
        await placeOrder(page);

        // Something already in the cart is kept
        await page.goto("/");
        await card(page, "Croissant").getByRole("button", { name: "Add" }).click();

        await page.getByRole("link", { name: "Order history" }).click();
        await orders(page).getByRole("button", { name: "Reorder order #1001" }).click();
        await expect(page).toHaveURL("/order");
        await expect(toast(page)).toHaveText("Order #1001 added to cart");
        await expect(order(page).locator("cart-item .name")).toHaveText(["Croissant", "Cappuccino"]);
        await expect(order(page).locator("cart-item .options")).toHaveText(["", "Size: Large"]);
        await expect(badge(page)).toHaveText("2");
    });

    test("reorder uses current menu prices", async ({ page }) => {
        await page.addInitScript(() => {
            if (!localStorage.getItem("cm-orders")) {
                localStorage.setItem("cm-orders", JSON.stringify([{
                    number: 1001,
                    placedAt: "2026-01-01T10:00:00.000Z",
                    customer: { name: "Alex" },
                    items: [{ key: "12", product: { id: 12, name: "Cappuccino", price: 1 }, options: {}, unitPrice: 1, quantity: 1 }],
                    total: 1,
                }]));
            }
        });
        await page.goto("/orders");
        await orders(page).getByRole("button", { name: "Reorder order #1001" }).click();
        await expect(order(page).locator(".price-total")).toHaveText("$3.75");
    });

    test("empty history links back to the menu", async ({ page }) => {
        await page.goto("/orders");
        await expect(orders(page).locator(".empty")).toHaveText("No past orders yet");
        await orders(page).getByRole("link", { name: "Back to menu" }).click();
        await expect(page).toHaveURL("/");
    });
});

test.describe("9. Favourites", () => {
    test("the heart toggles without navigating, and the menu has no favourites section", async ({ page }) => {
        await page.goto("/");
        const heart = card(page, "Cold Brew").getByRole("button", { name: "Favourite Cold Brew" });
        await expect(heart).toHaveAttribute("aria-pressed", "false");
        await heart.click();

        await expect(card(page, "Cold Brew").getByRole("button", { name: "Favourite Cold Brew" }))
            .toHaveAttribute("aria-pressed", "true");
        // Favourites have their own page; the menu keeps its usual order
        await expect(menu(page).locator("h3").first()).toHaveText("HOT COFFEE");
        await expect(menu(page).locator("product-item h4", { hasText: "Cold Brew" })).toHaveCount(1);
        // Toggling does not navigate or add to the cart
        await expect(page).toHaveURL("/");
        await expect(badge(page)).toBeHidden();

        await card(page, "Cold Brew").getByRole("button", { name: "Favourite Cold Brew" }).click();
        await expect(card(page, "Cold Brew").getByRole("button", { name: "Favourite Cold Brew" }))
            .toHaveAttribute("aria-pressed", "false");
    });

    test("focus stays on the heart after toggling", async ({ page }) => {
        await page.goto("/");
        await card(page, "Macchiato").getByRole("button", { name: "Favourite Macchiato" }).click();
        const focused = await page.evaluate(() =>
            document.querySelector("menu-page").shadowRoot.activeElement?.getAttribute("aria-label"));
        expect(focused).toBe("Favourite Macchiato");
    });

    test("favourites survive a reload", async ({ page }) => {
        await page.goto("/");
        await card(page, "Croissant").getByRole("button", { name: "Favourite Croissant" }).click();
        await card(page, "Green Tea").getByRole("button", { name: "Favourite Green Tea" }).click();
        await page.reload();
        await expect(card(page, "Croissant").getByRole("button", { name: "Favourite Croissant" }))
            .toHaveAttribute("aria-pressed", "true");
        await expect(card(page, "Green Tea").getByRole("button", { name: "Favourite Green Tea" }))
            .toHaveAttribute("aria-pressed", "true");
    });
});

test.describe("10. Offline support", () => {
    test("the app works offline after the first visit", async ({ page, context }) => {
        await page.goto("/");
        await expect(productNames(page).first()).toBeVisible();
        await page.evaluate(() => navigator.serviceWorker.ready);
        await page.waitForFunction(() => navigator.serviceWorker.controller);

        await context.setOffline(true);
        await page.reload();
        await expect(productNames(page)).toHaveCount(11);
        const imageWidth = await menu(page).locator("product-item img").first()
            .evaluate(img => img.complete ? img.naturalWidth : new Promise(r => img.onload = () => r(img.naturalWidth)));
        expect(imageWidth).toBeGreaterThan(0);

        await page.goto("/product-12");
        await expect(details(page).locator("h2")).toHaveText("Cappuccino");
        await details(page).getByRole("button", { name: "Add to cart" }).click();
        await expect(order(page).locator("cart-item .name")).toHaveText(["Cappuccino"]);

        await page.goto("/orders");
        await expect(orders(page).locator(".empty")).toBeVisible();
        await context.setOffline(false);
    });

    test("menu data is fresh when online", async ({ page, context }) => {
        await page.goto("/");
        await page.waitForFunction(() => navigator.serviceWorker.controller);
        // context.route also sees requests the service worker makes
        await context.route("**/data/menu.json", async route => {
            const response = await route.fetch();
            const menu = await response.json();
            menu[0].products[0].name = "Updated Americano";
            await route.fulfill({ response, json: menu });
        });
        await page.reload();
        await expect(productNames(page).first()).toHaveText("Updated Americano");
    });
});
