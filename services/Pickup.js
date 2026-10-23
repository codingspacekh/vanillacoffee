// Pickup times and order progress. There is no kitchen to ask yet, so an
// order's status is worked out from when it was placed and when it is due.

import { formatTime, t } from "./I18n.js";

export const ASAP = "asap";
export const SLOT_MINUTES = 15;
export const SLOT_COUNT = 8;
// How long an order waits before it is started, when wanted as soon as possible
const QUEUE_MINUTES = 2;
// How long making an order takes
const PREP_MINUTES = 5;

const MINUTE = 60 * 1000;

export const STATUSES = ["received", "preparing", "ready"];

// The next SLOT_COUNT quarter hours, the first at least SLOT_MINUTES away
export function pickupSlots(now = new Date()) {
    const first = new Date(now);
    first.setSeconds(0, 0);
    first.setMinutes(Math.ceil((first.getMinutes() + SLOT_MINUTES) / SLOT_MINUTES) * SLOT_MINUTES);
    return Array.from({ length: SLOT_COUNT },
        (_, i) => new Date(first.getTime() + i * SLOT_MINUTES * MINUTE));
}

// ASAP, or a slot that is still far enough away to make the order in time
export function isValidPickup(pickup, now = new Date()) {
    return pickup == ASAP || new Date(pickup) - now >= PREP_MINUTES * MINUTE;
}

export function readyAt(order) {
    return order.pickup == ASAP
        ? new Date(new Date(order.placedAt).getTime() + (QUEUE_MINUTES + PREP_MINUTES) * MINUTE)
        : new Date(order.pickup);
}

function preparingAt(order) {
    return new Date(readyAt(order).getTime() - PREP_MINUTES * MINUTE);
}

export function orderStatus(order, now = new Date()) {
    if (now >= readyAt(order)) {
        return "ready";
    }
    return now >= preparingAt(order) ? "preparing" : "received";
}

// When the status changes next, or null once the order is ready
export function nextStatusChange(order, now = new Date()) {
    const changes = [preparingAt(order), readyAt(order)];
    return changes.find(time => time > now) ?? null;
}

// "Pickup at 3:15 PM"; "" for orders placed before pickup times existed
export function describePickup(order) {
    if (!order.pickup) {
        return "";
    }
    return order.pickup == ASAP
        ? t("pickup.asap")
        : t("pickup.at", { time: formatTime(new Date(order.pickup)) });
}

let readyTimer = null;

// Tells the customer when their latest order is ready, whichever page is
// open: with a toast, and a notification if they allowed them
export function watchLastOrder() {
    clearTimeout(readyTimer);
    const order = app.store.lastOrder;
    if (!order?.pickup || orderStatus(order) == "ready") {
        return;
    }
    readyTimer = setTimeout(() => announceReady(order), readyAt(order) - Date.now());
}

async function announceReady(order) {
    window.dispatchEvent(new CustomEvent("apptoast", { detail: t("status.readyText") }));
    if (!("Notification" in window) || Notification.permission != "granted") {
        return;
    }
    const title = t("status.notificationTitle", { number: order.number });
    const options = { body: t("status.notificationBody"), icon: "/images/icons/icon.png", tag: `order-${order.number}` };
    try {
        // Phones only show notifications that come from the service worker
        const registration = await navigator.serviceWorker?.getRegistration();
        if (registration) {
            await registration.showNotification(title, options);
        } else {
            new Notification(title, options);
        }
    } catch {
        // The toast has already told them
    }
}
