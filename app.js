import Store from "./services/Store.js";
import { loadData } from "./services/Menu.js";

// Each component registers its custom element when its module loads
import "./components/MenuPage.js";
import "./components/ProductItem.js";

window.app = {};
app.store = Store;

window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("year").textContent = new Date().getFullYear();
    loadData();
    document.querySelector("main").appendChild(document.createElement("menu-page"));
});
