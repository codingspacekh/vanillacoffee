const DURATION = 2000;

// A status region that announces short messages sent with an "apptoast" event
export default class ToastMessage extends HTMLElement {
    constructor() {
        super();
        this.onToast = event => this.show(event.detail);
    }

    connectedCallback() {
        this.setAttribute("role", "status");
        window.addEventListener("apptoast", this.onToast);
    }

    disconnectedCallback() {
        window.removeEventListener("apptoast", this.onToast);
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
