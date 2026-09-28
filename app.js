import Store from "./services/Store.js";
import { loadData } from "./services/Menu.js";
import Router from "./services/Router.js";
import { getLanguage, setLanguage, t, translateDocument } from "./services/I18n.js";
import { getTheme, setTheme } from "./services/Theme.js";

// Each component registers its custom element when its module loads
import "./components/MenuPage.js";
import "./components/ProductItem.js";
import "./components/DetailsPage.js";
import "./components/OrderPage.js";
import "./components/CartItem.js";
import "./components/ConfirmationPage.js";
import "./components/ToastMessage.js";
import "./components/OrdersPage.js";

window.app = {};
app.store = Store;
app.router = Router;

window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("year").textContent = new Date().getFullYear();
    translateDocument();
    updateLanguageButton();
    updateThemeButton();
    document.getElementById("theme").addEventListener("click", () => {
        setTheme(getTheme() == "dark" ? "light" : "dark");
    });
    document.getElementById("language").addEventListener("click", () => {
        setLanguage(getLanguage() == "en" ? "km" : "en");
    });
    loadData();
    app.router.init();
    updateBadge(); // The cart may have been restored from storage
});

// The cart tab's badge shows how many items are in the cart
function updateBadge() {
    const badge = document.getElementById("badge");
    const quantity = app.store.cart.reduce((total, item) => total + item.quantity, 0);
    badge.textContent = quantity;
    badge.hidden = quantity == 0;
}

window.addEventListener("appcartchange", updateBadge);

// The button is labelled in the language it switches to
function updateLanguageButton() {
    document.getElementById("language").lang = t("language.switchLang");
}

// The theme button shows what it switches to
function updateThemeButton() {
    const button = document.getElementById("theme");
    const dark = getTheme() == "dark";
    button.textContent = dark ? "light_mode" : "dark_mode";
    button.setAttribute("aria-label", t(dark ? "theme.light" : "theme.dark"));
}

window.addEventListener("appthemechange", updateThemeButton);

// Rebuild the current page in the new language; the URL keeps its state
window.addEventListener("applanguagechange", () => {
    updateLanguageButton();
    updateThemeButton();
    app.router.go(location.pathname, false);
});

// Offline support: the service worker caches the app after the first visit
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/serviceworker.js");
    });
}
