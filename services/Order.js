import { getProductById } from "./Menu.js";
import { nextOrderNumber } from "./Store.js";

export async function addToCart(id) {
    const product = await getProductById(id);
    const results = app.store.cart.filter(
        prodInCart => prodInCart.product.id == id);
    if (results.length==1) {
        // The product is already in the cart
        // update the current item
        app.store.cart = app.store.cart.map(
            p => p.product.id == id
                 ? { ...p, quantity: p.quantity+1 }
                 : p
        );
    } else {
        app.store.cart = [...app.store.cart, {product, quantity: 1}];
    }
    window.dispatchEvent(new CustomEvent("appcartadd", { detail: product }));
}

export function removeFromCart(id) {
    app.store.cart = app.store.cart.filter(p => p.product.id!=id)
}

// Removes the item when its quantity drops to zero
export function changeQuantity(id, delta) {
    app.store.cart = app.store.cart
        .map(p => p.product.id == id
                  ? { ...p, quantity: p.quantity + delta }
                  : p)
        .filter(p => p.quantity > 0);
}

export function clearCart() {
    app.store.cart = [];
}

export function cartTotal(cart) {
    return cart.reduce((total, p) => total + p.quantity * p.product.price, 0);
}

export function placeOrder(customer) {
    // TODO Send the order to the server
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
