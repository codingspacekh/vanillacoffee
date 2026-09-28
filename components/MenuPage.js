import { adoptStyles } from "../services/Styles.js";

export class MenuPage extends HTMLElement {
    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        adoptStyles(this.root, "/styles/shared.css", "/styles/MenuPage.css");
        this.onMenuChange = () => this.render();
    }

    // Runs when the element is added to the page
    connectedCallback() {
        if (!this.root.querySelector("#menu")) {
            const template = document.getElementById("menu-page-template");
            this.root.appendChild(template.content.cloneNode(true));
        }
        window.addEventListener("appmenuchange", this.onMenuChange);
        this.render();
    }

    // Runs when the element is removed; stop listening so it can be cleaned up
    disconnectedCallback() {
        window.removeEventListener("appmenuchange", this.onMenuChange);
    }

    render() {
        const menu = this.root.querySelector("#menu");
        if (!app.store.menu) {
            menu.textContent = "Loading...";
            return;
        }

        menu.innerHTML = "";
        for (const category of app.store.menu) {
            const liCategory = document.createElement("li");
            liCategory.innerHTML = `
                <h3></h3>
                <ul class="category"></ul>
            `;
            liCategory.querySelector("h3").textContent = category.name;
            menu.appendChild(liCategory);

            category.products.forEach(product => {
                const item = document.createElement("product-item");
                item.dataset.product = JSON.stringify(product);
                liCategory.querySelector("ul").appendChild(item);
            });
        }
    }
}

customElements.define("menu-page", MenuPage);
