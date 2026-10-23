// Bump the version whenever the precache list changes; old caches are
// deleted when the new worker activates.
const CACHE = "coffeemasters-v10";

const PRECACHE = [
    "/",
    "/app.js",
    "/app.webmanifest",
    "/images/logo.svg",
    "/images/icons/icon.png",
    "/data/menu.json",
    ...["blackamericano", "blacktea", "cappuccino", "coldbrew", "croissant", "flatwhite",
        "frappuccino", "greentea", "icedcoffee", "macchiato", "muffin"]
        .map(name => `/data/images/${name}.png`),
    ...["CartItem", "ConfirmationPage", "DetailsPage", "FavouritesPage", "MenuPage", "OrderPage", "OrdersPage",
        "ProductItem", "ToastMessage"]
        .map(name => `/components/${name}.js`),
    ...["ConfirmationPage", "DetailsPage", "FavouritesPage", "MenuPage", "OrderPage", "OrdersPage", "ProductGrid"]
        .map(name => `/styles/${name}.css`),
    "/styles/global.css",
    "/styles/shared.css",
    ...["API", "Favourites", "I18n", "Loyalty", "Menu", "Money", "Options", "Order", "Pickup", "Promo",
        "Router", "Store", "Styles", "Theme"]
        .map(name => `/services/${name}.js`),
];

const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE)
            .then(cache => cache.addAll(PRECACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(key => key != CACHE).map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

// Tapping the "order ready" notification brings the app forward
self.addEventListener("notificationclick", event => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: "window" })
            .then(windows => windows[0]?.focus() ?? self.clients.openWindow("/order/confirmed"))
    );
});

self.addEventListener("fetch", event => {
    const request = event.request;
    if (request.method != "GET") {
        return;
    }
    const url = new URL(request.url);

    if (request.mode == "navigate") {
        event.respondWith(navigate(request));
    } else if (url.origin == location.origin) {
        const isImage = url.pathname.startsWith("/data/images/") || url.pathname.startsWith("/images/");
        // Code and menu data stay fresh while online; images rarely change
        event.respondWith(isImage ? cacheFirst(request) : networkFirst(request));
    } else if (FONT_HOSTS.includes(url.hostname)) {
        // Without the icon font, the nav icons would show as words offline
        event.respondWith(cacheFirst(request));
    }
});

// Every route is served by the app shell (index.html), cached as "/".
// Plain static hosts answer routes like /product-12 with 404 because no such
// file exists, so on a 404 the cached shell is used and the app routes itself.
async function navigate(request) {
    const cache = await caches.open(CACHE);
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put("/", response.clone());
            return response;
        }
        if (response.status == 404) {
            return await cache.match("/") ?? response;
        }
        return response;
    } catch (error) {
        const cached = await cache.match("/");
        if (cached) {
            return cached;
        }
        throw error;
    }
}

async function networkFirst(request, cacheKey = request) {
    const cache = await caches.open(CACHE);
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(cacheKey, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await cache.match(cacheKey, { ignoreSearch: true });
        if (cached) {
            return cached;
        }
        throw error;
    }
}

async function cacheFirst(request) {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) {
        return cached;
    }
    const response = await fetch(request);
    if (response.ok || response.type == "opaque") {
        cache.put(request, response.clone());
    }
    return response;
}
