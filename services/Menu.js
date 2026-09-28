import API from "./API.js";

let loading = null;

// Loads the menu once; callers that ask while it's loading share the request
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
