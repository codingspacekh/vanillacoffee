import { adoptStyles } from "../services/Styles.js";
import { isFavourite } from "../services/Favourites.js";
import { localized, t } from "../services/I18n.js";

const slug = name => name.toLowerCase().replace(/\s+/g, "-");

export class MenuPage extends HTMLElement {
    constructor() {
        super();
        this.root = this.attachShadow({ mode: 'open' });
        adoptStyles(this.root, "/components/shared.css", "/components/MenuPage.css");
        this.onMenuChange = () => this.render();
        this.onFavouritesChange = () => this.renderList();
    }

    // when the component is attached to the DOM
    connectedCallback() {
        if (!this.root.querySelector("#menu")) {
            const template = document.getElementById("menu-page-template");
            this.root.appendChild(template.content.cloneNode(true));
            this.bindFilters();
        }
        // The filter lives in the URL so reloads and the back button keep it
        const params = new URLSearchParams(location.search);
        this.query = params.get("q") ?? "";
        this.category = params.get("category") ?? "";
        this.root.querySelector("#search").value = this.query;

        window.addEventListener("appmenuchange", this.onMenuChange);
        window.addEventListener("appfavouriteschange", this.onFavouritesChange);
        this.render();
    }

    disconnectedCallback() {
        window.removeEventListener("appmenuchange", this.onMenuChange);
        window.removeEventListener("appfavouriteschange", this.onFavouritesChange);
    }

    bindFilters() {
        this.root.querySelector("form.filters").addEventListener("submit", event => {
            event.preventDefault();
        });
        this.root.querySelector("#search").addEventListener("input", event => {
            this.setFilters(event.target.value, this.category);
        });
        this.root.querySelector(".chips").addEventListener("click", event => {
            const chip = event.target.closest("button");
            if (chip) {
                this.setFilters(this.query, chip.dataset.category);
            }
        });
        this.root.querySelector("#menu").addEventListener("click", event => {
            if (event.target.closest(".no-results button")) {
                this.setFilters("", "");
                this.root.querySelector("#search").value = "";
                this.root.querySelector("#search").focus();
            }
        });
    }

    setFilters(query, category) {
        this.query = query;
        this.category = category;
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (category) params.set("category", category);
        const search = params.toString();
        history.replaceState(history.state, "", search ? `/?${search}` : "/");
        this.render();
    }

    render() {
        this.renderChips();
        this.renderList();
    }

    renderChips() {
        const chips = this.root.querySelector(".chips");
        if (!app.store.menu) {
            chips.replaceChildren();
            return;
        }
        const categories = [[t("menu.all"), ""], ...app.store.menu.map(c => [localized(c), slug(c.name)])];
        chips.replaceChildren(...categories.map(([name, value]) => {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.textContent = name;
            chip.dataset.category = value;
            chip.setAttribute("aria-pressed", value == this.category);
            return chip;
        }));
    }

    // The sections to show: favourites first, then each matching category
    sections() {
        const query = this.query.trim().toLowerCase();
        // Matches the English and the translated names
        const names = item => [item.name, localized(item)].map(name => name.toLowerCase());
        const matches = (product, category) => !query
            || names(product).some(name => name.includes(query))
            || names(category).some(name => name.includes(query));

        const sections = [];
        for (const category of app.store.menu) {
            if (this.category && slug(category.name) != this.category) {
                continue;
            }
            const products = category.products.filter(p => matches(p, category));
            if (products.length > 0) {
                sections.push({ name: localized(category), id: slug(category.name), products });
            }
        }
        if (!this.category) {
            const favourites = sections.flatMap(s => s.products).filter(p => isFavourite(p.id));
            if (favourites.length > 0) {
                sections.unshift({ name: t("menu.favourites"), id: "favourites", products: favourites });
            }
        }
        return sections;
    }

    renderList() {
        const menu = this.root.querySelector("#menu");
        if (!app.store.menu) {
            menu.textContent = t("menu.loading");
            return;
        }

        // Re-rendering replaces the buttons, so remember which one had focus
        const active = this.root.activeElement?.closest("product-item button");
        const focus = active && {
            section: active.closest("li[data-section]").dataset.section,
            productId: active.closest("product-item").dataset.productId,
            button: active.classList.contains("favourite") ? "favourite" : "add",
        };

        menu.innerHTML = "";
        const sections = this.sections();
        if (sections.length == 0) {
            const empty = document.createElement("li");
            empty.className = "no-results";
            empty.innerHTML = `<p></p><button type="button"></button>`;
            empty.querySelector("p").textContent = t("menu.noResults", { query: this.query });
            empty.querySelector("button").textContent = t("menu.clearFilters");
            menu.appendChild(empty);
        }
        for (const section of sections) {
            const liCategory = document.createElement("li");
            liCategory.dataset.section = section.id;
            if (section.id == "favourites") {
                liCategory.className = "favourites";
            }
            liCategory.innerHTML = `
                <h3></h3>
                <ul class='category'>                    
                </ul>
            `;
            liCategory.querySelector("h3").textContent = section.name;
            menu.appendChild(liCategory);

            section.products.forEach(product => {
                const item = document.createElement("product-item");
                item.dataset.product = JSON.stringify(product);
                liCategory.querySelector("ul").appendChild(item);
            });
        }

        if (focus) {
            const button = `product-item[data-product-id="${focus.productId}"] button.${focus.button}`;
            (this.root.querySelector(`li[data-section="${focus.section}"] ${button}`)
                ?? this.root.querySelector(button))?.focus();
        }
    }
}
customElements.define("menu-page", MenuPage);
