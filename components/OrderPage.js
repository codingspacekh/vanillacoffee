import { adoptStyles } from "../services/Styles.js";
import { orderTotals, placeOrder } from "../services/Order.js";
import { hasReward, REWARD_POINTS, rewardItem } from "../services/Loyalty.js";
import { formatTime, t } from "../services/I18n.js";
import { formatPrice, roundCents } from "../services/Money.js";
import { ASAP, isValidPickup, pickupSlots } from "../services/Pickup.js";
import { normalizeCode, promoMinimum, promoProblem } from "../services/Promo.js";

// Each returns an error message, or "" when the field is valid
const validators = {
    name: input => input.value.trim() ? "" : t("order.error.name"),
    phone: input => {
        const value = input.value.trim();
        if (!value) {
            return t("order.error.phoneMissing");
        }
        const digits = value.replace(/\D/g, "").length;
        return /^\+?[\d\s-]+$/.test(value) && digits >= 7 && digits <= 15
            ? ""
            : t("order.error.phoneInvalid");
    },
    email: input => input.validity.typeMismatch ? t("order.error.email") : "",
    pickup: input => isValidPickup(input.value) ? "" : t("order.error.pickup"),
};

// What the customer has typed so far. It outlives the page element, so the
// details survive switching language or visiting the menu and coming back.
const draft = {
    name: "",
    phone: "",
    email: "",
    pickup: ASAP,
};

// Whether the customer ticked "Use my free drink"; kept across re-renders
const reward = { use: false };

// The promo code the customer applied, kept like the reward choice
const promo = { code: "" };

export class OrderPage extends HTMLElement {

