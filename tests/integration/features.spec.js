import { test, expect } from "@playwright/test";

const menu = page => page.locator("menu-page");
const order = page => page.locator("order-page");
const confirmation = page => page.locator("confirmation-page");
const badge = page => page.locator("#badge");
const toast = page => page.locator("toast-message");

test.beforeEach(async ({ page }) => {
    page.errors = [];
    page.on("pageerror", e => page.errors.push(e.message));
});
test.afterEach(async ({ page }) => {
    expect(page.errors).toEqual([]);
});

async function addFromMenu(page, ...indexes) {
    await page.goto("/");
    const items = menu(page).locator("product-item");
    for (const i of indexes) {
        await items.nth(i).getByRole("button", { name: "Add" }).click();
    }
    await expect(badge(page)).toHaveText(String(indexes.length));
}

async function fillForm(page, { name = "Alex", phone = "012 345 678", email = "" } = {}) {
    const form = order(page);
    await form.getByLabel("Your Name").fill(name);
    await form.getByLabel("Your Phone Number").fill(phone);
    await form.getByLabel("Your Email").fill(email);
}

test.describe("1. Cart persistence", () => {
    test("cart survives a page reload", async ({ page }) => {
        await addFromMenu(page, 0, 0, 1);
        await page.reload();
        await expect(badge(page)).toHaveText("3");
        await page.locator("#linkOrder").click();
        await expect(order(page).locator("cart-item .qty")).toHaveText(["2", "1"]);
        await expect(order(page).locator(".price-total")).toHaveText("$6.75");
    });

    test("removing items is persisted too", async ({ page }) => {
        await addFromMenu(page, 0);
        await page.locator("#linkOrder").click();
        await order(page).locator(".delete-button").click();
        await page.reload();
        await expect(order(page).locator(".empty")).toBeVisible();
        await expect(badge(page)).toBeHidden();
    });

    test("corrupted saved cart falls back to empty", async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem("cm-cart", "{not json"));
        await page.goto("/order");
        await expect(order(page).locator(".empty")).toBeVisible();
    });
});

test.describe("2. Quantity buttons", () => {
    test("+ and − change quantity and total", async ({ page }) => {
        await addFromMenu(page, 1); // Cappuccino 3.75
        await page.locator("#linkOrder").click();
        const item = order(page).locator("cart-item");

        await item.getByRole("button", { name: "Increase quantity of Cappuccino" }).click();
        await expect(order(page).locator("cart-item .qty")).toHaveText("2");
        await expect(order(page).locator(".price-total")).toHaveText("$7.50");
        await expect(badge(page)).toHaveText("2");

        await order(page).locator("cart-item").getByRole("button", { name: "Decrease quantity of Cappuccino" }).click();
        await expect(order(page).locator("cart-item .qty")).toHaveText("1");
        await expect(order(page).locator(".price-total")).toHaveText("$3.75");
    });

    test("− at quantity 1 removes the item", async ({ page }) => {
        await addFromMenu(page, 0, 1);
        await page.locator("#linkOrder").click();
        await order(page).getByRole("button", { name: "Decrease quantity of Black Americano" }).click();
        await expect(order(page).locator("cart-item .name")).toHaveText(["Cappuccino"]);
        await expect(badge(page)).toHaveText("1");
    });

    test("+ does not show the added toast", async ({ page }) => {
        await addFromMenu(page, 0);
        await expect(toast(page)).toBeHidden({ timeout: 5000 });
        await page.locator("#linkOrder").click();
        await order(page).getByRole("button", { name: "Increase quantity of Black Americano" }).click();
        await expect(badge(page)).toHaveText("2");
        await expect(toast(page)).toBeHidden();
    });
});

test.describe("3. Added-to-cart toast", () => {
    test("shows the product name, then hides", async ({ page }) => {
        await page.goto("/");
        await menu(page).locator("product-item").nth(1).getByRole("button", { name: "Add" }).click();
        await expect(toast(page)).toBeVisible();
        await expect(toast(page)).toHaveText("Cappuccino added to cart");
        await expect(toast(page)).toHaveAttribute("role", "status");
        await expect(toast(page)).toBeHidden({ timeout: 5000 });
    });

    test("shows the latest product when adding quickly", async ({ page }) => {
        await page.goto("/");
        const items = menu(page).locator("product-item");
        await items.nth(0).getByRole("button", { name: "Add" }).click();
        await items.nth(1).getByRole("button", { name: "Add" }).click();
        await expect(toast(page)).toHaveText("Cappuccino added to cart");
    });
});

