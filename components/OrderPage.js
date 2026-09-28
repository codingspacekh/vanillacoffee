import { adoptStyles } from "../services/Styles.js";
import { orderTotals, placeOrder } from "../services/Order.js";
import { hasReward, REWARD_POINTS, rewardItem } from "../services/Loyalty.js";
import { t } from "../services/I18n.js";

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
};

// What the customer has typed so far. It lives outside the element, so it
// survives the page re-rendering or the customer visiting the menu and back.
const draft = {
    name: "",
    phone: "",
    email: ""
};

// Whether the customer ticked "Use my free drink"; kept across re-renders
const reward = { use: false };

export class OrderPage extends HTMLElement {
    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.root.appendChild(document.createElement("section"));
        adoptStyles(this.root, "/styles/shared.css", "/styles/OrderPage.css");
        this.onCartChange = () => this.render();

        // "Browse the menu" on the empty cart
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
        const list = section.querySelector("ul");
        for (const item of app.store.cart) {
            const cartItem = document.createElement("cart-item");
            cartItem.dataset.item = JSON.stringify(item);
            list.appendChild(cartItem);
        }
        const { discount, total } = orderTotals(app.store.cart, reward.use);
        if (discount > 0) {
            list.insertAdjacentHTML("beforeend", `
                <li class="reward-line">
                    <p class="reward-label">${t("loyalty.rewardLine")}</p>
                    <p class="reward-amount">−$${discount.toFixed(2)}</p>
                </li>
            `);
        }
        list.insertAdjacentHTML("beforeend", `
            <li>
                <p class="total">${t("order.total")}</p>
                <p class="price-total">$${total.toFixed(2)}</p>
            </li>
        `);

        section.appendChild(this.renderLoyalty());
        const template = document.getElementById("order-form-template");
        section.appendChild(template.content.cloneNode(true));
        this.bindForm(section.querySelector("form"));
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
                t("loyalty.useReward", { amount: `$${drink.unitPrice.toFixed(2)}` });
            const checkbox = label.querySelector("input");
            checkbox.checked = reward.use;
            checkbox.addEventListener("change", () => {
                reward.use = checkbox.checked;
                this.render();
                // render() replaced the checkbox, so focus its replacement
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

    // Shows or clears a field's error message; returns whether it is valid
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

    bindForm(form) {
        const inputs = Array.from(form.elements).filter(element => element.name);

        form.addEventListener("submit", event => {
            event.preventDefault();
            const invalid = inputs.filter(input => !this.validate(input));
            if (invalid.length > 0) {
                invalid[0].focus();
                return;
            }
            const customer = Object.fromEntries(new FormData(form));
            draft.name = draft.phone = draft.email = "";
            placeOrder(customer, { useReward: reward.use });
            reward.use = false;
            app.router.go("/order/confirmed");
        });

        inputs.forEach(input => {
            // Put back what the customer typed before this render
            input.value = draft[input.name];
            input.addEventListener("input", () => {
                draft[input.name] = input.value;
                // Re-check a field that is already marked invalid as it's fixed
                if (input.hasAttribute("aria-invalid")) {
                    this.validate(input);
                }
            });
            // Check a field once the customer leaves it
            input.addEventListener("blur", () => {
                if (input.value) {
                    this.validate(input);
                }
            });
        });
    }
}

customElements.define("order-page", OrderPage);
