import { t } from "./I18n.js";

// Fixed routes and the page element each one shows
const pages = {
    "/": "menu-page",
    "/order": "order-page",
    "/orders": "orders-page",
    "/favourites": "favourites-page",
    "/order/confirmed": "confirmation-page",
};

const Router = {
    init: () => {
        document.querySelectorAll("a.navlink").forEach(a => {
            a.addEventListener("click", event => {
                event.preventDefault();
                const url = event.currentTarget.getAttribute("href");
                Router.go(url);
            });
        })
        // Event Handler for URL changes
        window.addEventListener("popstate", event => {
            Router.go(event.state?.route ?? location.pathname, false);
        });

        // Check the initial URL, recording it on the current history entry
        history.replaceState({ route: location.pathname }, '', location.pathname + location.search);
        Router.go(location.pathname, false);
    },

    go: (route, addToHistory=true) => {
        if (addToHistory) {
            history.pushState({ route }, '', route);
        }
        let pageElement = null;
        if (pages[route]) {
            pageElement = document.createElement(pages[route]);
        } else if (route.startsWith("/product-")) {
            pageElement = document.createElement("details-page");
            pageElement.dataset.productId = route.substring(route.lastIndexOf("-")+1);
        }
        Router.markCurrentTab(route);

        const main = document.querySelector("main");
        if (pageElement) {
            main.replaceChildren(pageElement);
            window.scrollTo(0, 0);
        } else {
            main.textContent = t("notFound");
        }
    },

    // Highlights the tab for the current page (product pages belong to Menu)
    markCurrentTab: route => {
        document.querySelectorAll("a.navlink").forEach(link => {
            const href = link.getAttribute("href");
            const current = href == "/"
                ? route == "/" || route.startsWith("/product-")
                : route == href;
            if (current) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    },
}

export default Router;
