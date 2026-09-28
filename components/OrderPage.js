import { adoptStyles } from "../services/Styles.js";
import { cartTotal, placeOrder } from "../services/Order.js";

// Each returns an error message, or "" when the field is valid
const validators = {
    name: input => input.value.trim() ? "" : "Please enter your name",
    phone: input => {
        const value = input.value.trim();
        if (!value) {
            return "Please enter your phone number";
        }
        const digits = value.replace(/\D/g, "").length;
        return /^\+?[\d\s-]+$/.test(value) && digits >= 7 && digits <= 15
            ? ""
            : "Please enter a valid phone number";
    },
    email: input => input.validity.typeMismatch ? "Please enter a valid email address" : "",
};

export class OrderPage extends HTMLElement {

    // Double data binding: writing a field also updates the form on screen
    #user = new Proxy({
        name: "",
        phone: "",
        email: ""
    }, {
        set: (target, property, value) => {
            target[property] = value;
            const form = this.root.querySelector("form");
            if (form) {
                form.elements[property].value = value;
            }
            return true;
        }
    });

    constructor() {
        super();
    
        this.root = this.attachShadow({ mode: "open" });    
        const section = document.createElement("section");
        this.root.appendChild(section);
        adoptStyles(this.root, "/components/OrderPage.css");
        this.onCartChange = () => this.render();
    }   
  
    connectedCallback() {
      window.addEventListener("appcartchange", this.onCartChange);
      this.render();
    }

    disconnectedCallback() {
      window.removeEventListener("appcartchange", this.onCartChange);
    }
  
    render() {        

      let section = this.root.querySelector("section");   
      if (app.store.cart.length==0) {     
        section.innerHTML = `
            <p class="empty">Your order is empty</p>
        `;
      } else {
        let html = `
            <h2>Your Order</h2>
            <ul>
            </ul>
        `;
        section.innerHTML = html;
  
        const template = document.getElementById("order-form-template");
        const content = template.content.cloneNode(true);
        section.appendChild(content);
  
        const list = this.root.querySelector("ul");
        for (let prodInCart of app.store.cart) {      
            const item = document.createElement("cart-item");
            item.dataset.item = JSON.stringify(prodInCart);
            list.appendChild(item);
        }
        const total = cartTotal(app.store.cart);
        list.insertAdjacentHTML("beforeend", `
              <li>
                  <p class='total'>Total</p>
                  <p class='price-total'>$${total.toFixed(2)}</p>
              </li>                
          `);            
      }

      this.setFormBindings(this.root.querySelector("form"));


    }

    // Shows or clears the field's error message; returns whether it is valid
    validate(input) {
        const message = validators[input.name]?.(input) ?? "";
        this.root.getElementById(`${input.name}-error`).textContent = message;
        if (message) {
            input.setAttribute("aria-invalid", "true");
        } else {
            input.removeAttribute("aria-invalid");
        }
        return !message;
    }

    setFormBindings(form) {
        if (form) {
            const inputs = Array.from(form.elements).filter(element => element.name);

            form.addEventListener("submit", event => {
                event.preventDefault();
                const invalid = inputs.filter(input => !this.validate(input));
                if (invalid.length > 0) {
                    invalid[0].focus();
                    return;
                }
                const customer = Object.fromEntries(new FormData(form));
                this.#user.name = "";
                this.#user.email = "";
                this.#user.phone = "";
                placeOrder(customer);
                app.router.go("/order/confirmed");
            })

            inputs.forEach( element => {
                // Restore what the user already typed before this render
                element.value = this.#user[element.name];
                element.addEventListener("change", () => {
                    this.#user[element.name] = element.value;
                })
                // Check a field once the user leaves it, and re-check
                // while they fix one that is already marked invalid
                element.addEventListener("blur", () => {
                    if (element.value) {
                        this.validate(element);
                    }
                })
                element.addEventListener("input", () => {
                    if (element.hasAttribute("aria-invalid")) {
                        this.validate(element);
                    }
                })
            })
        }
    }
  }
  
  customElements.define("order-page", OrderPage);
