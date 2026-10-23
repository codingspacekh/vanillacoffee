import { getProductById } from '../services/Menu.js';
import { addToCart } from '../services/Order.js';
import { NOTE_MAX_LENGTH, unitPrice } from '../services/Options.js';
import { adoptStyles } from '../services/Styles.js';
import { localized, t } from '../services/I18n.js';
import { formatPrice } from '../services/Money.js';

export class DetailsPage extends HTMLElement {

    constructor() {
        super();

        this.root = this.attachShadow({ mode: "open" });

        const template = document.getElementById("details-page-template");
        const content = template.content.cloneNode(true);
        this.root.appendChild(content);
        adoptStyles(this.root, "/styles/shared.css", "/styles/DetailsPage.css");

        this.root.querySelector("a.back").addEventListener("click", event => {
            event.preventDefault();
            app.router.go("/");
        });
        this.form = this.root.querySelector("form.options");
        this.form.addEventListener("change", () => this.renderPrice());
        this.note = this.root.querySelector("input.note");
        this.note.maxLength = NOTE_MAX_LENGTH;
        // Wait for the cart to update, so the order page doesn't flash empty
        this.root.querySelector("button.add-to-cart").addEventListener("click", async () => {
            await addToCart(this.product.id, this.selectedOptions(), this.note.value);
            app.router.go('/order');
        })
    }

    selectedOptions() {
        return Object.fromEntries(new FormData(this.form));
    }

    renderPrice() {
        const price = unitPrice(this.product, this.selectedOptions());
        this.root.querySelector(".price").textContent = t("details.price", { price: price.toFixed(2) });
    }

    renderOptions() {
        for (const group of this.product.options ?? []) {
            const fieldset = document.createElement("fieldset");
            const legend = document.createElement("legend");
            legend.textContent = t(`option.${group.name}`);
            fieldset.appendChild(legend);

            group.choices.forEach((choice, index) => {
                const label = document.createElement("label");
                const input = document.createElement("input");
                input.type = "radio";
                input.name = group.name;
                input.value = choice.label;
                input.checked = index == 0;
                label.append(input, ` ${t(`choice.${choice.label}`)}`);
                if (choice.price > 0) {
                    const extra = document.createElement("span");
                    extra.className = "extra";
                    extra.textContent = `+${formatPrice(choice.price)}`;
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
            this.root.querySelector("h2").textContent = t("details.notFound");
            for (const selector of ["img", ".description", "form.options", ".note-label", "input.note", ".buy-bar"]) {
                this.root.querySelector(selector).remove();
            }
            return;
        }
        this.root.querySelector("h2").textContent = localized(this.product);
        this.root.querySelector("img").src = `/data/images/${this.product.image}`;
        this.root.querySelector(".description").textContent = localized(this.product, "description");
        this.renderOptions();
        this.renderPrice();
    }

    connectedCallback() {
        this.renderData();
    }

}

customElements.define("details-page", DetailsPage);
