// Bump the version whenever the precache list changes; old caches are
// deleted when the new worker activates.
const CACHE = "coffeemasters-v2";

const PRECACHE = [
    "/",
    "/app.js",
    "/styles.css",
    "/app.webmanifest",
    "/images/logo.svg",
    "/images/icons/icon.png",
    "/data/menu.json",
    ...["blackamericano", "blacktea", "cappuccino", "coldbrew", "croissant", "flatwhite",
        "frappuccino", "greentea", "icedcoffee", "macchiato", "muffin"]
        .map(name => `/data/images/${name}.png`),
    ...["CartItem", "ConfirmationPage", "DetailsPage", "MenuPage", "OrderPage", "OrdersPage",
        "ProductItem", "ToastMessage"]
        .map(name => `/components/${name}.js`),
    ...["ConfirmationPage", "DetailsPage", "MenuPage", "OrderPage", "OrdersPage"]
        .map(name => `/components/${name}.css`),
    ...["API", "Favourites", "I18n", "Menu", "Options", "Order", "Router", "Store", "Styles"]
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

self.addEventListener("fetch", event => {
    const request = event.request;
    if (request.method != "GET") {
        return;
    }
    const url = new URL(request.url);

    if (request.mode == "navigate") {
        // Every route is served by index.html, cached as "/"
        event.respondWith(networkFirst(request, "/"));
    } else if (url.origin == location.origin) {
        const isImage = url.pathname.startsWith("/data/images/") || url.pathname.startsWith("/images/");
        // Code and menu data stay fresh while online; images rarely change
        event.respondWith(isImage ? cacheFirst(request) : networkFirst(request));
    } else if (FONT_HOSTS.includes(url.hostname)) {
        // Without the icon font, the nav icons would show as words offline
        event.respondWith(cacheFirst(request));
    }
});

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
