// One point per whole dollar paid; REWARD_POINTS buys one free drink,
// worth the most expensive drink in the cart (options included).
export const REWARD_POINTS = 50;

export function roundCents(amount) {
    return Math.round(amount * 100) / 100;
}

export function pointsFor(total) {
    return Math.floor(roundCents(total));
}

// The cart line the free drink applies to, or undefined if there is no drink
export function rewardItem(cart) {
    return cart
        .filter(item => item.product.drink)
        .reduce((best, item) => !best || item.unitPrice > best.unitPrice ? item : best, undefined);
}

export function hasReward(points) {
    return points >= REWARD_POINTS;
}

// The discount for this cart, 0 when the reward can't be used
export function rewardDiscount(cart, points) {
    return hasReward(points) ? rewardItem(cart)?.unitPrice ?? 0 : 0;
}
