import { adoptStyles } from "../services/Styles.js";

export class MenuPage extends HTMLElement {
    constructor() {
        super();
        this.root = this.attachShadow({ mode: 'open' });
        adoptStyles(this.root, "/components/MenuPage.css");
        this.onMenuChange = () => this.render();
    }

    // when the component is attached to the DOM
    connectedCallback() {
        if (!this.root.querySelector("#menu")) {
            const template = document.getElementById("menu-page-template");
            this.root.appendChild(template.content.cloneNode(true));
        }
        window.addEventListener("appmenuchange", this.onMenuChange);
        this.render();
    }

    disconnectedCallback() {
        window.removeEventListener("appmenuchange", this.onMenuChange);
    }

    render() {
        if (app.store.menu) {
            this.root.querySelector("#menu").innerHTML = "";
            for (let category of app.store.menu) {
                const liCategory = document.createElement("li");
                liCategory.innerHTML = `
                    <h3></h3>
                    <ul class='category'>                    
                    </ul>
                `;
                liCategory.querySelector("h3").textContent = category.name;
                this.root.querySelector("#menu").appendChild(liCategory);

                category.products.forEach(product => {
                    const item = document.createElement("product-item");
                    item.dataset.product = JSON.stringify(product);
                    liCategory.querySelector("ul").appendChild(item);
                });
            }
        } else {
            this.root.querySelector("#menu").innerHTML = "Loading...";        
        }
    }
}
customElements.define("menu-page", MenuPage);
