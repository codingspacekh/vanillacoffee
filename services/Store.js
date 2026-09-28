// The app's state lives in one object. Setting a property on the proxy
// also announces the change with an event, so views know to re-render.
const Store = {
    menu: null,
    cart: [],
    lastOrder: null,
};

let lastOrderNumber = 1000;

export function nextOrderNumber() {
    lastOrderNumber += 1;
    return lastOrderNumber;
}

const proxiedStore = new Proxy(Store, {
    set(target, property, value) {
        target[property] = value;
        if (property == "menu") {
            window.dispatchEvent(new Event("appmenuchange"));
        }
        if (property == "cart") {
            window.dispatchEvent(new Event("appcartchange"));
        }
        return true;
    }
});

export default proxiedStore;
