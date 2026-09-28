import { test, expect } from "@playwright/test";

const menu = page => page.locator("menu-page");
const details = page => page.locator("details-page");
const order = page => page.locator("order-page");
const orders = page => page.locator("orders-page");
const confirmation = page => page.locator("confirmation-page");
const toast = page => page.locator("toast-message");
const productNames = page => menu(page).locator("product-item h4");
const toKhmer = page => page.getByRole("button", { name: "ភាសាខ្មែរ" });
const toEnglish = page => page.getByRole("button", { name: "English" });

test.beforeEach(async ({ page }) => {
    page.errors = [];
    page.on("pageerror", e => page.errors.push(e.message));
});
test.afterEach(async ({ page }) => {
    expect(page.errors).toEqual([]);
});

test("English by default, switches to Khmer and back", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(productNames(page).first()).toHaveText("Black Americano");

    await toKhmer(page).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "km");
    await expect(menu(page).locator("h3").first()).toHaveText("កាហ្វេក្តៅ");
    await expect(productNames(page).nth(1)).toHaveText("កាពូឈីណូ");
    await expect(menu(page).getByRole("button", { name: "បន្ថែម", exact: true }).first()).toBeVisible();
    await expect(menu(page).getByRole("searchbox", { name: "ស្វែងរកក្នុងម៉ឺនុយ" })).toBeVisible();
    await expect(menu(page).getByRole("button", { name: "ទាំងអស់" })).toBeVisible();
    await expect(page.getByRole("link", { name: "កន្ត្រកទំនិញ" })).toBeVisible();
    await expect(page.getByRole("link", { name: "ប្រវត្តិការបញ្ជាទិញ" })).toBeVisible();

    await toEnglish(page).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(productNames(page).nth(1)).toHaveText("Cappuccino");
});

test("the choice is remembered", async ({ page }) => {
    await page.goto("/");
    await toKhmer(page).click();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "km");
    await expect(productNames(page).first()).toHaveText("អាមេរិកាណូខ្មៅ");
});

test.describe("with a Khmer browser", () => {
    test.use({ locale: "km-KH" });

    test("Khmer is the default", async ({ page }) => {
        await page.goto("/");
        await expect(page.locator("html")).toHaveAttribute("lang", "km");
        await expect(menu(page).locator("h3").first()).toHaveText("កាហ្វេក្តៅ");
    });
});

