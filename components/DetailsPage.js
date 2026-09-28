import { getProductById } from "../services/Menu.js";
import { adoptStyles } from "../services/Styles.js";

export class DetailsPage extends HTMLElement {
    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        const template = document.getElementById("details-page-template");
        this.root.appendChild(template.content.cloneNode(true));
        adoptStyles(this.root, "/styles/shared.css", "/styles/DetailsPage.css");

        this.root.querySelector("a.back").addEventListener("click", event => {
            event.preventDefault();
            app.router.go("/");
        });
    }

    connectedCallback() {
        this.renderData();
    }

    async renderData() {
        this.product = await getProductById(this.dataset.productId);
        if (!this.product) {
            this.root.querySelector("h2").textContent = "Product not found";
            for (const selector of ["img", ".description", "form.options", ".buy-bar"]) {
                this.root.querySelector(selector).remove();
            }
            return;
        }
        this.root.querySelector("h2").textContent = this.product.name;
        this.root.querySelector("img").src = `/data/images/${this.product.image}`;
        this.root.querySelector(".description").textContent = this.product.description;
        this.root.querySelector(".price").textContent = `$ ${this.product.price.toFixed(2)} ea`;
    }
}

customElements.define("details-page", DetailsPage);
