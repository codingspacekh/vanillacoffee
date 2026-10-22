import { adoptStyles } from "../services/Styles.js";
import { isFavourite } from "../services/Favourites.js";
import { t } from "../services/I18n.js";

// The products the customer hearted, in menu order
export class FavouritesPage extends HTMLElement {
    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.root.appendChild(document.createElement("section"));
        adoptStyles(this.root, "/styles/shared.css", "/styles/ProductGrid.css", "/styles/FavouritesPage.css");
        this.onChange = () => this.render();

        this.root.addEventListener("click", event => {
            if (event.target.closest("a.button")) {
                event.preventDefault();
                app.router.go("/");
            }
        });
    }

    connectedCallback() {
        window.addEventListener("appmenuchange", this.onChange);
        window.addEventListener("appfavouriteschange", this.onChange);
        this.render();
    }

    disconnectedCallback() {
        window.removeEventListener("appmenuchange", this.onChange);
        window.removeEventListener("appfavouriteschange", this.onChange);
    }

    render() {
        const section = this.root.querySelector("section");
        if (!app.store.menu) {
            section.innerHTML = `<p class="loading"></p>`;
            section.querySelector(".loading").textContent = t("menu.loading");
            return;
        }

        // Un-hearting removes the card, so focus moves to the next heart
        const hearts = () => [...this.root.querySelectorAll("button.favourite")];
        const focusedIndex = hearts().indexOf(this.root.activeElement);

        const products = app.store.menu
            .flatMap(category => category.products)
            .filter(product => isFavourite(product.id));
        if (products.length == 0) {
            section.innerHTML = `
                <div class="empty-state">
                    <span class="icon" aria-hidden="true">favorite</span>
                    <p class="empty"></p>
                    <p class="hint"></p>
                    <a href="/" class="button"></a>
                </div>
            `;
            section.querySelector(".empty").textContent = t("favourites.empty");
            section.querySelector(".hint").textContent = t("favourites.hint");
            section.querySelector(".button").textContent = t("order.browse");
            if (focusedIndex >= 0) {
                section.querySelector(".button").focus();
            }
            return;
        }

        section.innerHTML = `<h2></h2><ul class="product-grid"></ul>`;
        section.querySelector("h2").textContent = t("favourites.title");
        const list = section.querySelector("ul");
        for (const product of products) {
            const item = document.createElement("product-item");
            item.dataset.product = JSON.stringify(product);
            list.appendChild(item);
        }
        if (focusedIndex >= 0) {
            const remaining = hearts();
            remaining[Math.min(focusedIndex, remaining.length - 1)].focus();
        }
    }
}

customElements.define("favourites-page", FavouritesPage);
