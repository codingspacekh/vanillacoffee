// The page follows the system theme until the user picks one; the choice
// is applied early by an inline script in index.html to avoid a flash.
const THEME_KEY = "cm-theme";
const systemDark = matchMedia("(prefers-color-scheme: dark)");

export function getTheme() {
    return document.documentElement.dataset.theme
        ?? (systemDark.matches ? "dark" : "light");
}

export function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch {
        // Keep it for this visit only
    }
    window.dispatchEvent(new Event("appthemechange"));
}

systemDark.addEventListener("change", () => {
    window.dispatchEvent(new Event("appthemechange"));
});
