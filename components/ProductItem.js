export default class ProductItem extends HTMLElement {
    connectedCallback() {
        const template = document.getElementById("product-item-template");
        this.appendChild(template.content.cloneNode(true));

        const product = JSON.parse(this.dataset.product);
        this.dataset.productId = product.id;
        this.querySelector("h4").textContent = product.name;
        this.querySelector("p.price").textContent = `$${product.price.toFixed(2)}`;
        this.querySelector("img").src = `/data/images/${product.image}`;

        const heart = this.querySelector("button.favourite");
        heart.setAttribute("aria-label", `Favourite ${product.name}`);
        heart.textContent = "♡";

        this.querySelector("a").addEventListener("click", event => {
            event.preventDefault();
        });
    }
}

customElements.define("product-item", ProductItem);
