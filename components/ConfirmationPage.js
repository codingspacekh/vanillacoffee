import { adoptStyles } from "../services/Styles.js";
import { describeOptions } from "../services/Options.js";
import { hasReward } from "../services/Loyalty.js";
import { localized, t } from "../services/I18n.js";

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
            this.root.querySelector("h2").textContent = t("confirmation.none");
            for (const selector of [".check", ".number", "ul", ".total"]) {
                this.root.querySelector(selector).remove();
            }
            return;
        }

        this.root.querySelector("h2").textContent = t("confirmation.thanks", { name: order.customer.name });
        this.root.querySelector(".number").textContent = t("confirmation.number", { number: order.number });

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
            li.querySelector(".name").textContent = localized(product);
            li.querySelector(".options").textContent = describeOptions(product, options);
            li.querySelector(".price").textContent = `$${(quantity * unitPrice).toFixed(2)}`;
            list.appendChild(li);
        }

        if (order.discount > 0) {
            const li = document.createElement("li");
            li.className = "reward-line";
            li.innerHTML = `<p class="reward-label"></p><p class="price"></p>`;
            li.querySelector(".reward-label").textContent = t("loyalty.rewardLine");
            li.querySelector(".price").textContent = `−$${order.discount.toFixed(2)}`;
            list.appendChild(li);
        }

        this.root.querySelector(".total").textContent = t("confirmation.total", { total: `$${order.total.toFixed(2)}` });

        // Orders saved before loyalty points existed have no points info
        if (order.pointsEarned != null) {
            const points = document.createElement("p");
            points.className = "points";
            points.textContent = t("loyalty.earned", { earned: order.pointsEarned, balance: order.pointsBalance });
            this.root.querySelector(".total").after(points);
            if (hasReward(order.pointsBalance)) {
                const ready = document.createElement("p");
                ready.className = "reward-ready";
                ready.textContent = t("loyalty.rewardReady");
                points.after(ready);
            }
        }
    }
}

customElements.define("confirmation-page", ConfirmationPage);
