import { changeQuantity, removeFromCart } from "../services/Order.js";
import { describeOptions } from "../services/Options.js";
import { localized, t } from "../services/I18n.js";
import { formatPrice } from "../services/Money.js";

export default class CartItem extends HTMLElement {
    connectedCallback() {
        const item = JSON.parse(this.dataset.item);
        this.innerHTML = ""; // Clear the element

        const template = document.getElementById("cart-item-template");
        const content = template.content.cloneNode(true);

        this.appendChild(content);

        const name = localized(item.product);
        this.querySelector(".qty").textContent = item.quantity;
        this.querySelector(".thumb").src = `/data/images/${item.product.image}`;
        this.querySelector(".name").textContent = name;
        this.querySelector(".options").textContent = describeOptions(item.product, item.options);
        const note = this.querySelector(".note");
        note.textContent = item.note ? t("item.note", { note: item.note }) : "";
        note.hidden = !item.note;
        this.querySelector(".price").textContent = formatPrice(item.unitPrice);

        const decrease = this.querySelector("button.decrease");
        decrease.setAttribute("aria-label", t("cart.decrease", { name }));
        decrease.addEventListener("click", () => changeQuantity(item.key, -1));

        const increase = this.querySelector("button.increase");
        increase.setAttribute("aria-label", t("cart.increase", { name }));
        increase.addEventListener("click", () => changeQuantity(item.key, 1));

        const remove = this.querySelector("button.delete-button");
        remove.setAttribute("aria-label", t("cart.remove", { name }));
        remove.addEventListener("click", () => removeFromCart(item.key));
    }
}

customElements.define("cart-item", CartItem);
