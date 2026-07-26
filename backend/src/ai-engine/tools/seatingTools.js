import { appendItem, updateItem, deleteItem, findItem } from "./collectionHelpers.js";
import { persistSection } from "./sectionPersistence.js";

const SECTION = "seating";

const SEAT_SCHEMA = {
    type: "OBJECT",
    properties: {
        label: { type: "STRING" },
        cat: { type: "STRING", description: "Seat category, e.g. vip, guest, reserved." }
    },
    required: ["label"]
};

const LAYOUT_SCHEMA = {
    type: "OBJECT",
    properties: {
        name: { type: "STRING" },
        rows: { type: "ARRAY", items: { type: "ARRAY", items: SEAT_SCHEMA } }
    },
    required: ["name", "rows"]
};

export const declarations = [
    {
        name: "append_seating_layout",
        description: "Add ONE new seating layout to the event.",
        parameters: { type: "OBJECT", properties: { layout: LAYOUT_SCHEMA }, required: ["layout"] }
    },
    {
        name: "update_seating_layout",
        description: "Change fields on ONE existing seating layout (e.g. rename it or replace its rows). Only send fields that should change.",
        parameters: {
            type: "OBJECT",
            properties: {
                layoutId: { type: "STRING", description: "The 'id' of the layout to change." },
                fields: LAYOUT_SCHEMA
            },
            required: ["layoutId", "fields"]
        }
    },
    {
        name: "delete_seating_layout",
        description: "Remove ONE existing seating layout by id.",
        parameters: { type: "OBJECT", properties: { layoutId: { type: "STRING" } }, required: ["layoutId"] }
    },
    {
        name: "set_active_seating_layout",
        description: "Switch which seating layout is currently active/displayed for this event.",
        parameters: { type: "OBJECT", properties: { layoutId: { type: "STRING" } }, required: ["layoutId"] }
    }
];

export const handlers = {

    async append_seating_layout(args, context) {
        const { updatedEvent, item } = appendItem(context.event, SECTION, args.layout || {});
        const persistence = await persistSection(context, SECTION, updatedEvent);

        return { ok: true, updatedEvent, persisted: persistence.persisted, reply: `Added seating layout "${item.name}".` };
    },

    async update_seating_layout(args, context) {
        const existing = findItem(context.event, SECTION, args.layoutId);

        if (!existing) {
            return { ok: false, reply: `I couldn't find a seating layout with id '${args.layoutId}'.` };
        }

        const { updatedEvent, item } = updateItem(context.event, SECTION, args.layoutId, args.fields || {});
        const persistence = await persistSection(context, SECTION, updatedEvent);

        return { ok: true, updatedEvent, persisted: persistence.persisted, reply: `Updated seating layout "${item.name}".` };
    },

    async delete_seating_layout(args, context) {
        const existing = findItem(context.event, SECTION, args.layoutId);

        if (!existing) {
            return { ok: false, reply: `I couldn't find a seating layout with id '${args.layoutId}'.` };
        }

        const { updatedEvent } = deleteItem(context.event, SECTION, args.layoutId);
        const persistence = await persistSection(context, SECTION, updatedEvent);

        return { ok: true, updatedEvent, persisted: persistence.persisted, reply: `Removed seating layout "${existing.name}".` };
    },

    async set_active_seating_layout(args, context) {
        const existing = findItem(context.event, SECTION, args.layoutId);

        if (!existing) {
            return { ok: false, reply: `I couldn't find a seating layout with id '${args.layoutId}'.` };
        }

        const updatedEvent = structuredClone(context.event);

        updatedEvent.seating = { ...(updatedEvent.seating || {}), activeLayoutId: args.layoutId };

        const persistence = await persistSection(context, SECTION, updatedEvent);

        return { ok: true, updatedEvent, persisted: persistence.persisted, reply: `Switched to seating layout "${existing.name}".` };
    }

};
