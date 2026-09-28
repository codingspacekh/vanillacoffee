import { getProductById } from "./Menu.js";
import { nextOrderNumber } from "./Store.js";
import { createItem } from "./Options.js";

const MAX_ORDERS = 50;

function showToast(message) {
    window.dispatchEvent(new CustomEvent("apptoast", { detail: message }));
}

// Adds items, merging with lines that have the same product and choices
function mergeIntoCart(items) {
    let cart = app.store.cart;
    for (const item of items) {
        cart = cart.some(p => p.key == item.key)
            ? cart.map(p => p.key == item.key
                            ? { ...p, quantity: p.quantity + item.quantity }
                            : p)
            : [...cart, item];
    }
    app.store.cart = cart;
}

export async function addToCart(id, options = {}) {
    const product = await getProductById(id);
    if (!product) {
        return;
    }
    mergeIntoCart([createItem(product, options)]);
    showToast(`${product.name} added to cart`);
}

export function removeFromCart(key) {
    app.store.cart = app.store.cart.filter(p => p.key != key)
}

// Removes the line when its quantity drops to zero
export function changeQuantity(key, delta) {
    app.store.cart = app.store.cart
        .map(p => p.key == key
                  ? { ...p, quantity: p.quantity + delta }
                  : p)
        .filter(p => p.quantity > 0);
}

export function clearCart() {
    app.store.cart = [];
}

export function cartTotal(cart) {
    return cart.reduce((total, p) => total + p.quantity * p.unitPrice, 0);
}

export function placeOrder(customer) {
    // TODO Send the order to the server
    const order = {
        number: nextOrderNumber(),
        placedAt: new Date().toISOString(),
        customer: { ...customer },
        items: app.store.cart,
        total: cartTotal(app.store.cart),
    };
    app.store.lastOrder = order;
    app.store.orders = [order, ...app.store.orders].slice(0, MAX_ORDERS);
    clearCart();
    return order;
}

// Uses today's menu, so prices are current and removed products are skipped
export async function reorder(order) {
    const items = [];
    for (const item of order.items) {
        const product = await getProductById(item.product.id);
        if (product) {
            items.push(createItem(product, item.options, item.quantity));
        }
    }
    mergeIntoCart(items);
    showToast(`Order #${order.number} added to cart`);
}