test("switching keeps the page and the filter", async ({ page }) => {
    await page.goto("/?category=tea");
    await expect(productNames(page)).toHaveText(["Green Tea", "Black Tea"]);
    await toKhmer(page).click();
    await expect(page).toHaveURL("/?category=tea");
    await expect(productNames(page)).toHaveText(["តែបៃតង", "តែខ្មៅ"]);
    await expect(menu(page).getByRole("button", { name: "តែ", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("search matches Khmer and English names", async ({ page }) => {
    await page.goto("/");
    await toKhmer(page).click();
    const search = menu(page).getByRole("searchbox");
    await search.fill("បៃតង");
    await expect(productNames(page)).toHaveText(["តែបៃតង"]);
    await search.fill("cap");
    await expect(productNames(page)).toHaveText(["កាពូឈីណូ"]);
    await search.fill("zzz");
    await expect(menu(page).locator(".no-results")).toContainText("zzz");
    await expect(menu(page).getByRole("button", { name: "សម្អាតតម្រង" })).toBeVisible();
});

test("details page, options and toast in Khmer", async ({ page }) => {
    await page.goto("/product-12");
    await toKhmer(page).click();
    await expect(page).toHaveURL("/product-12");
    const d = details(page);
    await expect(d.locator("h2")).toHaveText("កាពូឈីណូ");
    await expect(d.locator(".description")).not.toContainText("espresso");
    await expect(d.getByRole("group", { name: "ទំហំ" })).toBeVisible();
    await d.getByRole("radio", { name: /^ធំ/ }).check();
    await expect(d.locator(".price")).toHaveText("$ 4.75 ក្នុងមួយ");

    await d.getByRole("button", { name: "ដាក់ចូលកន្ត្រក" }).click();
    await expect(toast(page)).toHaveText("បានដាក់ កាពូឈីណូ ចូលកន្ត្រក");
    const item = order(page).locator("cart-item");
    await expect(item.locator(".name")).toHaveText("កាពូឈីណូ");
    await expect(item.locator(".options")).toHaveText("ទំហំ: ធំ");
    await expect(item.getByRole("button", { name: "បង្កើនចំនួន កាពូឈីណូ" })).toBeVisible();
});

test("order form, validation, confirmation and history in Khmer", async ({ page }) => {
    await page.goto("/");
    await toKhmer(page).click();
    await menu(page).getByRole("button", { name: "បន្ថែម", exact: true }).first().click();
    await page.getByRole("link", { name: "កន្ត្រកទំនិញ" }).click();

    await expect(order(page).locator("h2")).toHaveText("ការបញ្ជាទិញរបស់អ្នក");
    await expect(order(page).locator(".total")).toHaveText("សរុប");
    await order(page).getByRole("button", { name: "បញ្ជាទិញ" }).click();
    await expect(order(page).locator("#name-error")).toHaveText("សូមបញ្ចូលឈ្មោះរបស់អ្នក");
    await expect(order(page).locator("#phone-error")).toHaveText("សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នក");

    await order(page).getByLabel("ឈ្មោះរបស់អ្នក").fill("សុខា");
    await order(page).getByLabel("លេខទូរស័ព្ទរបស់អ្នក").fill("012 345 678");
    await order(page).getByRole("button", { name: "បញ្ជាទិញ" }).click();

    await expect(confirmation(page).locator("h2")).toHaveText("សូមអរគុណ សុខា!");
    await expect(confirmation(page).locator(".number")).toHaveText("ការបញ្ជាទិញ #1001");
    await expect(confirmation(page).locator(".total")).toHaveText("សរុប $1.50");

    await page.getByRole("link", { name: "ប្រវត្តិការបញ្ជាទិញ" }).click();
    await expect(orders(page).locator("h2")).toHaveText("ប្រវត្តិការបញ្ជាទិញ");
    await expect(orders(page).locator(".items")).toHaveText("1x អាមេរិកាណូខ្មៅ");
    await expect(orders(page).getByRole("button", { name: "បញ្ជាទិញម្តងទៀតនូវការបញ្ជាទិញ #1001" })).toBeVisible();
});

test("switching language keeps what was typed in the order form", async ({ page }) => {
    await page.goto("/");
    await menu(page).getByRole("button", { name: "Add" }).first().click();
    await page.locator("#linkOrder").click();
    await order(page).getByLabel("Your Name").fill("Alex");
    await order(page).getByLabel("Your Name").blur();
    await toKhmer(page).click();
    await expect(order(page).getByLabel("ឈ្មោះរបស់អ្នក")).toHaveValue("Alex");
});

test("404 page is translated", async ({ page }) => {
    await page.goto("/nope");
    await toKhmer(page).click();
    await expect(page.locator("main")).toHaveText("រកមិនឃើញទំព័រ (404)");
});

test("every UI string and menu item has both languages", async ({ page }) => {
    await page.goto("/");
    const missing = await page.evaluate(async () => {
        const { dictionaries } = await import("/services/I18n.js");
        const problems = [];
        const en = Object.keys(dictionaries.en).sort();
        const km = Object.keys(dictionaries.km).sort();
        for (const key of en) if (!km.includes(key)) problems.push(`km missing ${key}`);
        for (const key of km) if (!en.includes(key)) problems.push(`en missing ${key}`);
        for (const el of [document, ...[...document.querySelectorAll("template")].map(t => t.content)]
            .flatMap(root => [...root.querySelectorAll("[data-i18n], [data-i18n-label], [data-i18n-placeholder]")])) {
            const key = el.dataset.i18n ?? el.dataset.i18nLabel ?? el.dataset.i18nPlaceholder;
            if (!(key in dictionaries.en)) problems.push(`template key ${key}`);
        }
        const menu = await (await fetch("/data/menu.json")).json();
        for (const category of menu) {
            if (!category.translations?.km?.name) problems.push(`category ${category.name}`);
            for (const product of category.products) {
                if (!product.translations?.km?.name) problems.push(`name ${product.name}`);
                if (!product.translations?.km?.description) problems.push(`description ${product.name}`);
                for (const group of product.options ?? []) {
                    if (!(`option.${group.name}` in dictionaries.km)) problems.push(`option ${group.name}`);
                    for (const choice of group.choices) {
                        if (!(`choice.${choice.label}` in dictionaries.km)) problems.push(`choice ${choice.label}`);
                    }
                }
            }
        }
        return problems;
    });
    expect(missing).toEqual([]);
});

test("Khmer text uses a Khmer font", async ({ page }) => {
    await page.goto("/");
    const fonts = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(fonts).toContain("Noto Sans Khmer");
});
