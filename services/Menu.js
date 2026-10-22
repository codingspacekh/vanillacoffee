import API from "./API.js";

let loading = null;

// Shares one request between concurrent callers
export function loadData() {
    if (!loading) {
        loading = API.fetchMenu()
            .then(menu => {
                app.store.menu = menu;
                return menu;
            })
            .catch(error => {
                loading = null;
                throw error;
            });
    }
    return loading;
}

export async function getProductById(id) {
    if (app.store.menu == null) {
        await loadData();
    }
    // Loose equality: ids from the URL or a dataset are strings
    return app.store.menu.flatMap(c => c.products).find(p => p.id == id) ?? null;
}
