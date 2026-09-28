// Each component stylesheet is downloaded and parsed once, then shared
// by every instance through adoptedStyleSheets.
const sheets = new Map();

export function loadStyles(url) {
    if (!sheets.has(url)) {
        const sheet = fetch(url)
            .then(response => response.text())
            .then(css => {
                const sheet = new CSSStyleSheet();
                sheet.replaceSync(css);
                return sheet;
            })
            .catch(error => {
                sheets.delete(url);
                throw error;
            });
        sheets.set(url, sheet);
    }
    return sheets.get(url);
}

// adoptStyles(root, "/components/shared.css", "/components/MenuPage.css")
export async function adoptStyles(root, ...urls) {
    root.adoptedStyleSheets = await Promise.all(urls.map(loadStyles));
}
