import { adoptStyles } from "../services/Styles.js";
import { orderTotals, placeOrder } from "../services/Order.js";
import { hasReward, REWARD_POINTS, rewardItem } from "../services/Loyalty.js";
import { t } from "../services/I18n.js";
import { formatPrice } from "../services/Money.js";

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

// What the customer has typed so far. It outlives the page element, so the
// details survive switching language or visiting the menu and coming back.
const draft = {
    name: "",
    phone: "",
    email: ""
};

// Whether the customer ticked "Use my free drink"; kept across re-renders
const reward = { use: false };

export class OrderPage extends HTMLElement {

    // Double data binding: writing a field also updates the form on screen
    #user = new Proxy(draft, {
        set: (target, property, value) => {
            target[property] = value;
            const form = this.root.querySelector("form");
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
        const { discount, total } = orderTotals(app.store.cart, reward.use);
        if (discount > 0) {
            list.insertAdjacentHTML("beforeend", `
                <li class='reward-line'>
                    <p class='reward-label'>${t("loyalty.rewardLine")}</p>
                    <p class='reward-amount'>−${formatPrice(discount)}</p>
                </li>
            `);
        }
        list.insertAdjacentHTML("beforeend", `
            <li>
                <p class='total'>${t("order.total")}</p>
                <p class='price-total'>${formatPrice(total)}</p>
            </li>
        `);
        const form = section.querySelector("form");
        form.before(this.renderLoyalty());
        this.setFormBindings(form);
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
            const customer = Object.fromEntries(new FormData(form));
            this.#user.name = "";
            this.#user.email = "";
            this.#user.phone = "";
            placeOrder(customer, { useReward: reward.use });
            reward.use = false;
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
