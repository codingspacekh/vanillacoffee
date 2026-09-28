const CART_KEY = "cm-cart";
const LAST_ORDER_KEY = "cm-last-order";
const ORDER_NUMBER_KEY = "cm-order-number";

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

const savedCart = load(CART_KEY, []);

// The app's state lives in one object. Setting a property on the proxy
// saves it and announces the change with an event.
const Store = {
    menu: null,
    cart: Array.isArray(savedCart) ? savedCart : [],
    lastOrder: load(LAST_ORDER_KEY, null),
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
        return true;
    }
});

export default proxiedStore;
