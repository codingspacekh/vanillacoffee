import { test, expect } from "@playwright/test";

const menu = page => page.locator("menu-page");
const details = page => page.locator("details-page");
const order = page => page.locator("order-page");
const badge = page => page.locator("#badge");

test.describe("Menu page", () => {
    test("loads categories and products from menu.json", async ({ page }) => {
        await page.goto("/");
        await expect(menu(page).locator("h3").first()).toHaveText("HOT COFFEE");
        await expect(menu(page).locator("product-item").first().locator("h4"))
            .toHaveText("Black Americano");
        await expect(menu(page).locator("product-item").first().locator(".price"))
            .toHaveText("$1.50");
    });

    test("Add button puts item in cart and updates badge", async ({ page }) => {
        await page.goto("/");
        await expect(badge(page)).toBeHidden();

        const add = menu(page).locator("product-item").first().getByRole("button", { name: "Add" });
        await add.click();
        await expect(badge(page)).toHaveText("1");
        await add.click();
        await expect(badge(page)).toHaveText("2");
        // Stays on the menu page
        await expect(page).toHaveURL("/");
    });
});

test.describe("Details page", () => {
    test("clicking a product opens its details", async ({ page }) => {
        await page.goto("/");
        await menu(page).locator("product-item").first().locator("h4").click();

        await expect(page).toHaveURL("/product-11");
        await expect(details(page).locator("h2")).toHaveText("Black Americano");
        await expect(details(page).locator(".price")).toHaveText("$ 1.50 ea");
        await expect(details(page).locator(".description")).toContainText("espresso");
    });

    test("deep link to a product works", async ({ page }) => {
        await page.goto("/product-12");
        await expect(details(page).locator("h2")).toHaveText("Cappuccino");
    });

    test("Add to cart goes to the order page", async ({ page }) => {
        await page.goto("/product-12");
        await details(page).getByRole("button", { name: "Add to cart" }).click();

        await expect(page).toHaveURL("/order");
        await expect(order(page).locator("cart-item .name")).toHaveText(["Cappuccino"]);
        await expect(badge(page)).toHaveText("1");
    });

    test("Back link returns to the menu", async ({ page }) => {
        await page.goto("/product-12");
        await expect(details(page).locator("h2")).toHaveText("Cappuccino");
        await details(page).getByRole("link", { name: "Back" }).click();
        await expect(page).toHaveURL("/");
        await expect(menu(page).locator("product-item").first()).toBeVisible();
    });
});

test.describe("Order page", () => {
    test("shows empty state with no items", async ({ page }) => {
        await page.goto("/order");
        await expect(order(page).locator(".empty")).toHaveText("Your order is empty");
    });

    test("lists items, quantities and total", async ({ page }) => {
        await page.goto("/");
        const items = menu(page).locator("product-item");
        await items.nth(0).getByRole("button", { name: "Add" }).click(); // Black Americano 1.50
        await items.nth(0).getByRole("button", { name: "Add" }).click();
        await items.nth(1).getByRole("button", { name: "Add" }).click(); // Cappuccino 3.75
        await expect(badge(page)).toHaveText("3");

        await page.locator("#linkOrder").click();
        await expect(page).toHaveURL("/order");
        await expect(order(page).locator("cart-item .qty")).toHaveText(["2", "1"]);
        await expect(order(page).locator("cart-item .name")).toHaveText(["Black Americano", "Cappuccino"]);
        await expect(order(page).locator(".price-total")).toHaveText("$6.75");
    });

    test("deleting an item updates the cart and total", async ({ page }) => {
        await page.goto("/");
        const items = menu(page).locator("product-item");
        await items.nth(0).getByRole("button", { name: "Add" }).click();
        await items.nth(1).getByRole("button", { name: "Add" }).click();
        await expect(badge(page)).toHaveText("2");
        await page.locator("#linkOrder").click();

        await order(page).locator("cart-item").first().locator(".delete-button").click();
        await expect(order(page).locator("cart-item .name")).toHaveText(["Cappuccino"]);
        await expect(order(page).locator(".price-total")).toHaveText("$3.75");
        await expect(badge(page)).toHaveText("1");

        await order(page).locator("cart-item .delete-button").click();
        await expect(order(page).locator(".empty")).toBeVisible();
        await expect(badge(page)).toBeHidden();
    });

    test("submitting the form thanks the user by name", async ({ page }) => {
        await page.goto("/product-11");
        await details(page).getByRole("button", { name: "Add to cart" }).click();
        await expect(page).toHaveURL("/order");

        await order(page).locator("input[name=name]").fill("Alex");
        await order(page).locator("input[name=phone]").fill("555-1234");
        await order(page).locator("input[name=email]").fill("alex@example.com");

        await order(page).getByRole("button", { name: "Place Order" }).click();
        await expect(page).toHaveURL("/order/confirmed");
        await expect(page.locator("confirmation-page h2")).toHaveText("Thank you, Alex!");
    });
});

test.describe("Routing", () => {
    test("nav links switch pages", async ({ page }) => {
        await page.goto("/");
        await page.locator("#linkOrder").click();
        await expect(page).toHaveURL("/order");
        await expect(order(page)).toBeVisible();
        await page.locator("#linkHome").click();
        await expect(page).toHaveURL("/");
        await expect(menu(page)).toBeVisible();
    });

    test("browser back button returns to previous page", async ({ page }) => {
        await page.goto("/");
        await menu(page).locator("product-item").first().locator("h4").click();
        await expect(page).toHaveURL("/product-11");
        await page.goBack();
        await expect(page).toHaveURL("/");
        await expect(menu(page).locator("product-item").first()).toBeVisible();
    });

    test("unknown route shows 404", async ({ page }) => {
        await page.goto("/does-not-exist");
        await expect(page.locator("main")).toHaveText("Oups, 404!");
    });
});
