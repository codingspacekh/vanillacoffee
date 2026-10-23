import { test, expect } from "@playwright/test";

const menu = page => page.locator("menu-page");
const order = page => page.locator("order-page");
const orders = page => page.locator("orders-page");
const confirmation = page => page.locator("confirmation-page");
const toast = page => page.locator("toast-message");
const card = (page, name) => menu(page).locator("product-item").filter({ has: page.locator(`h4:text-is("${name}")`) }).first();
const pickup = page => order(page).getByLabel("Pickup time");
const currentStep = page => confirmation(page).locator("ol.steps li[aria-current=step] .label");

// 09:07 UTC, so the first pickup slot is 09:30
const NOW = new Date("2026-10-23T09:07:00Z");

test.use({ timezoneId: "UTC", locale: "en-US" });

test.beforeEach(async ({ page }) => {
    page.errors = [];
    page.on("pageerror", e => page.errors.push(e.message));
});
test.afterEach(async ({ page }) => {
    expect(page.errors).toEqual([]);
});

async function addFromMenu(page, name, times = 1) {
    await page.goto("/");
    for (let i = 0; i < times; i++) {
        await card(page, name).getByRole("button", { name: "Add" }).click();
    }
    await page.locator("#linkOrder").click();
}

async function fillAndPlace(page, { slot } = {}) {
    await order(page).getByLabel("Your Name").fill("Alex");
    await order(page).getByLabel("Your Phone Number").fill("012 345 678");
    if (slot) {
        await pickup(page).selectOption({ label: slot });
    }
    await order(page).getByRole("button", { name: "Place Order" }).click();
    await expect(page).toHaveURL("/order/confirmed");
}

test.describe("15. Pickup time", () => {
    test.beforeEach(async ({ page }) => {
        await page.clock.install({ time: NOW });
    });

    test("ASAP is the default, then the next quarter hours", async ({ page }) => {
        await addFromMenu(page, "Cappuccino");
        await expect(pickup(page)).toHaveValue("asap");
        await expect(pickup(page).locator("option")).toHaveText([
            "As soon as possible",
            "9:30 AM", "9:45 AM", "10:00 AM", "10:15 AM", "10:30 AM", "10:45 AM", "11:00 AM", "11:15 AM",
        ]);
    });

    test("the chosen time shows on the confirmation and in the history", async ({ page }) => {
        await addFromMenu(page, "Cappuccino");
        await fillAndPlace(page, { slot: "9:45 AM" });
        await expect(confirmation(page).locator(".pickup")).toHaveText("Pickup at 9:45 AM");
        await page.locator("#linkOrders").click();
        await expect(orders(page).locator(".pickup")).toHaveText("Pickup at 9:45 AM");
    });

    test("an ASAP order says so", async ({ page }) => {
        await addFromMenu(page, "Cappuccino");
        await fillAndPlace(page);
        await expect(confirmation(page).locator(".pickup")).toHaveText("Pickup as soon as possible");
    });

    test("the choice survives a cart change", async ({ page }) => {
        await addFromMenu(page, "Cappuccino");
        await pickup(page).selectOption({ label: "10:00 AM" });
        await order(page).getByRole("button", { name: "Increase quantity of Cappuccino" }).click();
        await expect(order(page).locator("cart-item .qty")).toHaveText("2");
        await expect(pickup(page).locator("option:checked")).toHaveText("10:00 AM");
    });

    test("a time that has become too soon is rejected", async ({ page }) => {
        await addFromMenu(page, "Cappuccino");
        await pickup(page).selectOption({ label: "9:30 AM" });
        await page.clock.fastForward("20:00");
        await order(page).getByLabel("Your Name").fill("Alex");
        await order(page).getByLabel("Your Phone Number").fill("012 345 678");
        await order(page).getByRole("button", { name: "Place Order" }).click();
        await expect(order(page).locator("#pickup-error")).toHaveText("That time is too soon now, please choose another");
        await expect(page).toHaveURL("/order");

        await pickup(page).selectOption("asap");
        await order(page).getByRole("button", { name: "Place Order" }).click();
        await expect(page).toHaveURL("/order/confirmed");
    });
});

