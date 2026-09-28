import { changeQuantity, removeFromCart } from "../services/Order.js";
import { describeOptions } from "../services/Options.js";

export default class CartItem extends HTMLElement {
    constructor() {
        super();    
    }   

    connectedCallback() {
        const item = JSON.parse(this.dataset.item);
        this.innerHTML = ""; // Clear the element

        const template = document.getElementById("cart-item-template");
        const content = template.content.cloneNode(true);

        this.appendChild(content);    

        const name = item.product.name;
        this.querySelector(".qty").textContent = `${item.quantity}x`;
        this.querySelector(".name").textContent = name;
        this.querySelector(".options").textContent = describeOptions(item.product, item.options);
        this.querySelector(".price").textContent = `$${item.unitPrice.toFixed(2)}`;

        const decrease = this.querySelector("button.decrease");
        decrease.setAttribute("aria-label", `Decrease quantity of ${name}`);
        decrease.addEventListener("click", () => changeQuantity(item.key, -1));

        const increase = this.querySelector("button.increase");
        increase.setAttribute("aria-label", `Increase quantity of ${name}`);
        increase.addEventListener("click", () => changeQuantity(item.key, 1));

        const remove = this.querySelector("a.delete-button");
        remove.setAttribute("aria-label", `Remove ${name}`);
        remove.addEventListener("click", event => {
            event.preventDefault();
            removeFromCart(item.key);
        })
      }
}

customElements.define("cart-item", CartItem);
