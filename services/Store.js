import { normalizeItem } from "./Options.js";

const CART_KEY = "cm-cart";
const LAST_ORDER_KEY = "cm-last-order";
const ORDERS_KEY = "cm-orders";
const ORDER_NUMBER_KEY = "cm-order-number";
const FAVOURITES_KEY = "cm-favourites";
const POINTS_KEY = "cm-points";

// Storage can be unavailable (private mode) or hold stale data
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

const savedOrders = load(ORDERS_KEY, []);
const savedFavourites = load(FAVOURITES_KEY, []);
const savedPoints = load(POINTS_KEY, 0);

const Store = {
    menu: null,
    cart: loadItems(load(CART_KEY, [])),
    lastOrder: loadOrder(load(LAST_ORDER_KEY, null)),
    orders: Array.isArray(savedOrders) ? savedOrders.map(loadOrder) : [],
    favourites: Array.isArray(savedFavourites) ? savedFavourites : [],
    points: Number.isInteger(savedPoints) && savedPoints >= 0 ? savedPoints : 0,
}

// Kept in memory too, so numbers still go up when storage is unavailable;
// re-reading storage picks up orders placed in another tab
let lastOrderNumber = 1000;

export function nextOrderNumber() {
    lastOrderNumber = Math.max(load(ORDER_NUMBER_KEY, 1000), lastOrderNumber) + 1;
    save(ORDER_NUMBER_KEY, lastOrderNumber);
    return lastOrderNumber;
}

// What happens when each property is set: where it is saved, and which
// event tells the pages it changed
const effects = {
    menu: { event: "appmenuchange" },
    cart: { key: CART_KEY, event: "appcartchange" },
    lastOrder: { key: LAST_ORDER_KEY, event: "applastorderchange" },
    orders: { key: ORDERS_KEY },
    points: { key: POINTS_KEY },
    favourites: { key: FAVOURITES_KEY, event: "appfavouriteschange" },
};

const proxiedStore = new Proxy(Store, {
    set(target, property, value) {
        target[property] = value;
        const { key, event } = effects[property] ?? {};
        if (key) {
            save(key, value);
        }
        if (event) {
            window.dispatchEvent(new Event(event));
        }
        return true;
    }
});

export default proxiedStore;
