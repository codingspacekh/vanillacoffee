import { addToCart } from "../services/Order.js";
import { isFavourite, toggleFavourite } from "../services/Favourites.js";
import { localized, t } from "../services/I18n.js";
import { formatPrice } from "../services/Money.js";

export default class ProductItem extends HTMLElement {

    connectedCallback() {
        const template = document.getElementById("product-item-template");
        const content = template.content.cloneNode(true);

        this.replaceChildren(content);

        const product = JSON.parse(this.dataset.product);
        const name = localized(product);
        const url = `/product-${product.id}`;
        this.dataset.productId = product.id;
        this.querySelector("h4").textContent = name;
        this.querySelector("p.price").textContent = formatPrice(product.price);
        this.querySelector("img").src = `/data/images/${product.image}`;

        const favourite = isFavourite(product.id);
        const heart = this.querySelector("button.favourite");
        heart.setAttribute("aria-label", t("product.favourite", { name }));
        heart.setAttribute("aria-pressed", favourite);
        heart.textContent = favourite ? "♥" : "♡";

        // A real href, so the card can be opened in a new tab
        const link = this.querySelector("a");
        link.href = url;
        link.addEventListener("click", event => {
            event.preventDefault();
            if (event.target.closest("button.favourite")) {
                toggleFavourite(product.id);
            } else if (event.target.closest("button.add")) {
                addToCart(product.id);
            } else {
                app.router.go(url);
            }
        })
    }
}

customElements.define("product-item", ProductItem);
