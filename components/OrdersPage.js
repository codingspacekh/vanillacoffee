import { adoptStyles } from "../services/Styles.js";
import { describeOptions } from "../services/Options.js";
import { reorder } from "../services/Order.js";
import { formatDate, localized, t } from "../services/I18n.js";
import { formatPrice } from "../services/Money.js";

export class OrdersPage extends HTMLElement {
    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.root.appendChild(document.createElement("section"));
        adoptStyles(this.root, "/styles/shared.css", "/styles/OrdersPage.css");

        this.root.addEventListener("click", async event => {
            if (event.target.closest("a.back")) {
                event.preventDefault();
                app.router.go("/");
            }
            const button = event.target.closest("button.reorder");
            // Disabled while the menu loads, so a double click adds it once
            if (button && !button.disabled) {
                button.disabled = true;
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
                    <p class="empty"></p>
                    <a href="/" class="back"></a>
                </div>
            `;
            section.querySelector(".empty").textContent = t("orders.empty");
            section.querySelector(".back").textContent = t("common.backToMenu");
            return;
        }

        section.innerHTML = `<div class="heading"><h2></h2><p class="balance"></p></div>`;
        section.querySelector("h2").textContent = t("orders.title");
        section.querySelector(".balance").textContent = t("loyalty.balance", { points: app.store.points });
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
                    <button type="button" class="reorder"></button>
                </footer>
            `;
            article.querySelector(".number").textContent = t("confirmation.number", { number: order.number });
            const time = article.querySelector("time");
            if (order.placedAt) {
                time.dateTime = order.placedAt;
                time.textContent = formatDate(new Date(order.placedAt));
            }
            article.querySelector(".items").textContent = order.items.map(item => {
                const options = describeOptions(item.product, item.options);
                return `${item.quantity}x ${localized(item.product)}${options ? ` (${options})` : ""}`;
            }).join(", ");
            article.querySelector(".total").textContent = formatPrice(order.total);
            const button = article.querySelector("button.reorder");
            button.dataset.number = order.number;
            button.textContent = t("orders.reorder");
            button.setAttribute("aria-label", t("orders.reorderLabel", { number: order.number }));
            section.appendChild(article);
        }
    }
}

customElements.define("orders-page", OrdersPage);
