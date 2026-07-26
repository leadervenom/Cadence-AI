import { randomUUID } from "node:crypto";

// Sections of event_data that are plain top-level arrays.
export const ARRAY_SECTIONS = new Set(["running_order", "vips", "sources"]);

// Sections whose editable items don't live at the section root, but nested
// one level in (e.g. seating.layouts). Lets append/update/delete share one
// code path for both plain array sections and this kind of section.
export const NESTED_COLLECTIONS = { seating: "layouts" };

export const ITEM_SECTIONS = new Set([
    ...ARRAY_SECTIONS,
    ...Object.keys(NESTED_COLLECTIONS)
]);

export function getCollection(event, section) {
    if (ARRAY_SECTIONS.has(section)) {
        return Array.isArray(event?.[section]) ? event[section] : [];
    }

    const key = NESTED_COLLECTIONS[section];
    const collection = event?.[section]?.[key];

    return Array.isArray(collection) ? collection : [];
}


export function setCollection(event, section, items) {
    if (ARRAY_SECTIONS.has(section)) {
        event[section] = items;
        return;
    }

    const key = NESTED_COLLECTIONS[section];

    event[section] = {
        ...(event[section] || {}),
        [key]: items
    };
}


export function backfillIds(event, section) {
    if (!ITEM_SECTIONS.has(section)) {
        return;
    }

    const items = getCollection(event, section).map((item) => ({
        ...item,
        id: item?.id || randomUUID()
    }));

    setCollection(event, section, items);
}


export function findItem(event, section, itemId) {
    return getCollection(event, section).find((item) => item?.id === itemId) || null;
}


export function appendItem(event, section, payload) {
    const updatedEvent = structuredClone(event);
    const items = getCollection(updatedEvent, section);
    const newItem = { ...payload, id: randomUUID() };

    setCollection(updatedEvent, section, items.concat([newItem]));

    if (section === "seating" && !updatedEvent.seating.activeLayoutId) {
        updatedEvent.seating.activeLayoutId = newItem.id;
    }

    return { updatedEvent, item: newItem };
}


export function updateItem(event, section, itemId, payload) {
    const updatedEvent = structuredClone(event);
    const items = getCollection(updatedEvent, section);
    const index = items.findIndex((item) => item?.id === itemId);

    if (index === -1) {
        return { updatedEvent: event, item: null };
    }

    items[index] = { ...items[index], ...payload, id: items[index].id };
    setCollection(updatedEvent, section, items);

    return { updatedEvent, item: items[index] };
}


export function deleteItem(event, section, itemId) {
    const updatedEvent = structuredClone(event);
    const items = getCollection(updatedEvent, section);
    const remaining = items.filter((item) => item?.id !== itemId);
    const found = remaining.length !== items.length;

    setCollection(updatedEvent, section, remaining);

    if (section === "seating") {
        const activeStillExists = remaining.some((layout) => layout.id === updatedEvent.seating.activeLayoutId);

        if (!activeStillExists) {
            updatedEvent.seating.activeLayoutId = remaining[0]?.id || null;
        }
    }

    return { updatedEvent, found };
}


export function replaceSection(event, section, payload) {
    const updatedEvent = structuredClone(event);

    updatedEvent[section] = payload;
    backfillIds(updatedEvent, section);

    return { updatedEvent };
}