test.describe("4. Order confirmation page", () => {
    test("placing an order shows the confirmation", async ({ page }) => {
        await addFromMenu(page, 0, 0, 1);
        await page.locator("#linkOrder").click();
        await fillForm(page);
        await order(page).getByRole("button", { name: "Place Order" }).click();

        await expect(page).toHaveURL("/order/confirmed");
        await expect(confirmation(page).locator("h2")).toHaveText("Thank you, Alex!");
        await expect(confirmation(page).locator(".number")).toHaveText(/^Order #\d+$/);
        await expect(confirmation(page).locator("li .name")).toHaveText(["Black Americano", "Cappuccino"]);
        await expect(confirmation(page).locator("li .qty")).toHaveText(["2x", "1x"]);
        await expect(confirmation(page).locator(".total")).toHaveText("Total $6.75");
        await expect(badge(page)).toBeHidden();
    });

    test("order numbers increase", async ({ page }) => {
        const numbers = [];
        for (let i = 0; i < 2; i++) {
            await addFromMenu(page, 0);
            await page.locator("#linkOrder").click();
            await fillForm(page);
            await order(page).getByRole("button", { name: "Place Order" }).click();
            const text = await confirmation(page).locator(".number").textContent();
            numbers.push(Number(text.replace(/\D/g, "")));
        }
        expect(numbers[1]).toBe(numbers[0] + 1);
    });

    test("confirmation survives a reload", async ({ page }) => {
        await addFromMenu(page, 1);
        await page.locator("#linkOrder").click();
        await fillForm(page, { name: "Sam" });
        await order(page).getByRole("button", { name: "Place Order" }).click();
        await expect(page).toHaveURL("/order/confirmed");
        await page.reload();
        await expect(confirmation(page).locator("h2")).toHaveText("Thank you, Sam!");
        // Page assets load at a nested URL
        const logoWidth = await page.locator("header h1 img").evaluate(img => img.naturalWidth);
        expect(logoWidth).toBeGreaterThan(0);
    });

    test("customer name is shown as text, not HTML", async ({ page }) => {
        await addFromMenu(page, 0);
        await page.locator("#linkOrder").click();
        await fillForm(page, { name: "<img src=x onerror=window.pwned=1>" });
        await order(page).getByRole("button", { name: "Place Order" }).click();
        await expect(confirmation(page).locator("h2")).toHaveText("Thank you, <img src=x onerror=window.pwned=1>!");
        expect(await page.evaluate(() => window.pwned)).toBeUndefined();
    });

    test("with no recent order, links back to the menu", async ({ page }) => {
        await page.goto("/order/confirmed");
        await expect(confirmation(page).locator("h2")).toHaveText("No recent order");
        await confirmation(page).getByRole("link", { name: "Back to menu" }).click();
        await expect(page).toHaveURL("/");
        await expect(menu(page).locator("product-item").first()).toBeVisible();
    });
});

test.describe("5. Form validation", () => {
    test.beforeEach(async ({ page }) => {
        await addFromMenu(page, 0);
        await page.locator("#linkOrder").click();
    });

    test("empty form shows errors and does not submit", async ({ page }) => {
        await order(page).getByRole("button", { name: "Place Order" }).click();
        await expect(order(page).locator("#name-error")).toHaveText("Please enter your name");
        await expect(order(page).locator("#phone-error")).toHaveText("Please enter your phone number");
        await expect(order(page).locator("#email-error")).toBeEmpty();
        await expect(order(page).getByLabel("Your Name")).toHaveAttribute("aria-invalid", "true");
        await expect(order(page).getByLabel("Your Name")).toBeFocused();
        await expect(page).toHaveURL("/order");
        await expect(badge(page)).toHaveText("1");
    });

    test("invalid phone and email are rejected", async ({ page }) => {
        await fillForm(page, { phone: "abc", email: "not-an-email" });
        await order(page).getByRole("button", { name: "Place Order" }).click();
        await expect(order(page).locator("#name-error")).toBeEmpty();
        await expect(order(page).locator("#phone-error")).toHaveText("Please enter a valid phone number");
        await expect(order(page).locator("#email-error")).toHaveText("Please enter a valid email address");
        await expect(page).toHaveURL("/order");
    });

    test("a field's error appearing on blur does not swallow the submit click", async ({ page }) => {
        // Leaving the email field shows its error; the click must still submit
        await order(page).getByLabel("Your Email").fill("bad");
        await order(page).getByRole("button", { name: "Place Order" }).click();
        await expect(order(page).locator("#email-error")).toHaveText("Please enter a valid email address");
        await expect(order(page).locator("#name-error")).toHaveText("Please enter your name");
        await expect(order(page).locator("#phone-error")).toHaveText("Please enter your phone number");
    });

    test("an error clears once the field is fixed", async ({ page }) => {
        await order(page).getByRole("button", { name: "Place Order" }).click();
        await expect(order(page).locator("#name-error")).not.toBeEmpty();
        await order(page).getByLabel("Your Name").fill("Alex");
        await expect(order(page).locator("#name-error")).toBeEmpty();
        await expect(order(page).getByLabel("Your Name")).not.toHaveAttribute("aria-invalid", "true");
    });

    test("leaving a field invalid shows its error", async ({ page }) => {
        await order(page).getByLabel("Your Phone Number").fill("12");
        await order(page).getByLabel("Your Email").focus();
        await expect(order(page).locator("#phone-error")).toHaveText("Please enter a valid phone number");
    });

    test("valid details with an international phone submit", async ({ page }) => {
        await fillForm(page, { phone: "+855 12-345-678", email: "alex@example.com" });
        await order(page).getByRole("button", { name: "Place Order" }).click();
        await expect(page).toHaveURL("/order/confirmed");
    });
});
