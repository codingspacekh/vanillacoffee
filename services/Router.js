const Router = {
    init: () => {
        // Nav links change the page without reloading it
        document.querySelectorAll("a.navlink").forEach(a => {
            a.addEventListener("click", event => {
                event.preventDefault();
                Router.go(event.currentTarget.getAttribute("href"));
            });
        });
        // The browser's Back and Forward buttons
        window.addEventListener("popstate", event => {
            Router.go(event.state?.route ?? location.pathname, false);
        });
        // Show the page for the URL we started on, and record it in history
        history.replaceState({ route: location.pathname }, "", location.pathname);
        Router.go(location.pathname, false);
    },

    go: (route, addToHistory = true) => {
        if (addToHistory) {
            history.pushState({ route }, "", route);
        }
        let pageElement = null;
        switch (route) {
            case "/":
                pageElement = document.createElement("menu-page");
                break;
            case "/order":
                pageElement = document.createElement("order-page");
                break;
            default:
                if (route.startsWith("/product-")) {
                    pageElement = document.createElement("details-page");
                    pageElement.dataset.productId = route.substring(route.lastIndexOf("-") + 1);
                }
        }
        Router.markCurrentTab(route);
        const main = document.querySelector("main");
        if (pageElement) {
            main.innerHTML = "";
            main.appendChild(pageElement);
            window.scrollTo(0, 0);
        } else {
            main.textContent = "Oups, 404!";
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
};

export default Router;
