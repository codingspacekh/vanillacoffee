// UI text in English and Khmer. Menu names and descriptions live in
// data/menu.json under each item's "translations".

const LANGUAGE_KEY = "cm-language";

export const languages = ["en", "km"];

export const dictionaries = {
    en: {
        "nav.main": "Main",
        "nav.menu": "Menu",
        "nav.historyShort": "History",
        "nav.cartShort": "Cart",
        "nav.orders": "Order history",
        "nav.cart": "Cart",
        "language.switch": "ភាសាខ្មែរ",
        "language.switchShort": "ខ្មែរ",
        "language.switchLang": "km",

        "menu.greeting": "What would you like today?",
        "menu.search": "Search the menu",
        "menu.categories": "Categories",
        "menu.all": "All",
        "menu.favourites": "Favourites",
        "menu.loading": "Loading...",
        "menu.noResults": "No items match \"{query}\"",
        "menu.clearFilters": "Clear filters",
        "product.add": "Add",
        "product.favourite": "Favourite {name}",

        "details.back": "Back",
        "details.notFound": "Product not found",
        "details.price": "$ {price} ea",
        "details.addToCart": "Add to cart",

        "option.Size": "Size",
        "option.Milk": "Milk",
        "option.Extra shot": "Extra shot",
        "choice.Small": "Small",
        "choice.Medium": "Medium",
        "choice.Large": "Large",
        "choice.None": "None",
        "choice.Whole": "Whole",
        "choice.Skim": "Skim",
        "choice.Oat": "Oat",
        "choice.Almond": "Almond",
        "choice.No": "No",
        "choice.Yes": "Yes",

        "cart.decrease": "Decrease quantity of {name}",
        "cart.increase": "Increase quantity of {name}",
        "cart.remove": "Remove {name}",
        "cart.added": "{name} added to cart",

        "order.empty": "Your order is empty",
        "order.browse": "Browse the menu",
        "order.title": "Your Order",
        "order.total": "Total",
        "order.name": "Your Name",
        "order.phone": "Your Phone Number",
        "order.email": "Your Email",
        "order.place": "Place Order",
        "order.error.name": "Please enter your name",
        "order.error.phoneMissing": "Please enter your phone number",
        "order.error.phoneInvalid": "Please enter a valid phone number",
        "order.error.email": "Please enter a valid email address",

        "confirmation.thanks": "Thank you, {name}!",
        "confirmation.number": "Order #{number}",
        "confirmation.total": "Total {total}",
        "confirmation.none": "No recent order",
        "common.backToMenu": "Back to menu",

        "orders.title": "Order history",
        "orders.empty": "No past orders yet",
        "orders.reorder": "Reorder",
        "orders.reorderLabel": "Reorder order #{number}",
        "orders.added": "Order #{number} added to cart",

        "loyalty.label": "Loyalty points",
        "loyalty.points": "{points} / {goal} points",
        "loyalty.remaining": "{remaining} more points for a free drink",
        "loyalty.useReward": "Use my free drink (−{amount})",
        "loyalty.addDrink": "You have a free drink! Add a drink to use it.",
        "loyalty.rewardLine": "Free drink",
        "loyalty.earned": "+{earned} points · You now have {balance} points",
        "loyalty.rewardReady": "You've earned a free drink! Use it on your next order.",
        "loyalty.balance": "You have {points} points",

        "footer.rights": "All rights reserved.",

        "notFound": "Oups, 404!",
    },
    km: {
        "nav.main": "ការរុករកមេ",
        "nav.menu": "ម៉ឺនុយ",
        "nav.historyShort": "ប្រវត្តិ",
        "nav.cartShort": "កន្ត្រក",
        "nav.orders": "ប្រវត្តិការបញ្ជាទិញ",
        "nav.cart": "កន្ត្រកទំនិញ",
        "language.switch": "English",
        "language.switchShort": "EN",
        "language.switchLang": "en",

        "menu.greeting": "តើអ្នកចង់ពិសាអ្វីថ្ងៃនេះ?",
        "menu.search": "ស្វែងរកក្នុងម៉ឺនុយ",
        "menu.categories": "ប្រភេទ",
        "menu.all": "ទាំងអស់",
        "menu.favourites": "ចំណូលចិត្ត",
        "menu.loading": "កំពុងផ្ទុក...",
        "menu.noResults": "រកមិនឃើញអ្វីដែលត្រូវនឹង \"{query}\" ទេ",
        "menu.clearFilters": "សម្អាតតម្រង",
        "product.add": "បន្ថែម",
        "product.favourite": "ចំណូលចិត្ត {name}",

        "details.back": "ត្រឡប់",
        "details.notFound": "រកមិនឃើញផលិតផល",
        "details.price": "$ {price} ក្នុងមួយ",
        "details.addToCart": "ដាក់ចូលកន្ត្រក",

        "option.Size": "ទំហំ",
        "option.Milk": "ទឹកដោះគោ",
        "option.Extra shot": "បន្ថែមអេសប្រេសូ",
        "choice.Small": "តូច",
        "choice.Medium": "មធ្យម",
        "choice.Large": "ធំ",
        "choice.None": "គ្មាន",
        "choice.Whole": "ទឹកដោះគោស្រស់",
        "choice.Skim": "ទឹកដោះគោគ្មានខ្លាញ់",
        "choice.Oat": "ទឹកដោះអូត",
        "choice.Almond": "ទឹកដោះអាល់ម៉ុន",
        "choice.No": "មិនបន្ថែម",
        "choice.Yes": "បន្ថែម",

        "cart.decrease": "បន្ថយចំនួន {name}",
        "cart.increase": "បង្កើនចំនួន {name}",
        "cart.remove": "ដក {name} ចេញ",
        "cart.added": "បានដាក់ {name} ចូលកន្ត្រក",

        "order.empty": "ការបញ្ជាទិញរបស់អ្នកនៅទទេ",
        "order.browse": "មើលម៉ឺនុយ",
        "order.title": "ការបញ្ជាទិញរបស់អ្នក",
        "order.total": "សរុប",
        "order.name": "ឈ្មោះរបស់អ្នក",
        "order.phone": "លេខទូរស័ព្ទរបស់អ្នក",
        "order.email": "អ៊ីមែលរបស់អ្នក",
        "order.place": "បញ្ជាទិញ",
        "order.error.name": "សូមបញ្ចូលឈ្មោះរបស់អ្នក",
        "order.error.phoneMissing": "សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នក",
        "order.error.phoneInvalid": "សូមបញ្ចូលលេខទូរស័ព្ទឱ្យបានត្រឹមត្រូវ",
        "order.error.email": "សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលឱ្យបានត្រឹមត្រូវ",

        "confirmation.thanks": "សូមអរគុណ {name}!",
        "confirmation.number": "ការបញ្ជាទិញ #{number}",
        "confirmation.total": "សរុប {total}",
        "confirmation.none": "មិនមានការបញ្ជាទិញថ្មីៗទេ",
        "common.backToMenu": "ត្រឡប់ទៅម៉ឺនុយវិញ",

        "orders.title": "ប្រវត្តិការបញ្ជាទិញ",
        "orders.empty": "មិនទាន់មានការបញ្ជាទិញពីមុនទេ",
        "orders.reorder": "បញ្ជាទិញម្តងទៀត",
        "orders.reorderLabel": "បញ្ជាទិញម្តងទៀតនូវការបញ្ជាទិញ #{number}",
        "orders.added": "បានដាក់ការបញ្ជាទិញ #{number} ចូលកន្ត្រក",

        "loyalty.label": "ពិន្ទុសន្សំ",
        "loyalty.points": "{points} / {goal} ពិន្ទុ",
        "loyalty.remaining": "ត្រូវការ {remaining} ពិន្ទុទៀត ដើម្បីទទួលបានភេសជ្ជៈឥតគិតថ្លៃ",
        "loyalty.useReward": "ប្រើភេសជ្ជៈឥតគិតថ្លៃរបស់ខ្ញុំ (−{amount})",
        "loyalty.addDrink": "អ្នកមានភេសជ្ជៈឥតគិតថ្លៃ! សូមបន្ថែមភេសជ្ជៈដើម្បីប្រើវា។",
        "loyalty.rewardLine": "ភេសជ្ជៈឥតគិតថ្លៃ",
        "loyalty.earned": "+{earned} ពិន្ទុ · ឥឡូវអ្នកមាន {balance} ពិន្ទុ",
        "loyalty.rewardReady": "អ្នកទទួលបានភេសជ្ជៈឥតគិតថ្លៃ! ប្រើវានៅការបញ្ជាទិញលើកក្រោយ។",
        "loyalty.balance": "អ្នកមាន {points} ពិន្ទុ",

        "footer.rights": "រក្សាសិទ្ធិគ្រប់យ៉ាង។",

        "notFound": "រកមិនឃើញទំព័រ (404)",
    },
};

