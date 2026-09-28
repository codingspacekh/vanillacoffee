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
    if (app.store.menu==null) {
        await loadData();
    }
    for (let c of app.store.menu) {
        for (let p of c.products) {
            if (p.id==id) {
                return p;
            }
        }
    }
    return null;
}
