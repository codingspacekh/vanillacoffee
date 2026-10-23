import { adoptStyles } from "../services/Styles.js";
import { describeOptions } from "../services/Options.js";
import { formatTime, localized, t } from "../services/I18n.js";
import { hasReward } from "../services/Loyalty.js";
import { formatPrice } from "../services/Money.js";
import { describePickup, nextStatusChange, orderStatus, readyAt, STATUSES } from "../services/Pickup.js";

const STATUS_ICONS = {
    received: "receipt_long",
    preparing: "coffee_maker",
    ready: "check_circle",
};

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
        this.root.querySelector("button.notify").addEventListener("click", async () => {
            await Notification.requestPermission();
            this.renderNotify();
            this.root.querySelector(".notify-on:not([hidden])")?.focus();
        });
    }

    connectedCallback() {
        this.render();
    }

    disconnectedCallback() {
        clearTimeout(this.statusTimer);
    }

    render() {
        const order = app.store.lastOrder;
        if (!order) {
            this.root.querySelector("h2").textContent = t("confirmation.none");
            for (const selector of [".check", ".number", ".pickup", ".tracker", "ul", ".total"]) {
                this.root.querySelector(selector).remove();
            }
            return;
        }

        this.root.querySelector("h2").textContent = t("confirmation.thanks", { name: order.customer.name });
        this.root.querySelector(".number").textContent = t("confirmation.number", { number: order.number });
        // Orders placed before pickup times existed have no status to follow
        if (order.pickup) {
            this.root.querySelector(".pickup").textContent = describePickup(order);
            this.renderStatus();
        } else {
            this.root.querySelector(".pickup").remove();
            this.root.querySelector(".tracker").remove();
        }

        const list = this.root.querySelector("ul");
        for (const { product, options, note, unitPrice, quantity } of order.items) {
            const li = document.createElement("li");
            li.innerHTML = `
                <p class="qty"></p>
                <div class="details">
                    <p class="name"></p>
                    <p class="options"></p>
                    <p class="note"></p>
                </div>
                <p class="price"></p>
            `;
            li.querySelector(".qty").textContent = `${quantity}x`;
            li.querySelector(".name").textContent = localized(product);
            li.querySelector(".options").textContent = describeOptions(product, options);
            if (note) {
                li.querySelector(".note").textContent = t("item.note", { note });
            } else {
                li.querySelector(".note").remove();
            }
            li.querySelector(".price").textContent = formatPrice(quantity * unitPrice);
            list.appendChild(li);
        }

        if (order.discount > 0) {
            const li = document.createElement("li");
            li.className = "reward-line";
            li.innerHTML = `<p class="reward-label"></p><p class="price"></p>`;
            li.querySelector(".reward-label").textContent = t("loyalty.rewardLine");
            li.querySelector(".price").textContent = `−${formatPrice(order.discount)}`;
            list.appendChild(li);
        }

        if (order.promoAmount > 0) {
            const li = document.createElement("li");
            li.className = "reward-line";
            li.innerHTML = `<p class="reward-label"></p><p class="price"></p>`;
            li.querySelector(".reward-label").textContent = t("promo.line", { code: order.promoCode });
            li.querySelector(".price").textContent = `−${formatPrice(order.promoAmount)}`;
            list.appendChild(li);
        }

        this.root.querySelector(".total").textContent = t("confirmation.total", { total: formatPrice(order.total) });

        // Orders placed before loyalty points existed have no points info
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

    // Received → Preparing → Ready, updated when the next step is due
    renderStatus() {
        const order = app.store.lastOrder;
        const status = orderStatus(order);
        const current = STATUSES.indexOf(status);
        this.root.querySelector("ol.steps").replaceChildren(...STATUSES.map((name, i) => {
            const li = document.createElement("li");
            li.innerHTML = `<span class="icon" aria-hidden="true"></span><span class="label"></span>`;
            li.querySelector(".icon").textContent = STATUS_ICONS[name];
            li.querySelector(".label").textContent = t(`status.${name}`);
            if (i < current) {
                li.className = "done";
            } else if (i == current) {
                li.className = "current";
                li.setAttribute("aria-current", "step");
            }
            return li;
        }));
        this.root.querySelector(".status-text").textContent = status == "ready"
            ? t("status.readyText")
            : t(`status.${status}Text`, { time: formatTime(readyAt(order)) });
        this.renderNotify();

        const next = nextStatusChange(order);
        if (next) {
            this.statusTimer = setTimeout(() => this.renderStatus(), next - Date.now());
        }
    }

    // Offers notifications until the customer answers, then says they're on
    renderNotify() {
        const ready = orderStatus(app.store.lastOrder) == "ready";
        const permission = "Notification" in window ? Notification.permission : "denied";
        this.root.querySelector("button.notify").hidden = ready || permission != "default";
        this.root.querySelector(".notify-on").hidden = ready || permission != "granted";
    }
}

customElements.define("confirmation-page", ConfirmationPage);
