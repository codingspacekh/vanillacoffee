import { adoptStyles } from "../services/Styles.js";
import { cartTotal } from "../services/Order.js";

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
    }
}

customElements.define("order-page", OrderPage);
