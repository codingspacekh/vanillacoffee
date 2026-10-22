// Prices are dollars; sums are rounded to whole cents to avoid float drift
export function roundCents(amount) {
    return Math.round(amount * 100) / 100;
}

// formatPrice(4.5) → "$4.50"
export function formatPrice(amount) {
    return `$${amount.toFixed(2)}`;
}
