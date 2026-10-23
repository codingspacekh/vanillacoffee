import { roundCents } from "./Money.js";

// The codes on offer; a server would check these once orders are sent to one.
// A code applies to what is left after the free drink.
const PROMOS = {
    WELCOME10: { percent: 10 },
    SAVE2: { amount: 2, minimum: 10 },
};

// Codes are matched ignoring case and surrounding spaces
export function normalizeCode(code) {
    return code.trim().toUpperCase();
}

// Why the code can't be used on this amount ("unknown" or "minimum"),
// or "" when it can
export function promoProblem(code, amount) {
    const promo = PROMOS[normalizeCode(code)];
    if (!promo) {
        return "unknown";
    }
    return amount < (promo.minimum ?? 0) ? "minimum" : "";
}

export function promoMinimum(code) {
    return PROMOS[normalizeCode(code)]?.minimum ?? 0;
}

// Never more than the amount, so the total can't go below zero
export function promoDiscount(code, amount) {
    if (!code || promoProblem(code, amount)) {
        return 0;
    }
    const promo = PROMOS[normalizeCode(code)];
    const discount = promo.percent ? amount * promo.percent / 100 : promo.amount;
    return roundCents(Math.min(discount, amount));
}