test.describe("16. Order status", () => {
    test.beforeEach(async ({ page }) => {
        await page.clock.install({ time: NOW });
    });

    test("an ASAP order steps through Received, Preparing and Ready", async ({ page }) => {
        await addFromMenu(page, "Cappuccino");
        await fillAndPlace(page);
        await expect(confirmation(page).locator("ol.steps .label")).toHaveText(["Received", "Preparing", "Ready"]);
        await expect(currentStep(page)).toHaveText("Received");
        await expect(confirmation(page).locator(".status-text")).toHaveText("We've got your order. Ready around 9:14 AM.");

        await page.clock.fastForward("02:00");
        await expect(currentStep(page)).toHaveText("Preparing");
        await expect(confirmation(page).locator("ol.steps li.done .label")).toHaveText(["Received"]);
        await expect(confirmation(page).locator(".status-text")).toHaveText("We're making your order. Ready around 9:14 AM.");

        await page.clock.fastForward("05:00");
        await expect(currentStep(page)).toHaveText("Ready");
        await expect(confirmation(page).locator(".status-text")).toHaveText("Your order is ready to pick up!");
        await expect(toast(page)).toContainText("Your order is ready to pick up!");
    });

    test("a scheduled order is prepared shortly before its pickup time", async ({ page }) => {
        await addFromMenu(page, "Cappuccino");
        await fillAndPlace(page, { slot: "9:45 AM" });
        await page.clock.fastForward("32:00");
        await expect(currentStep(page)).toHaveText("Received");
        await page.clock.fastForward("01:00");
        await expect(currentStep(page)).toHaveText("Preparing");
    });

    test("asks to notify, then notifies when ready on any page", async ({ page }) => {
        await page.addInitScript(() => {
            window.shown = [];
            class FakeNotification {
                static permission = "default";
                static async requestPermission() {
                    return FakeNotification.permission = "granted";
                }
                constructor(title) {
                    window.shown.push(title);
                }
            }
            window.Notification = FakeNotification;
            ServiceWorkerRegistration.prototype.showNotification = async title => {
                window.shown.push(title);
            };
        });
        await addFromMenu(page, "Cappuccino");
        await fillAndPlace(page);

        await confirmation(page).getByRole("button", { name: "Notify me when it's ready" }).click();
        await expect(confirmation(page).getByRole("button", { name: "Notify me when it's ready" })).toBeHidden();
        await expect(confirmation(page).locator(".notify-on")).toBeFocused();

        await page.locator("#linkHome").click();
        await page.clock.fastForward("07:00");
        await expect.poll(() => page.evaluate(() => window.shown)).toEqual(["Order #1001 is ready"]);
        await expect(toast(page)).toContainText("Your order is ready to pick up!");
    });
});

test.describe("16. Order status after a reload", () => {
    test("the status is worked out from when the order was placed", async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem("cm-last-order", JSON.stringify({
            number: 1001, placedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(), pickup: "asap",
            customer: { name: "Alex" }, items: [], total: 0,
        })));
        await page.goto("/order/confirmed");
        await expect(currentStep(page)).toHaveText("Preparing");
    });

    test("orders placed before pickup times existed show no tracker", async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem("cm-last-order", JSON.stringify({
            number: 1001, customer: { name: "Alex" }, items: [], total: 0,
        })));
        await page.goto("/order/confirmed");
        await expect(confirmation(page).locator("h2")).toHaveText("Thank you, Alex!");
        await expect(confirmation(page).locator(".tracker, .pickup")).toHaveCount(0);
    });
});

test.describe("17. Item notes", () => {
    const note = page => page.locator("details-page").getByLabel("Note for the barista (optional)");

    async function addWithNote(page, text) {
        await page.goto("/product-12");
        await note(page).fill(text);
        await page.locator("details-page").getByRole("button", { name: "Add to cart" }).click();
        await expect(page).toHaveURL("/order");
    }

    test("the note shows in the cart, on the confirmation and in the history", async ({ page }) => {
        await addWithNote(page, "  extra hot  ");
        await expect(order(page).locator("cart-item .note")).toHaveText("Note: extra hot");
        await fillAndPlace(page);
        await expect(confirmation(page).locator("li .note")).toHaveText("Note: extra hot");
        await page.locator("#linkOrders").click();
        await expect(orders(page).locator(".items")).toHaveText("1x Cappuccino (Note: extra hot)");
    });

    test("different notes are separate lines; the same note merges", async ({ page }) => {
        await addWithNote(page, "extra hot");
        await addWithNote(page, "extra hot");
        await addWithNote(page, "");
        await expect(order(page).locator("cart-item .qty")).toHaveText(["2", "1"]);
        await expect(order(page).locator("cart-item .note:visible")).toHaveText(["Note: extra hot"]);
    });

    test("the note is shown as text, not HTML, and kept short", async ({ page }) => {
        await page.goto("/product-12");
        await expect(note(page)).toHaveAttribute("maxlength", "60");
        await addWithNote(page, "<b>bold</b>");
        await expect(order(page).locator("cart-item .note")).toHaveText("Note: <b>bold</b>");
        await expect(order(page).locator("cart-item .note b")).toHaveCount(0);
    });

    test("reorder keeps the notes", async ({ page }) => {
        await addWithNote(page, "no lid");
        await fillAndPlace(page);
        await page.locator("#linkOrders").click();
        await orders(page).getByRole("button", { name: "Reorder order #1001" }).click();
        await expect(page).toHaveURL("/order");
        await expect(order(page).locator("cart-item .note")).toHaveText("Note: no lid");
    });

    test("a cart saved before notes existed still loads", async ({ page }) => {
        await page.goto("/product-12");
        const product = await page.evaluate(async () => (await (await fetch("/data/menu.json")).json())[0].products[1]);
        await page.evaluate(product => localStorage.setItem("cm-cart",
            JSON.stringify([{ product, quantity: 1, options: {}, key: "12", unitPrice: 3.75 }])), product);
        await addWithNote(page, "");
        await expect(order(page).locator("cart-item .qty")).toHaveText("2");
    });
});

