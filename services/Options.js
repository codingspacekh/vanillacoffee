import { t } from "./I18n.js";
import { roundCents } from "./Money.js";

// Product options (size, milk, ...) are groups of choices; the first
// choice of each group is the default and carries no extra cost.

function groups(product) {
    return product.options ?? [];
}

function chosenChoice(group, options) {
    return group.choices.find(c => c.label == options[group.name]);
}

// Fills in defaults and drops choices the product doesn't offer
export function resolveOptions(product, options = {}) {
    const resolved = {};
    for (const group of groups(product)) {
        resolved[group.name] = (chosenChoice(group, options) ?? group.choices[0]).label;
    }
    return resolved;
}

function nonDefaultChoices(product, options) {
    return groups(product)
        .filter(group => options[group.name] && options[group.name] != group.choices[0].label)
        .map(group => [group.name, options[group.name]]);
}

export function unitPrice(product, options) {
    let price = product.price;
    for (const group of groups(product)) {
        price += chosenChoice(group, options)?.price ?? 0;
    }
    return roundCents(price);
}

// Identifies a cart line: the same product with the same choices
export function itemKey(product, options) {
    return [product.id, ...nonDefaultChoices(product, options).map(([g, c]) => `${g}=${c}`)].join("|");
}

// e.g. "Size: Large · Milk: Oat"; empty when every choice is the default
export function describeOptions(product, options) {
    return nonDefaultChoices(product, options)
        .map(([g, c]) => `${t(`option.${g}`)}: ${t(`choice.${c}`)}`)
        .join(" · ");
}

export function createItem(product, options, quantity = 1) {
    const resolved = resolveOptions(product, options);
    return {
        key: itemKey(product, resolved),
        product,
        options: resolved,
        unitPrice: unitPrice(product, resolved),
        quantity,
    };
}

// Upgrades cart items saved before options existed ({ product, quantity })
export function normalizeItem(item) {
    const options = resolveOptions(item.product, item.options);
    return {
        ...item,
        options,
        key: item.key ?? itemKey(item.product, options),
        unitPrice: item.unitPrice ?? unitPrice(item.product, options),
    };
}
