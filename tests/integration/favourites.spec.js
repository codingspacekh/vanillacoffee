import { test, expect } from "@playwright/test";

const menu = page => page.locator("menu-page");
const favourites = page => page.locator("favourites-page");
const badge = page => page.locator("#badge");
const card = (page, name) => menu(page).locator("product-item").filter({ has: page.locator(`h4:text-is("${name}")`) }).first();
const heart = (root, name) => root.getByRole("button", { name: `Favourite ${name}` });

test.beforeEach(async ({ page }) => {
    page.errors = [];
    page.on("pageerror", e => page.errors.push(e.message));
});
test.afterEach(async ({ page }) => {
    expect(page.errors).toEqual([]);
});

test("the Favourites tab opens the saved items, in menu order", async ({ page }) => {
    await page.goto("/");
    await heart(card(page, "Croissant"), "Croissant").click();
    await heart(card(page, "Cappuccino"), "Cappuccino").click();

    await page.getByRole("link", { name: "Favourites", exact: true }).click();
    await expect(page).toHaveURL("/favourites");
    await expect(page.locator("#linkFavourites")).toHaveAttribute("aria-current", "page");
    await expect(favourites(page).locator("h2")).toHaveText("Favourites");
    await expect(favourites(page).locator("product-item h4")).toHaveText(["Cappuccino", "Croissant"]);
});

test("un-hearting removes the item and keeps focus on a heart", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("cm-favourites", JSON.stringify([11, 12, 21])));
    await page.goto("/favourites");
    await expect(favourites(page).locator("product-item")).toHaveCount(3);

    await heart(favourites(page), "Cappuccino").click();
    await expect(favourites(page).locator("product-item h4")).not.toContainText(["Cappuccino"]);
    await expect(favourites(page).locator("product-item")).toHaveCount(2);
    const focused = await page.evaluate(() =>
        document.querySelector("favourites-page").shadowRoot.activeElement?.className);
    expect(focused).toBe("favourite");

    // The menu shows the change too
    await page.locator("#linkHome").click();
    await expect(heart(card(page, "Cappuccino"), "Cappuccino")).toHaveAttribute("aria-pressed", "false");
});

test("Add and opening a product work from the favourites page", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("cm-favourites", JSON.stringify([12])));
    await page.goto("/favourites");
    await favourites(page).getByRole("button", { name: "Add" }).click();
    await expect(badge(page)).toHaveText("1");
    await favourites(page).locator("product-item h4").click();
    await expect(page).toHaveURL("/product-12");
});

test("with no favourites, it explains how to add some and links to the menu", async ({ page }) => {
    await page.goto("/favourites");
    await expect(favourites(page).locator(".empty")).toHaveText("No favourites yet");
    await favourites(page).getByRole("link", { name: "Browse the menu" }).click();
    await expect(page).toHaveURL("/");
});

test("removing the last favourite shows the empty state", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("cm-favourites", JSON.stringify([12])));
    await page.goto("/favourites");
    await heart(favourites(page), "Cappuccino").click();
    await expect(favourites(page).locator(".empty")).toHaveText("No favourites yet");
});

test("the favourites page is translated", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("cm-favourites", JSON.stringify([12])));
    await page.goto("/favourites");
    await page.getByRole("button", { name: "ភាសាខ្មែរ" }).click();
    await expect(page.getByRole("link", { name: "ចំណូលចិត្ត", exact: true })).toBeVisible();
    await expect(favourites(page).locator("h2")).toHaveText("ចំណូលចិត្ត");
    await expect(page).toHaveURL("/favourites");
});
