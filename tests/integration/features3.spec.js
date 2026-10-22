import { test, expect } from "@playwright/test";

const menu = page => page.locator("menu-page");
const order = page => page.locator("order-page");
const orders = page => page.locator("orders-page");
const confirmation = page => page.locator("confirmation-page");
const card = (page, name) => menu(page).locator("product-item").filter({ has: page.locator(`h4:text-is("${name}")`) }).first();
const themeButton = page => page.locator("#theme");
const bodyBackground = page => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

const LIGHT_BG = "rgb(250, 247, 242)";
const DARK_BG = "rgb(23, 18, 16)";

test.beforeEach(async ({ page }) => {
    page.errors = [];
    page.on("pageerror", e => page.errors.push(e.message));
});
test.afterEach(async ({ page }) => {
    expect(page.errors).toEqual([]);
});

test.describe("13. Dark mode", () => {
    test("light by default, toggles to dark and back, and remembers", async ({ page }) => {
        await page.goto("/");
        expect(await bodyBackground(page)).toBe(LIGHT_BG);
        await expect(themeButton(page)).toHaveAccessibleName("Switch to dark theme");

        await themeButton(page).click();
        await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
        expect(await bodyBackground(page)).toBe(DARK_BG);
        await expect(themeButton(page)).toHaveAccessibleName("Switch to light theme");

        await page.reload();
        expect(await bodyBackground(page)).toBe(DARK_BG);

        await themeButton(page).click();
        expect(await bodyBackground(page)).toBe(LIGHT_BG);
        await page.reload();
        expect(await bodyBackground(page)).toBe(LIGHT_BG);
    });

    test("the toggle label is translated", async ({ page }) => {
        await page.goto("/");
        await page.getByRole("button", { name: "ភាសាខ្មែរ" }).click();
        await expect(themeButton(page)).toHaveAccessibleName("ប្តូរទៅផ្ទៃងងឹត");
    });

    test.describe("with a dark system setting", () => {
        test.use({ colorScheme: "dark" });

        test("follows the system", async ({ page }) => {
            await page.goto("/");
            expect(await bodyBackground(page)).toBe(DARK_BG);
            await expect(themeButton(page)).toHaveAccessibleName("Switch to light theme");
        });

        test("a saved choice overrides the system", async ({ page }) => {
            await page.addInitScript(() => localStorage.setItem("cm-theme", "light"));
            await page.goto("/");
            expect(await bodyBackground(page)).toBe(LIGHT_BG);
        });
    });

    test("a saved theme applies before the app code runs (no flash)", async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem("cm-theme", "dark"));
        await page.route("**/app.js", route => route.abort());
        await page.goto("/");
        expect(await bodyBackground(page)).toBe(DARK_BG);
    });

    // WCAG AA: normal text needs a contrast ratio of at least 4.5:1
    function lowContrastIn(page, host, selector) {
        return page.evaluate(([host, selector]) => {
            const rgb = c => c.match(/[\d.]+/g).slice(0, 4).map(Number);
            const luminance = ([r, g, b]) => {
                const f = v => (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
                return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
            };
            // Nearest ancestor with an opaque background, crossing shadow roots
            const background = el => {
                for (let node = el; node; node = node.parentElement ?? node.getRootNode().host) {
                    const c = rgb(getComputedStyle(node).backgroundColor);
                    if (c.length < 4 || c[3] > 0.5) return c;
                }
                return [255, 255, 255];
            };
            const ratio = (a, b) => {
                const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
                return (l1 + 0.05) / (l2 + 0.05);
            };
            return [...document.querySelector(host).shadowRoot.querySelectorAll(selector)]
                .filter(el => el.textContent.trim() && !el.closest("[aria-hidden]") && !el.classList.contains("icon"))
                .map(el => [el.className || el.tagName, ratio(rgb(getComputedStyle(el).color), background(el))])
                .filter(([, r]) => r < 4.5)
                .map(([name, r]) => `${host} ${name}: ${r.toFixed(2)}`);
        }, [host, selector]);
    }

    for (const theme of ["light", "dark"]) {
        test(`text stays readable in the ${theme} theme`, async ({ page }) => {
            await page.addInitScript(t => localStorage.setItem("cm-theme", t), theme);
            await page.goto("/");
            await expect(card(page, "Cappuccino")).toBeVisible();
            expect(await lowContrastIn(page, "menu-page",
                ".greeting, h3, h4, .price, button.add, .chips button")).toEqual([]);

            await card(page, "Cappuccino").getByRole("button", { name: "Add" }).click();
            await page.locator("#linkOrder").click();
            await order(page).getByLabel("Your Name").fill("Alex");
            await order(page).getByRole("button", { name: "Place Order" }).click();
            await expect(order(page).locator("#phone-error")).not.toBeEmpty();
            expect(await lowContrastIn(page, "order-page",
                "h2, label, input, .name, .options, .price, .qty, .price-total, .total, .error, button, .loyalty p")).toEqual([]);

            await page.goto("/product-12");
            await expect(page.locator("details-page h2")).toHaveText("Cappuccino");
            expect(await lowContrastIn(page, "details-page",
                "h2, .description, legend, label, .extra, .price, button, a.back")).toEqual([]);
        });
    }
});

async function addAndOpenOrder(page, ...names) {
    await page.goto("/");
    for (const name of names) {
        await card(page, name).getByRole("button", { name: "Add" }).click();
    }
    await page.locator("#linkOrder").click();
}

