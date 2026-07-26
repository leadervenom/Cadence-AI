import { appendItem, updateItem, deleteItem, replaceSection, findItem } from "./collectionHelpers.js";
import { persistSection } from "./sectionPersistence.js";

const SECTION = "running_order";

const ITEM_SCHEMA = {
    type: "OBJECT",
    properties: {
        time: { type: "STRING", description: "Start time, e.g. '09:00'." },
        dur: { type: "STRING", description: "Duration, e.g. '30 min'." },
        activity: { type: "STRING", description: "What happens in this slot." },
        loc: { type: "STRING", description: "Location for this activity." },
        role: { type: "STRING", description: "Who is responsible / involved." },
        status: { type: "STRING", enum: ["pending", "next", "on-air", "passed"] }
    },
    required: ["time", "activity"]
};

export const declarations = [
    {
        name: "append_running_order_item",
        description: "Add ONE new item to the event's running order.",
        parameters: { type: "OBJECT", properties: { item: ITEM_SCHEMA }, required: ["item"] }
    },
    {
        name: "update_running_order_item",
        description: "Change fields on ONE existing running order item. Only send the fields that should change.",
        parameters: {
            type: "OBJECT",
            properties: {
                itemId: { type: "STRING", description: "The 'id' of the item to change, from the current event data." },
                fields: ITEM_SCHEMA
            },
            required: ["itemId", "fields"]
        }
    },
    {
        name: "delete_running_order_item",
        description: "Remove ONE existing running order item by id.",
        parameters: {
            type: "OBJECT",
            properties: { itemId: { type: "STRING" } },
            required: ["itemId"]
        }
    },
    {
        name: "replace_running_order",
        description: "Replace the ENTIRE running order at once, e.g. when generating a brand new schedule from uploaded documents.",
        parameters: {
            type: "OBJECT",
            properties: { items: { type: "ARRAY", items: ITEM_SCHEMA } },
            required: ["items"]
        }
    }
];

export const handlers = {

    async append_running_order_item(args, context) {
        const { updatedEvent, item } = appendItem(context.event, SECTION, args.item || {});
        const persistence = await persistSection(context, SECTION, updatedEvent);

        return {
            ok: true,
            updatedEvent,
            persisted: persistence.persisted,
            reply: `Added "${item.activity}" at ${item.time} to the running order.`
        };
    },

    async update_running_order_item(args, context) {
        const existing = findItem(context.event, SECTION, args.itemId);

        if (!existing) {
            return { ok: false, reply: `I couldn't find a running order item with id '${args.itemId}'.` };
        }

        const { updatedEvent, item } = updateItem(context.event, SECTION, args.itemId, args.fields || {});
        const persistence = await persistSection(context, SECTION, updatedEvent);

        return {
            ok: true,
            updatedEvent,
            persisted: persistence.persisted,
            reply: `Updated "${item.activity}".`
        };
    },

    async delete_running_order_item(args, context) {
        const existing = findItem(context.event, SECTION, args.itemId);

        if (!existing) {
            return { ok: false, reply: `I couldn't find a running order item with id '${args.itemId}'.` };
        }

        const { updatedEvent } = deleteItem(context.event, SECTION, args.itemId);
        const persistence = await persistSection(context, SECTION, updatedEvent);

        return {
            ok: true,
            updatedEvent,
            persisted: persistence.persisted,
            reply: `Removed "${existing.activity}" from the running order.`
        };
    },

    async replace_running_order(args, context) {
        if (!Array.isArray(args.items)) {
            return { ok: false, reply: "I need an array of running order items to replace the schedule." };
        }

        const { updatedEvent } = replaceSection(context.event, SECTION, args.items);
        const persistence = await persistSection(context, SECTION, updatedEvent);

        return {
            ok: true,
            updatedEvent,
            persisted: persistence.persisted,
            reply: `Replaced the running order with ${args.items.length} item(s).`
        };
    }

};
