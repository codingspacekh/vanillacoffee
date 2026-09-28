# Coffee Masters — Starter

A coffee-shop ordering app built with plain HTML, CSS and JavaScript: no
frameworks, no build step.

This starter gives you the finished markup, styles and data. You write the
JavaScript.

## Run it

1. Open this folder in VS Code.
2. Install the **Live Server** extension and click **Go Live**.
3. Open http://localhost:5500

The project's `.vscode/settings.json` tells Live Server to answer every
unknown URL with `index.html`. The app will handle routes such as
`/product-12` itself, so refreshing those pages keeps working.

## What's inside

```
index.html          Page shell (header, main, footer) and <template>s for every page
app.js              Your starting point (empty)
styles/
  global.css        Colors, light/dark themes, header, tab bar, footer, toast
  shared.css        Base styles for components: buttons, cards, icons
  MenuPage.css      One stylesheet per page component
  DetailsPage.css
  OrderPage.css
  OrdersPage.css
  ConfirmationPage.css
data/
  menu.json         Categories and products (prices, options, Khmer translations)
  images/           Product photos
images/             Logo and app icons
app.webmanifest     Makes the app installable
```

`<main>` starts empty. The app will render each page into it from the
templates in `index.html`.