async function checkout(page) {
    await order(page).getByLabel("Your Name").fill("Alex");
    await order(page).getByLabel("Your Phone Number").fill("012 345 678");
    await order(page).getByRole("button", { name: "Place Order" }).click();
    await expect(page).toHaveURL("/order/confirmed");
}

const loyalty = page => order(page).locator(".loyalty");
const rewardBox = page => order(page).getByRole("checkbox", { name: /Use my free drink/ });

test.describe("14. Loyalty points", () => {
    test("a new customer starts at 0 and earns a point per dollar", async ({ page }) => {
        await addAndOpenOrder(page, "Black Americano", "Black Americano", "Cappuccino");
        await expect(loyalty(page).locator(".points")).toHaveText("0 / 50 points");
        await expect(loyalty(page).locator(".hint")).toHaveText("50 more points for a free drink");
        await expect(loyalty(page).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");

        await checkout(page); // $6.75
        await expect(confirmation(page).locator(".points")).toHaveText("+6 points · You now have 6 points");

        await page.reload();
        await page.goto("/");
        await card(page, "Croissant").getByRole("button", { name: "Add" }).click();
        await page.locator("#linkOrder").click();
        await expect(loyalty(page).locator(".points")).toHaveText("6 / 50 points");
        await expect(loyalty(page).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "6");
    });

    test("reaching 50 announces the free drink", async ({ page }) => {
        await page.addInitScript(() => {
            if (!localStorage.getItem("cm-points")) localStorage.setItem("cm-points", "48");
        });
        await addAndOpenOrder(page, "Croissant");
        await expect(loyalty(page).locator(".hint")).toHaveText("2 more points for a free drink");
        await checkout(page); // $2.80
        await expect(confirmation(page).locator(".points")).toHaveText("+2 points · You now have 50 points");
        await expect(confirmation(page).locator(".reward-ready")).toHaveText("You've earned a free drink! Use it on your next order.");
    });

    test.describe("with 50 points", () => {
        test.beforeEach(async ({ page }) => {
            await page.addInitScript(() => {
                if (!localStorage.getItem("cm-points")) localStorage.setItem("cm-points", "50");
            });
        });

        test("the free drink covers the most expensive drink", async ({ page }) => {
            await page.goto("/product-12");
            await page.locator("details-page").getByRole("radio", { name: /^Large/ }).check();
            await page.locator("details-page").getByRole("button", { name: "Add to cart" }).click();
            await page.goto("/");
            await card(page, "Black Americano").getByRole("button", { name: "Add" }).click();
            await card(page, "Croissant").getByRole("button", { name: "Add" }).click();
            await page.locator("#linkOrder").click();

            await expect(order(page).locator(".price-total")).toHaveText("$9.05");
            await expect(rewardBox(page)).not.toBeChecked();
            await expect(rewardBox(page)).toHaveAccessibleName("Use my free drink (−$4.75)");

            await rewardBox(page).check();
            await expect(rewardBox(page)).toBeFocused();
            await expect(order(page).locator(".reward-label")).toHaveText("Free drink");
            await expect(order(page).locator(".reward-amount")).toHaveText("−$4.75");
            await expect(order(page).locator(".price-total")).toHaveText("$4.30");

            await checkout(page);
            await expect(confirmation(page).locator(".reward-line")).toHaveText(/Free drink\s*−\$4\.75/);
            await expect(confirmation(page).locator(".total")).toHaveText("Total $4.30");
            // 50 spent on the reward, 4 earned on $4.30
            await expect(confirmation(page).locator(".points")).toHaveText("+4 points · You now have 4 points");

            await page.getByRole("link", { name: "Order history" }).click();
            await expect(orders(page).locator("article .total")).toHaveText(["$4.30"]);
            await expect(orders(page).locator(".balance")).toHaveText("You have 4 points");
        });

        test("snacks alone can't use the reward", async ({ page }) => {
            await addAndOpenOrder(page, "Croissant");
            await expect(rewardBox(page)).toHaveCount(0);
            await expect(loyalty(page).locator(".hint")).toHaveText("You have a free drink! Add a drink to use it.");
        });

        test("not using the reward keeps the points and adds more", async ({ page }) => {
            await addAndOpenOrder(page, "Cappuccino");
            await checkout(page);
            await expect(confirmation(page).locator(".reward-line")).toHaveCount(0);
            await expect(confirmation(page).locator(".points")).toHaveText("+3 points · You now have 53 points");
        });

        test("removing the drink removes the discount", async ({ page }) => {
            await addAndOpenOrder(page, "Cappuccino", "Croissant");
            await rewardBox(page).check();
            await expect(order(page).locator(".price-total")).toHaveText("$2.80");
            await order(page).getByRole("button", { name: "Remove Cappuccino" }).click();
            await expect(order(page).locator(".reward-amount")).toHaveCount(0);
            await expect(order(page).locator(".price-total")).toHaveText("$2.80");
            await checkout(page);
            await expect(confirmation(page).locator(".points")).toHaveText("+2 points · You now have 52 points");
        });

        test("the reward choice survives a cart change", async ({ page }) => {
            await addAndOpenOrder(page, "Cappuccino");
            await rewardBox(page).check();
            await order(page).getByRole("button", { name: "Increase quantity of Cappuccino" }).click();
            await expect(rewardBox(page)).toBeChecked();
            await expect(order(page).locator(".price-total")).toHaveText("$3.75");
        });
    });

    test("loyalty text is translated", async ({ page }) => {
        await addAndOpenOrder(page, "Cappuccino");
        await page.getByRole("button", { name: "ភាសាខ្មែរ" }).click();
        await expect(loyalty(page).locator(".points")).toHaveText("0 / 50 ពិន្ទុ");
    });
});