test.describe("18. Promo codes", () => {
    const code = page => order(page).getByLabel("Promo code");
    const apply = page => order(page).getByRole("button", { name: "Apply" });
    const total = page => order(page).locator(".price-total");

    test("WELCOME10 takes 10% off, in any case", async ({ page }) => {
        await addFromMenu(page, "Cappuccino", 2);
        await code(page).fill(" welcome10 ");
        await apply(page).click();
        await expect(order(page).locator(".applied .code")).toHaveText("WELCOME10 applied");
        await expect(order(page).locator("li.promo-line")).toHaveText(/Promo WELCOME10\s*−\$0\.75/);
        await expect(total(page)).toHaveText("$6.75");
        await expect(order(page).getByRole("button", { name: "Remove promo code WELCOME10" })).toBeFocused();
    });

    test("an empty or unknown code shows an error", async ({ page }) => {
        await addFromMenu(page, "Cappuccino");
        await apply(page).click();
        await expect(order(page).locator("#promo-error")).toHaveText("Please enter a promo code");
        await code(page).fill("NOPE");
        await code(page).press("Enter");
        await expect(order(page).locator("#promo-error")).toHaveText("That code isn't valid");
        await expect(code(page)).toHaveAttribute("aria-invalid", "true");
        await expect(total(page)).toHaveText("$3.75");
        await expect(page).toHaveURL("/order");
    });

    test("SAVE2 needs $10, and stops applying if the cart drops below it", async ({ page }) => {
        await addFromMenu(page, "Cappuccino", 2);
        await code(page).fill("SAVE2");
        await apply(page).click();
        await expect(order(page).locator("#promo-error")).toHaveText("SAVE2 needs an order of $10.00 or more");

        await order(page).getByRole("button", { name: "Increase quantity of Cappuccino" }).click();
        await code(page).fill("SAVE2");
        await apply(page).click();
        await expect(total(page)).toHaveText("$9.25");

        await order(page).getByRole("button", { name: "Decrease quantity of Cappuccino" }).click();
        await expect(order(page).locator(".applied .code")).toHaveText("SAVE2 applied");
        await expect(order(page).locator("#promo-error")).toHaveText("SAVE2 needs an order of $10.00 or more");
        await expect(order(page).locator("li.promo-line")).toHaveCount(0);
        await expect(total(page)).toHaveText("$7.50");
    });

    test("removing the code restores the total", async ({ page }) => {
        await addFromMenu(page, "Cappuccino", 2);
        await code(page).fill("WELCOME10");
        await apply(page).click();
        await order(page).getByRole("button", { name: "Remove promo code WELCOME10" }).click();
        await expect(code(page)).toBeFocused();
        await expect(total(page)).toHaveText("$7.50");
    });

    test("the code applies after the free drink and is saved with the order", async ({ page }) => {
        await page.addInitScript(() => {
            if (!localStorage.getItem("cm-points")) localStorage.setItem("cm-points", "50");
        });
        await page.goto("/");
        await card(page, "Cappuccino").getByRole("button", { name: "Add" }).click();
        await card(page, "Croissant").getByRole("button", { name: "Add" }).click();
        await page.locator("#linkOrder").click();
        await order(page).getByLabel(/Use my free drink/).check();
        await code(page).fill("WELCOME10");
        await apply(page).click();
        await expect(total(page)).toHaveText("$2.52");

        await fillAndPlace(page);
        await expect(confirmation(page).locator("li.reward-line")).toHaveText([/Free drink\s*−\$3\.75/, /Promo WELCOME10\s*−\$0\.28/]);
        await expect(confirmation(page).locator(".total")).toHaveText("Total $2.52");
        await expect(confirmation(page).locator(".points")).toHaveText("+2 points · You now have 2 points");

        // The code is used up with the order
        await addFromMenu(page, "Cappuccino");
        await expect(code(page)).toHaveValue("");
        await expect(total(page)).toHaveText("$3.75");
    });
});
