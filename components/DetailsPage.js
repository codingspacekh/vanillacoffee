import { getProductById } from '../services/Menu.js';
import { addToCart } from '../services/Order.js';
import { adoptStyles } from '../services/Styles.js';

export class DetailsPage extends HTMLElement {

    constructor() {
        super();
    
        this.root = this.attachShadow({ mode: "open" });
    
        const template = document.getElementById("details-page-template");
        const content = template.content.cloneNode(true);
        this.root.appendChild(content);    
        adoptStyles(this.root, "/components/DetailsPage.css");

        this.root.querySelector("button").addEventListener("click", ()=> {
            addToCart(this.product.id); 
            app.router.go('/order');
        })
    }   

    async renderData() {
        this.product = await getProductById(this.dataset.productId);
        if (!this.product) {
            this.root.querySelector("h2").textContent = "Product not found";
            for (const selector of ["img", ".description", ".price", "button"]) {
                this.root.querySelector(selector).remove();
            }
            return;
        }
        this.root.querySelector("h2").textContent = this.product.name;
        this.root.querySelector("img").src = `/data/images/${this.product.image}`;
        this.root.querySelector(".description").textContent = this.product.description;
        this.root.querySelector(".price").textContent = `$ ${this.product.price.toFixed(2)} ea`
    }

    connectedCallback() {
        this.renderData();
    }

}

customElements.define("details-page", DetailsPage);
