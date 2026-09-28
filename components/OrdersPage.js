import { adoptStyles } from "../services/Styles.js";
import { describeOptions } from "../services/Options.js";
import { reorder } from "../services/Order.js";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export class OrdersPage extends HTMLElement {
    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.root.appendChild(document.createElement("section"));
        adoptStyles(this.root, "/styles/shared.css", "/styles/OrdersPage.css");

        // One listener handles every button, even ones rendered later
        this.root.addEventListener("click", async event => {
            if (event.target.closest("a.back")) {
                event.preventDefault();
                app.router.go("/");
            }
            const button = event.target.closest("button.reorder");
            if (button) {
                const order = app.store.orders.find(o => o.number == button.dataset.number);
                await reorder(order);
                app.router.go("/order");
            }
        });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const section = this.root.querySelector("section");
        if (app.store.orders.length == 0) {
            section.innerHTML = `
                <div class="empty-state">
                    <span class="icon" aria-hidden="true">receipt_long</span>
                    <p class="empty">No past orders yet</p>
                    <a href="/" class="back">Back to menu</a>
                </div>
            `;
            return;
        }

        section.innerHTML = `<div class="heading"><h2>Order history</h2><p class="balance"></p></div>`;
        section.querySelector(".balance").textContent = `You have ${app.store.points} points`;
        for (const order of app.store.orders) {
            const article = document.createElement("article");
            article.innerHTML = `
                <header>
                    <p class="number"></p>
                    <time></time>
                </header>
                <p class="items"></p>
                <footer>
                    <p class="total"></p>
                    <button type="button" class="reorder">Reorder</button>
                </footer>
            `;
            article.querySelector(".number").textContent = `Order #${order.number}`;
            const time = article.querySelector("time");
            time.dateTime = order.placedAt;
            time.textContent = dateFormat.format(new Date(order.placedAt));
            article.querySelector(".items").textContent = order.items.map(item => {
                const options = describeOptions(item.product, item.options);
                return `${item.quantity}x ${item.product.name}${options ? ` (${options})` : ""}`;
            }).join(", ");
            article.querySelector(".total").textContent = `$${order.total.toFixed(2)}`;
            const button = article.querySelector("button.reorder");
            button.dataset.number = order.number;
            button.setAttribute("aria-label", `Reorder order #${order.number}`);
            section.appendChild(article);
        }
    }
}

customElements.define("orders-page", OrdersPage);
