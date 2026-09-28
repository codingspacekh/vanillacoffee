export function isFavourite(id) {
    return app.store.favourites.includes(id);
}

export function toggleFavourite(id) {
    app.store.favourites = isFavourite(id)
        ? app.store.favourites.filter(f => f != id)
        : [...app.store.favourites, id];
}
