import { appendItem, updateItem, deleteItem, findItem } from "./collectionHelpers.js";
import { persistSection } from "../../services/sectionPersistence.js";

const SECTION = "seating";

const SEAT_SCHEMA = {
    type: "OBJECT",
    properties: {
        vipId: { type: "STRING", description: "id of an entry in this event's VIP list (event.vips[].id) to seat here. Omit for a freeform seat." },
        name: { type: "STRING", description: "Freeform occupant name when not bound to a VIP list entry (e.g. press, staff). Ignored if vipId is set." },
        cat: { type: "STRING", description: "Category for a freeform seat's color: royalty, vvip, vip, official, or guest. Ignored if vipId is set." }
    }
};

const ELEMENT_SCHEMA = {
    type: "OBJECT",
    properties: {
        type: { type: "STRING", description: "'round' (banquet table, seats evenly spaced around the full circle) or 'panel' (head table for a podcast/panel session — seats in a line, all facing the same single direction toward the audience)." },
        label: { type: "STRING", description: "Table label, e.g. 'Table 1' or 'Main Stage'." },
        x: { type: "NUMBER", description: "Horizontal position, 0-100 as a percentage of the canvas width." },
        y: { type: "NUMBER", description: "Vertical position, 0-100 as a percentage of the canvas height." },
        rotation: { type: "NUMBER", description: "Degrees. For a 'panel' table this is the direction every seat faces." },
        seats: { type: "ARRAY", items: SEAT_SCHEMA }
    },
    required: ["type", "x", "y", "seats"]
};

const LAYOUT_SCHEMA = {
    type: "OBJECT",
    properties: {
        name: { type: "STRING" },
        elements: { type: "ARRAY", items: ELEMENT_SCHEMA, description: "The tables in this layout." }
    },
    required: ["name", "elements"]
};

export const declarations = [
    {
        name: "append_seating_layout",
        description: "Add ONE new seating layout to the event.",
        parameters: { type: "OBJECT", properties: { layout: LAYOUT_SCHEMA }, required: ["layout"] }
    },
    {
        name: "update_seating_layout",
        description: "Change fields on ONE existing seating layout (e.g. rename it or replace its elements/tables). Only send fields that should change.",
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
