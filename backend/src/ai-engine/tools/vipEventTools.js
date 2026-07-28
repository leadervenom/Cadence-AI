import { appendItem, updateItem, deleteItem, replaceSection, findItem } from "./collectionHelpers.js";
import { persistSection } from "../../services/sectionPersistence.js";

// This is the per-event JSONB `vips` list (protocol/seating display order),
// distinct from the master `vip_profiles` directory — see vipDirectoryTools.js.
const SECTION = "vips";

const ITEM_SCHEMA = {
    type: "OBJECT",
    properties: {
        name: { type: "STRING" },
        title: { type: "STRING" },
        rank: { type: "INTEGER" },
        category: { type: "STRING", description: "e.g. royalty, vvip, vip, official, guest" },
        status: { type: "STRING" }
    },
    required: ["name"]
};

export const declarations = [
    {
        name: "append_event_vip",
        description: "Add ONE new VIP entry to this event's protocol/seating VIP list.",
        parameters: { type: "OBJECT", properties: { item: ITEM_SCHEMA }, required: ["item"] }
    },
    {
        name: "update_event_vip",
        description: "Change fields on ONE existing VIP entry in this event's VIP list. Only send fields that should change.",
        parameters: {
            type: "OBJECT",
            properties: {
                itemId: { type: "STRING", description: "The 'id' of the VIP entry to change, from the current event data." },
                fields: ITEM_SCHEMA
            },
            required: ["itemId", "fields"]
        }
    },
    {
        name: "delete_event_vip",
        description: "Remove ONE existing VIP entry from this event's VIP list by id.",
        parameters: { type: "OBJECT", properties: { itemId: { type: "STRING" } }, required: ["itemId"] }
    },
    {
        name: "replace_event_vip_list",
        description: "Replace the ENTIRE event VIP list at once.",
        parameters: {
            type: "OBJECT",
            properties: { items: { type: "ARRAY", items: ITEM_SCHEMA } },
            required: ["items"]
        }
    }
];

export const handlers = {

    async append_event_vip(args, context) {
        const { updatedEvent, item } = appendItem(context.event, SECTION, args.item || {});
        const persistence = await persistSection(context, SECTION, updatedEvent);

        return { ok: true, updatedEvent, persisted: persistence.persisted, reply: `Added ${item.name} to the VIP list.` };
    },

    async update_event_vip(args, context) {
        const existing = findItem(context.event, SECTION, args.itemId);

        if (!existing) {
            return { ok: false, reply: `I couldn't find a VIP entry with id '${args.itemId}'.` };
        }

        const { updatedEvent, item } = updateItem(context.event, SECTION, args.itemId, args.fields || {});
        const persistence = await persistSection(context, SECTION, updatedEvent);

        return { ok: true, updatedEvent, persisted: persistence.persisted, reply: `Updated ${item.name}.` };
    },

    async delete_event_vip(args, context) {
        const existing = findItem(context.event, SECTION, args.itemId);

        if (!existing) {
            return { ok: false, reply: `I couldn't find a VIP entry with id '${args.itemId}'.` };
        }

        const { updatedEvent } = deleteItem(context.event, SECTION, args.itemId);
        const persistence = await persistSection(context, SECTION, updatedEvent);

        return { ok: true, updatedEvent, persisted: persistence.persisted, reply: `Removed ${existing.name} from the VIP list.` };
    },

    async replace_event_vip_list(args, context) {
        if (!Array.isArray(args.items)) {
            return { ok: false, reply: "I need an array of VIP entries to replace the list." };
        }

        const { updatedEvent } = replaceSection(context.event, SECTION, args.items);
        const persistence = await persistSection(context, SECTION, updatedEvent);

        return { ok: true, updatedEvent, persisted: persistence.persisted, reply: `Replaced the VIP list with ${args.items.length} entries.` };
    }

};
