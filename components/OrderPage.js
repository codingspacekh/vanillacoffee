import { adoptStyles } from "../services/Styles.js";
import { clearCart } from "../services/Order.js";

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
        let total = 0;
        for (let prodInCart of app.store.cart) {      
            const item = document.createElement("cart-item");
            item.dataset.item = JSON.stringify(prodInCart);
            list.appendChild(item);
          
            total += prodInCart.quantity * prodInCart.product.price;
        }
        list.insertAdjacentHTML("beforeend", `
              <li>
                  <p class='total'>Total</p>
                  <p class='price-total'>$${total.toFixed(2)}</p>
              </li>                
          `);            
      }

      this.setFormBindings(this.root.querySelector("form"));


    }

    setFormBindings(form) {
        if (form) {
            form.addEventListener("submit", event => {
                event.preventDefault();
                alert(`Thanks for your order ${this.#user.name}.`);
                this.#user.name = "";
                this.#user.email = "";
                this.#user.phone = "";
                // TODO Send the data to the server
                clearCart();
            })

            Array.from(form.elements).forEach( element => {
                if (element.name) {
                    // Restore what the user already typed before this render
                    element.value = this.#user[element.name];
                    element.addEventListener("change", () => {
                        this.#user[element.name] = element.value;
                    })
                }
            })
        }
    }
  }
  
  customElements.define("order-page", OrderPage);
