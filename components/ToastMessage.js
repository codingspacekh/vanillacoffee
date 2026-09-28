const DURATION = 2000;

// A status region that announces short messages, such as items added to the cart
export default class ToastMessage extends HTMLElement {
    constructor() {
        super();
        this.onCartAdd = event => this.show(`${event.detail.name} added to cart`);
    }

    connectedCallback() {
        this.setAttribute("role", "status");
        window.addEventListener("appcartadd", this.onCartAdd);
    }

    disconnectedCallback() {
        window.removeEventListener("appcartadd", this.onCartAdd);
        clearTimeout(this.timer);
    }

    show(message) {
        clearTimeout(this.timer);
        const text = document.createElement("p");
        text.textContent = message;
        this.replaceChildren(text);
        this.timer = setTimeout(() => this.replaceChildren(), DURATION);
    }
}

customElements.define("toast-message", ToastMessage);
