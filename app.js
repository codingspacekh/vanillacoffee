import Store from './services/Store.js'
import { loadData } from './services/Menu.js';
import Router from './services/Router.js';
import { getLanguage, setLanguage, t, translateDocument } from './services/I18n.js';
import { getTheme, setTheme } from './services/Theme.js';
import { watchLastOrder } from './services/Pickup.js';

// Link my Web Components (each module defines its custom element)
import './components/MenuPage.js';
import './components/DetailsPage.js';
import './components/OrderPage.js';
import './components/ProductItem.js';
import './components/CartItem.js';
import './components/ConfirmationPage.js';
import './components/ToastMessage.js';
import './components/OrdersPage.js';
import './components/FavouritesPage.js';

window.app = {}
app.store = Store;
app.router = Router;

// It's better to wait for the event for manipulation
window.addEventListener("DOMContentLoaded", () => {
    loadData();
    translateDocument();
    document.getElementById("year").textContent = new Date().getFullYear();
    updateLanguageButton();
    updateThemeButton();
    document.getElementById("theme").addEventListener("click", () => {
        setTheme(getTheme() == "dark" ? "light" : "dark");
    });
    document.getElementById("language").addEventListener("click", () => {
        setLanguage(getLanguage() == "en" ? "km" : "en");
    });
    app.router.init();
    updateBadge(); // The cart may have been restored from storage
    watchLastOrder(); // An order placed before a reload may not be ready yet
});

window.addEventListener("applastorderchange", watchLastOrder);

function updateBadge() {
    const badge = document.getElementById("badge");
    const qty = app.store.cart.reduce(
        (acc, item) => acc + item.quantity, 0
    );
    badge.textContent = qty;
    badge.hidden = qty == 0;
}

window.addEventListener("appcartchange", updateBadge);

// The button is labelled in the language it switches to
function updateLanguageButton() {
    document.getElementById("language").lang = t("language.switchLang");
}

// Shows what the button switches to
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

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/serviceworker.js");
    });
}
