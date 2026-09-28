import { changeQuantity, removeFromCart } from "../services/Order.js";

export default class CartItem extends HTMLElement {
    connectedCallback() {
        const item = JSON.parse(this.dataset.item);
        const template = document.getElementById("cart-item-template");
        this.replaceChildren(template.content.cloneNode(true));

        const name = item.product.name;
        this.querySelector(".qty").textContent = item.quantity;
        this.querySelector(".thumb").src = `/data/images/${item.product.image}`;
        this.querySelector(".name").textContent = name;
        this.querySelector(".price").textContent = `$${item.product.price.toFixed(2)}`;

        const decrease = this.querySelector("button.decrease");
        decrease.setAttribute("aria-label", `Decrease quantity of ${name}`);
        decrease.addEventListener("click", () => changeQuantity(item.product.id, -1));

        const increase = this.querySelector("button.increase");
        increase.setAttribute("aria-label", `Increase quantity of ${name}`);
        increase.addEventListener("click", () => changeQuantity(item.product.id, 1));

        const remove = this.querySelector("a.delete-button");
        remove.setAttribute("aria-label", `Remove ${name}`);
        remove.addEventListener("click", event => {
            event.preventDefault();
            removeFromCart(item.product.id);
        });
    }
}

customElements.define("cart-item", CartItem);
