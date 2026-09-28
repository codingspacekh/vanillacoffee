import { getProductById } from '../services/Menu.js';
import { addToCart } from '../services/Order.js';
import { unitPrice } from '../services/Options.js';
import { adoptStyles } from '../services/Styles.js';

export class DetailsPage extends HTMLElement {

    constructor() {
        super();
    
        this.root = this.attachShadow({ mode: "open" });
    
        const template = document.getElementById("details-page-template");
        const content = template.content.cloneNode(true);
        this.root.appendChild(content);    
        adoptStyles(this.root, "/components/DetailsPage.css");

        this.form = this.root.querySelector("form.options");
        this.form.addEventListener("change", () => this.renderPrice());
        this.root.querySelector("button").addEventListener("click", ()=> {
            addToCart(this.product.id, this.selectedOptions()); 
            app.router.go('/order');
        })
    }   

    selectedOptions() {
        return Object.fromEntries(new FormData(this.form));
    }

    renderPrice() {
        const price = unitPrice(this.product, this.selectedOptions());
        this.root.querySelector(".price").textContent = `$ ${price.toFixed(2)} ea`
    }

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

    async renderData() {
        this.product = await getProductById(this.dataset.productId);
        if (!this.product) {
            this.root.querySelector("h2").textContent = "Product not found";
            for (const selector of ["img", ".description", "form.options", ".price", "button"]) {
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

    connectedCallback() {
        this.renderData();
    }

}

customElements.define("details-page", DetailsPage);
