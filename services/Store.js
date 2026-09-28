import { normalizeItem } from "./Options.js";

const CART_KEY = "cm-cart";
const LAST_ORDER_KEY = "cm-last-order";
const ORDER_NUMBER_KEY = "cm-order-number";
const FAVOURITES_KEY = "cm-favourites";

// Storage can be unavailable (private browsing) or hold broken data,
// so every read has a fallback and every write may quietly fail
function load(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}

function save(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Keep working in memory only
    }
}

// Saved cart lines may come from an older version of the app
function loadItems(items) {
    try {
        return Array.isArray(items) ? items.map(normalizeItem) : [];
    } catch {
        return [];
    }
}

function loadOrder(order) {
    return order && { ...order, items: loadItems(order.items) };
}

const savedFavourites = load(FAVOURITES_KEY, []);

// The app's state lives in one object. Setting a property on the proxy
// saves it and announces the change with an event.
const Store = {
    menu: null,
    cart: loadItems(load(CART_KEY, [])),
    lastOrder: loadOrder(load(LAST_ORDER_KEY, null)),
    favourites: Array.isArray(savedFavourites) ? savedFavourites : [],
};

export function nextOrderNumber() {
    const number = load(ORDER_NUMBER_KEY, 1000) + 1;
    save(ORDER_NUMBER_KEY, number);
    return number;
}

const proxiedStore = new Proxy(Store, {
    set(target, property, value) {
        target[property] = value;
        if (property == "menu") {
            window.dispatchEvent(new Event("appmenuchange"));
        }
        if (property == "cart") {
            save(CART_KEY, value);
            window.dispatchEvent(new Event("appcartchange"));
        }
        if (property == "lastOrder") {
            save(LAST_ORDER_KEY, value);
        }
        if (property == "favourites") {
            save(FAVOURITES_KEY, value);
            window.dispatchEvent(new Event("appfavouriteschange"));
        }
        return true;
    }
});

export default proxiedStore;
