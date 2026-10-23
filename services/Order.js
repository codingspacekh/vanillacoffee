import { getProductById } from "./Menu.js";
import { nextOrderNumber } from "./Store.js";
import { createItem } from "./Options.js";
import { localized, t } from "./I18n.js";
import { pointsFor, REWARD_POINTS, rewardDiscount } from "./Loyalty.js";
import { roundCents } from "./Money.js";
import { normalizeCode, promoDiscount } from "./Promo.js";
import { ASAP } from "./Pickup.js";

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

export async function addToCart(id, options = {}, note = "") {
    const product = await getProductById(id);
    if (!product) {
        return;
    }
    mergeIntoCart([createItem(product, options, 1, note)]);
    showToast(t("cart.added", { name: localized(product) }));
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
    return roundCents(cart.reduce((total, p) => total + p.quantity * p.unitPrice, 0));
}

// The cart's totals, with the free drink applied when asked for and allowed,
// then the promo code on what is left
export function orderTotals(cart, { useReward = false, promoCode = "" } = {}) {
    const subtotal = cartTotal(cart);
    const discount = useReward ? rewardDiscount(cart, app.store.points) : 0;
    const afterReward = roundCents(subtotal - discount);
    const promoAmount = promoDiscount(promoCode, afterReward);
    return { subtotal, discount, promoAmount, total: roundCents(afterReward - promoAmount) };
}

export function placeOrder(customer, { useReward = false, promoCode = "", pickup = ASAP } = {}) {
    // TODO Send the order to the server
    const { subtotal, discount, promoAmount, total } =
        orderTotals(app.store.cart, { useReward, promoCode });
    const pointsUsed = discount > 0 ? REWARD_POINTS : 0;
    const pointsEarned = pointsFor(total);
    app.store.points = app.store.points - pointsUsed + pointsEarned;
    const order = {
        number: nextOrderNumber(),
        placedAt: new Date().toISOString(),
        pickup,
        customer: { ...customer },
        items: app.store.cart,
        subtotal,
        discount,
        promoCode: promoAmount > 0 ? normalizeCode(promoCode) : "",
        promoAmount,
        total,
        pointsUsed,
        pointsEarned,
        pointsBalance: app.store.points,
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
            items.push(createItem(product, item.options, item.quantity, item.note));
        }
    }
    mergeIntoCart(items);
    showToast(t("orders.added", { number: order.number }));
}