function initialLanguage() {
    try {
        const saved = localStorage.getItem(LANGUAGE_KEY);
        if (languages.includes(saved)) {
            return saved;
        }
    } catch {
        // Storage unavailable; fall back to the browser language
    }
    return navigator.language?.toLowerCase().startsWith("km") ? "km" : "en";
}

let current = initialLanguage();

export function getLanguage() {
    return current;
}

export function setLanguage(language) {
    current = language;
    try {
        localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
        // Keep it for this visit only
    }
    translateDocument();
    window.dispatchEvent(new Event("applanguagechange"));
}

// t("confirmation.thanks", { name: "Alex" }) → "Thank you, Alex!"
export function t(key, params = {}) {
    const text = dictionaries[current][key] ?? dictionaries.en[key] ?? key;
    return text.replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match);
}

// A menu category or product field in the current language
export function localized(item, field = "name") {
    return item.translations?.[current]?.[field] ?? item[field];
}

export function formatDate(date) {
    return new Intl.DateTimeFormat(current == "km" ? "km-KH" : "en-US",
        { dateStyle: "medium", timeStyle: "short" }).format(date);
}

// Fills elements marked with data-i18n (text), data-i18n-label (aria-label)
// and data-i18n-placeholder
export function translate(root) {
    root.querySelectorAll("[data-i18n]").forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    root.querySelectorAll("[data-i18n-label]").forEach(el => {
        el.setAttribute("aria-label", t(el.dataset.i18nLabel));
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
    });
}

// Translating the templates too means every component clones text
// that is already in the current language
export function translateDocument() {
    document.documentElement.lang = current;
    translate(document);
    document.querySelectorAll("template").forEach(template => translate(template.content));
}
