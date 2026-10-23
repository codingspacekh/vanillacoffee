# Roadmap

Ideas for what to add next. Tick them off as they land.

## Ordering

- [x] **Pickup time** — "ASAP" or a time slot on the order page, shown on the confirmation and in order history.
- [x] **Order status tracker** — the confirmation page steps through Received → Preparing → Ready, with a browser notification when the order is ready.
- [x] **Item notes** — a short free-text note per item ("extra hot", "no lid"); different notes are separate cart lines.
- [x] **Promo codes** — a discount line next to the free-drink reward in the order totals.

## Menu and product page

- [ ] **Sort the menu** by price or name, kept in the URL like the filter.
- [ ] **Allergens and nutrition** — calories and allergen tags in `data/menu.json`, shown on the details page, plus a "dairy-free" filter chip.
- [ ] **Recently viewed** products in a row at the top of the menu.
- [ ] **Share button** on the details page with `navigator.share`, falling back to copying the link.

## App and PWA

- [ ] **Install prompt** — catch `beforeinstallprompt` and show an "Install app" button.
- [ ] **Clear history / reset my data** for orders, points and favourites.

## Engineering

- [ ] **Unit tests for the services** (`Options.js`, `Loyalty.js`, `Money.js`, the totals in `Order.js`) with Node's built-in `node:test`.
- [ ] **CI** — a GitHub Actions workflow that runs the Playwright tests on every push.
- [ ] **Accessibility checks** with `@axe-core/playwright` in the existing test run.
- [ ] **A small backend** — `POST /orders` and `GET /orders/:id`, replacing the `TODO Send the order to the server` in `placeOrder`; the status tracker could then read real status.
- [ ] **README** — what the app does, how to run and test it, a screenshot.

## Cleanup

- [ ] Untrack `images/.DS_Store` and add `.DS_Store` to `.gitignore`.
