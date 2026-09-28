import { getProductById } from "./Menu.js";
import { nextOrderNumber } from "./Store.js";

export async function addToCart(id) {
    const product = await getProductById(id);
    if (!product) {
        return;
    }
    const inCart = app.store.cart.some(item => item.product.id == id);
    // Always assign a new array: the Store only notices assignments
    app.store.cart = inCart
        ? app.store.cart.map(item => item.product.id == id
                                     ? { ...item, quantity: item.quantity + 1 }
                                     : item)
        : [...app.store.cart, { product, quantity: 1 }];
}

export function removeFromCart(id) {
    app.store.cart = app.store.cart.filter(item => item.product.id != id);
}

export function cartTotal(cart) {
    return cart.reduce((total, item) => total + item.quantity * item.product.price, 0);
}

export function clearCart() {
    app.store.cart = [];
}

export function placeOrder(customer) {
    // A real shop would send the order to a server here
    const order = {
        number: nextOrderNumber(),
        customer: { ...customer },
        items: app.store.cart,
        total: cartTotal(app.store.cart),
    };
    app.store.lastOrder = order;
    clearCart();
    return order;
}
