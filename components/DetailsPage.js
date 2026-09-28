import { getProductById } from "../services/Menu.js";
import { addToCart } from "../services/Order.js";
import { unitPrice } from "../services/Options.js";
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
        this.form = this.root.querySelector("form.options");
        this.form.addEventListener("change", () => this.renderPrice());
        this.root.querySelector("button.add-to-cart").addEventListener("click", () => {
            addToCart(this.product.id, this.selectedOptions());
            app.router.go("/order");
        });
    }

    // The checked radio in each group, e.g. { Size: "Large", Milk: "Oat" }
    selectedOptions() {
        return Object.fromEntries(new FormData(this.form));
    }

    renderPrice() {
        const price = unitPrice(this.product, this.selectedOptions());
        this.root.querySelector(".price").textContent = `$ ${price.toFixed(2)} ea`;
    }

    // One fieldset of radio buttons per option group
    renderOptions() {
        for (const group of this.product.options ?? []) {
            const fieldset = document.createElement("fieldset");
            const legend = document.createElement("legend");
            legend.textContent = group.name;
            fieldset.appendChild(legend);

            group.choices.forEach((choice, index) => {
                const label = document.createElement("label");
                const input = document.createElement("input");
                input.type = "radio";
                input.name = group.name;
                input.value = choice.label;
                input.checked = index == 0;
                label.append(input, ` ${choice.label}`);
                if (choice.price > 0) {
                    const extra = document.createElement("span");
                    extra.className = "extra";
                    extra.textContent = `+$${choice.price.toFixed(2)}`;
                    label.append(" ", extra);
                }
                fieldset.appendChild(label);
            });
            this.form.appendChild(fieldset);
        }
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
        this.renderOptions();
        this.renderPrice();
    }
}

customElements.define("details-page", DetailsPage);
