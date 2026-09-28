import Store from "./services/Store.js";
import { loadData } from "./services/Menu.js";
import Router from "./services/Router.js";

// Each component registers its custom element when its module loads
import "./components/MenuPage.js";
import "./components/ProductItem.js";
import "./components/DetailsPage.js";
import "./components/OrderPage.js";
import "./components/CartItem.js";
import "./components/ConfirmationPage.js";

window.app = {};
app.store = Store;
app.router = Router;

window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("year").textContent = new Date().getFullYear();
    loadData();
    app.router.init();
});

// The cart tab's badge shows how many items are in the cart
function updateBadge() {
    const badge = document.getElementById("badge");
    const quantity = app.store.cart.reduce((total, item) => total + item.quantity, 0);
    badge.textContent = quantity;
    badge.hidden = quantity == 0;
}

window.addEventListener("appcartchange", updateBadge);