    // Double data binding: writing a field also updates the form on screen
    #user = new Proxy(draft, {
        set: (target, property, value) => {
            target[property] = value;
            const form = this.root.querySelector("form.customer");
            if (form) {
                form.elements[property].value = value;
            }
            return true;
        }
    });

    constructor() {
        super();

        this.root = this.attachShadow({ mode: "open" });
        const section = document.createElement("section");
        this.root.appendChild(section);
        adoptStyles(this.root, "/styles/shared.css", "/styles/OrderPage.css");
        this.onCartChange = () => this.render();
        this.root.addEventListener("click", event => {
            if (event.target.closest("a.button")) {
                event.preventDefault();
                app.router.go("/");
            }
        });
    }

    connectedCallback() {
        window.addEventListener("appcartchange", this.onCartChange);
        this.render();
    }

    disconnectedCallback() {
        window.removeEventListener("appcartchange", this.onCartChange);
    }

    render() {
        const section = this.root.querySelector("section");
        if (app.store.cart.length == 0) {
            section.innerHTML = `
                <div class="empty-state">
                    <span class="icon" aria-hidden="true">shopping_bag</span>
                    <p class="empty">${t("order.empty")}</p>
                    <a href="/" class="button">${t("order.browse")}</a>
                </div>
            `;
            return;
        }

        section.innerHTML = `
            <h2>${t("order.title")}</h2>
            <ul class="summary"></ul>
        `;
        const template = document.getElementById("order-form-template");
        section.appendChild(template.content.cloneNode(true));

        const list = section.querySelector("ul.summary");
        for (const prodInCart of app.store.cart) {
            const item = document.createElement("cart-item");
            item.dataset.item = JSON.stringify(prodInCart);
            list.appendChild(item);
        }
        const { subtotal, discount, promoAmount, total } =
            orderTotals(app.store.cart, { useReward: reward.use, promoCode: promo.code });
        if (discount > 0) {
            list.insertAdjacentHTML("beforeend", `
                <li class='reward-line'>
                    <p class='reward-label'>${t("loyalty.rewardLine")}</p>
                    <p class='reward-amount'>−${formatPrice(discount)}</p>
                </li>
            `);
        }
        if (promoAmount > 0) {
            list.insertAdjacentHTML("beforeend", `
                <li class='promo-line'>
                    <p class='reward-label'>${t("promo.line", { code: promo.code })}</p>
                    <p class='reward-amount'>−${formatPrice(promoAmount)}</p>
                </li>
            `);
        }
        list.insertAdjacentHTML("beforeend", `
            <li>
                <p class='total'>${t("order.total")}</p>
                <p class='price-total'>${formatPrice(total)}</p>
            </li>
        `);
        const form = section.querySelector("form.customer");
        form.before(this.renderLoyalty(), this.renderPromo(roundCents(subtotal - discount)));
        this.renderPickupSlots(form.elements.pickup);
        this.setFormBindings(form);
    }

    // The code applied, or a field to enter one. amount is what the code
    // applies to: the total after the free drink.
    renderPromo(amount) {
        const panel = document.createElement("section");
        panel.className = "promo";
        if (promo.code) {
            panel.innerHTML = `
                <div class="applied">
                    <span class="icon" aria-hidden="true">sell</span>
                    <p class="code"></p>
                    <button type="button" class="remove-promo"></button>
                </div>
                <p class="error" id="promo-error" aria-live="polite"></p>
            `;
            panel.querySelector(".code").textContent = t("promo.applied", { code: promo.code });
            const remove = panel.querySelector("button.remove-promo");
            remove.textContent = t("promo.remove");
            remove.setAttribute("aria-label", t("promo.removeLabel", { code: promo.code }));
            remove.addEventListener("click", () => {
                promo.code = "";
                this.render();
                this.root.getElementById("promo").focus();
            });
            // The cart may have dropped below the code's minimum since it was applied
            panel.querySelector(".error").textContent = this.promoError(promo.code, amount);
            return panel;
        }

        panel.innerHTML = `
            <form novalidate>
                <label for="promo"></label>
                <div class="row">
                    <input id="promo" name="promo" autocomplete="off" autocapitalize="characters" aria-describedby="promo-error">
                    <button type="submit"></button>
                </div>
                <p class="error" id="promo-error" aria-live="polite"></p>
            </form>
        `;
        panel.querySelector("label").textContent = t("promo.label");
        panel.querySelector("button").textContent = t("promo.apply");
        const input = panel.querySelector("input");
        panel.querySelector("form").addEventListener("submit", event => {
            event.preventDefault();
            const code = normalizeCode(input.value);
            const error = code ? this.promoError(code, amount) : t("promo.error.empty");
            if (error) {
                this.root.getElementById("promo-error").textContent = error;
                input.setAttribute("aria-invalid", "true");
                input.focus();
                return;
            }
            promo.code = code;
            this.render();
            this.root.querySelector("button.remove-promo").focus();
        });
        return panel;
    }

    promoError(code, amount) {
        const problem = promoProblem(code, amount);
        if (problem == "unknown") {
            return t("promo.error.unknown");
        }
        return problem == "minimum"
            ? t("promo.error.minimum", { code, minimum: formatPrice(promoMinimum(code)) })
            : "";
    }

    // ASAP and the next time slots. A slot chosen earlier stays listed even
    // once it's no longer offered, so the choice isn't silently changed;
    // validation says if it has become too soon.
    renderPickupSlots(select) {
        const slots = pickupSlots().map(date => date.toISOString());
        if (draft.pickup != ASAP && !slots.includes(draft.pickup)) {
            slots.unshift(draft.pickup);
        }
        select.replaceChildren(new Option(t("order.pickupAsap"), ASAP),
            ...slots.map(slot => new Option(formatTime(new Date(slot)), slot)));
    }

    // Points progress, and the free-drink checkbox once it can be used
    renderLoyalty() {
        const points = app.store.points;
        const panel = document.createElement("section");
        panel.className = "loyalty";
        panel.innerHTML = `
            <div class="loyalty-head">
                <span class="icon" aria-hidden="true">stars</span>
                <p class="points"></p>
            </div>
            <div class="progress" role="progressbar" aria-valuemin="0"><div class="fill"></div></div>
        `;
        panel.querySelector(".points").textContent = t("loyalty.points", { points, goal: REWARD_POINTS });

        const progress = Math.min(points, REWARD_POINTS);
        const bar = panel.querySelector(".progress");
        bar.setAttribute("aria-label", t("loyalty.label"));
        bar.setAttribute("aria-valuemax", REWARD_POINTS);
        bar.setAttribute("aria-valuenow", progress);
        bar.querySelector(".fill").style.width = `${progress / REWARD_POINTS * 100}%`;

        const drink = rewardItem(app.store.cart);
        if (hasReward(points) && drink) {
            const label = document.createElement("label");
            label.className = "reward";
            label.innerHTML = `<input type="checkbox" id="use-reward"> <span></span>`;
            label.querySelector("span").textContent =
                t("loyalty.useReward", { amount: formatPrice(drink.unitPrice) });
            const checkbox = label.querySelector("input");
            checkbox.checked = reward.use;
            checkbox.addEventListener("change", () => {
                reward.use = checkbox.checked;
                this.render();
                this.root.getElementById("use-reward").focus();
            });
            panel.appendChild(label);
        } else {
            const hint = document.createElement("p");
            hint.className = "hint";
            hint.textContent = hasReward(points)
                ? t("loyalty.addDrink")
                : t("loyalty.remaining", { remaining: REWARD_POINTS - points });
            panel.appendChild(hint);
        }
        return panel;
    }

    // Shows or clears the field's error message; returns whether it is valid
    validate(input) {
        const message = validators[input.name]?.(input) ?? "";
        this.root.getElementById(`${input.name}-error`).textContent = message;
        if (message) {
            input.setAttribute("aria-invalid", "true");
        } else {
            input.removeAttribute("aria-invalid");
        }
        return !message;
    }

    setFormBindings(form) {
        const inputs = Array.from(form.elements).filter(element => element.name);

        form.addEventListener("submit", event => {
            event.preventDefault();
            const invalid = inputs.filter(input => !this.validate(input));
            if (invalid.length > 0) {
                invalid[0].focus();
                return;
            }
            const { pickup, ...customer } = Object.fromEntries(new FormData(form));
            this.#user.name = "";
            this.#user.email = "";
            this.#user.phone = "";
            this.#user.pickup = ASAP;
            placeOrder(customer, { useReward: reward.use, promoCode: promo.code, pickup });
            reward.use = false;
            promo.code = "";
            app.router.go("/order/confirmed");
        })

        inputs.forEach(element => {
            // Restore what the user already typed before this render
            element.value = this.#user[element.name];
            element.addEventListener("change", () => {
                this.#user[element.name] = element.value;
            })
            // Check a field once the user leaves it, and re-check
            // while they fix one that is already marked invalid
            element.addEventListener("blur", () => {
                if (element.value) {
                    this.validate(element);
                }
            })
            element.addEventListener("input", () => {
                if (element.hasAttribute("aria-invalid")) {
                    this.validate(element);
                }
            })
        })
    }
}

customElements.define("order-page", OrderPage);
