import Store from './services/Store.js'
import API from './services/API.js'
import { loadData } from './services/Menu.js';
import Router from './services/Router.js';
import { getLanguage, setLanguage, t, translateDocument } from './services/I18n.js';

// Link my Web Components
import { MenuPage } from './components/MenuPage.js';
import { DetailsPage } from './components/DetailsPage.js';
import { OrderPage } from './components/OrderPage.js';
import ProductItem from './components/ProductItem.js';
import CartItem from './components/CartItem.js';
import { ConfirmationPage } from './components/ConfirmationPage.js';
import ToastMessage from './components/ToastMessage.js';
import { OrdersPage } from './components/OrdersPage.js';

window.app = {}
app.store = Store;
app.router = Router;



// It's better to wait for the event for manipulation
window.addEventListener("DOMContentLoaded", async () => {
   loadData();
   translateDocument();
   updateLanguageButton();
   document.getElementById("language").addEventListener("click", () => {
      setLanguage(getLanguage() == "en" ? "km" : "en");
   });
   app.router.init();
   updateBadge(); // The cart may have been restored from storage
});

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

// Rebuild the current page in the new language; the URL keeps its state
window.addEventListener("applanguagechange", () => {
    updateLanguageButton();
    app.router.go(location.pathname, false);
});







if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/serviceworker.js");
    });
}
