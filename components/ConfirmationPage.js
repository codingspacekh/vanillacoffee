import { adoptStyles } from "../services/Styles.js";
import { describeOptions } from "../services/Options.js";

export class ConfirmationPage extends HTMLElement {
    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        const template = document.getElementById("confirmation-page-template");
        this.root.appendChild(template.content.cloneNode(true));
        adoptStyles(this.root, "/styles/shared.css", "/styles/ConfirmationPage.css");

        this.root.querySelector("a.back").addEventListener("click", event => {
            event.preventDefault();
            app.router.go("/");
        });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const order = app.store.lastOrder;
        if (!order) {
            this.root.querySelector("h2").textContent = "No recent order";
            for (const selector of [".check", ".number", "ul", ".total"]) {
                this.root.querySelector(selector).remove();
            }
            return;
        }

        this.root.querySelector("h2").textContent = `Thank you, ${order.customer.name}!`;
        this.root.querySelector(".number").textContent = `Order #${order.number}`;

        const list = this.root.querySelector("ul");
        for (const { product, options, unitPrice, quantity } of order.items) {
            const li = document.createElement("li");
            li.innerHTML = `
                <p class="qty"></p>
                <div class="details">
                    <p class="name"></p>
                    <p class="options"></p>
                </div>
                <p class="price"></p>
            `;
            li.querySelector(".qty").textContent = `${quantity}x`;
            li.querySelector(".name").textContent = product.name;
            li.querySelector(".options").textContent = describeOptions(product, options);
            li.querySelector(".price").textContent = `$${(quantity * unitPrice).toFixed(2)}`;
            list.appendChild(li);
        }

        this.root.querySelector(".total").textContent = `Total $${order.total.toFixed(2)}`;
    }
}

customElements.define("confirmation-page", ConfirmationPage);
