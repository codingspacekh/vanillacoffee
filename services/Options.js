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

// Identifies a cart line: the same product with the same choices and note.
// The note comes last, so whatever it contains can't look like a choice.
export function itemKey(product, options, note = "") {
    return [
        product.id,
        ...nonDefaultChoices(product, options).map(([g, c]) => `${g}=${c}`),
        ...(note ? [`note=${note}`] : []),
    ].join("|");
}

export const NOTE_MAX_LENGTH = 60;

export function cleanNote(note = "") {
    return note.trim().slice(0, NOTE_MAX_LENGTH);
}

// e.g. "Size: Large · Milk: Oat"; empty when every choice is the default
export function describeOptions(product, options) {
    return nonDefaultChoices(product, options)
        .map(([g, c]) => `${t(`option.${g}`)}: ${t(`choice.${c}`)}`)
        .join(" · ");
}

export function createItem(product, options, quantity = 1, note = "") {
    const resolved = resolveOptions(product, options);
    const cleaned = cleanNote(note);
    return {
        key: itemKey(product, resolved, cleaned),
        product,
        options: resolved,
        note: cleaned,
        unitPrice: unitPrice(product, resolved),
        quantity,
    };
}

// Upgrades cart items saved before options or notes existed ({ product, quantity })
export function normalizeItem(item) {
    const options = resolveOptions(item.product, item.options);
    const note = typeof item.note == "string" ? item.note : "";
    return {
        ...item,
        options,
        note,
        key: item.key ?? itemKey(item.product, options, note),
        unitPrice: item.unitPrice ?? unitPrice(item.product, options),
    };
}
