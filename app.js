import Store from "./services/Store.js";
import { loadData } from "./services/Menu.js";
import Router from "./services/Router.js";

// Each component registers its custom element when its module loads
import "./components/MenuPage.js";
import "./components/ProductItem.js";
import "./components/DetailsPage.js";

window.app = {};
app.store = Store;
app.router = Router;

window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("year").textContent = new Date().getFullYear();
    loadData();
    app.router.init();
});
