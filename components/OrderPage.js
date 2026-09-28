import { adoptStyles } from "../services/Styles.js";
import { cartTotal, placeOrder } from "../services/Order.js";

// Each returns an error message, or "" when the field is valid
const validators = {
    name: input => input.value.trim() ? "" : "Please enter your name",
    phone: input => {
        const value = input.value.trim();
        if (!value) {
            return "Please enter your phone number";
        }
        const digits = value.replace(/\D/g, "").length;
        return /^\+?[\d\s-]+$/.test(value) && digits >= 7 && digits <= 15
            ? ""
            : "Please enter a valid phone number";
    },
    email: input => input.validity.typeMismatch ? "Please enter a valid email address" : "",
};

// What the customer has typed so far. It lives outside the element, so it
// survives the page re-rendering or the customer visiting the menu and back.
const draft = {
    name: "",
    phone: "",
    email: ""
};

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
                    <p class="empty">Your order is empty</p>
                    <a href="/" class="button">Browse the menu</a>
                </div>
            `;
            return;
        }

        section.innerHTML = `
            <h2>Your Order</h2>
            <ul class="summary"></ul>
        `;
        const list = section.querySelector("ul");
        for (const item of app.store.cart) {
            const cartItem = document.createElement("cart-item");
            cartItem.dataset.item = JSON.stringify(item);
            list.appendChild(cartItem);
        }
        const total = cartTotal(app.store.cart);
        list.insertAdjacentHTML("beforeend", `
            <li>
                <p class="total">Total</p>
                <p class="price-total">$${total.toFixed(2)}</p>
            </li>
        `);

        const template = document.getElementById("order-form-template");
        section.appendChild(template.content.cloneNode(true));
        this.bindForm(section.querySelector("form"));
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
            placeOrder(customer);
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
