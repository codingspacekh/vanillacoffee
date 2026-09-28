import { addToCart } from "../services/Order.js";
import { isFavourite, toggleFavourite } from "../services/Favourites.js";
import { localized, t } from "../services/I18n.js";

export default class ProductItem extends HTMLElement {

    constructor() {
        super();    
    }   

    connectedCallback() {
        const template = document.getElementById("product-item-template");
        const content = template.content.cloneNode(true);

        this.appendChild(content);    

        const product = JSON.parse(this.dataset.product);
        this.dataset.productId = product.id;
        this.querySelector("h4").textContent = localized(product);
        this.querySelector("p.price").textContent = `$${product.price.toFixed(2)}`;
        this.querySelector("img").src = `/data/images/${product.image}`;

        const favourite = isFavourite(product.id);
        const heart = this.querySelector("button.favourite");
        heart.setAttribute("aria-label", t("product.favourite", { name: localized(product) }));
        heart.setAttribute("aria-pressed", favourite);
        heart.textContent = favourite ? "♥" : "♡";

        this.querySelector("a").addEventListener("click", event => {
            event.preventDefault();
            if (event.target.closest("button.favourite")) {
                toggleFavourite(product.id);
            } else if (event.target.closest("button.add")) {
                addToCart(product.id);
            } else {
                app.router.go(`/product-${product.id}`);
            }
        })
      }
}

customElements.define("product-item", ProductItem);
