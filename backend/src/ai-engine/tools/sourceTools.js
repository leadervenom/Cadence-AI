import { appendItem, updateItem, deleteItem, findItem, replaceSection } from "./collectionHelpers.js";
import { persistSection } from "./sectionPersistence.js";

const SECTION = "sources";

const SOURCE_SCHEMA = {
    type: "OBJECT",
    properties: {
        name: { type: "STRING" },
        status: { type: "STRING" },
        content: { type: "STRING", description: "Reference text content, if any. Uploaded files are normally added via the UI, not by you." }
    },
    required: ["name"]
};

export const declarations = [
    {
        name: "append_source",
        description: "Add ONE new reference source entry to the event (a note or reference, not a file upload).",
        parameters: { type: "OBJECT", properties: { item: SOURCE_SCHEMA }, required: ["item"] }
    },
    {
        name: "replace_sources",
        description: "Replace the ENTIRE sources list at once.",
        parameters: {
            type: "OBJECT",
            properties: { items: { type: "ARRAY", items: SOURCE_SCHEMA } },
            required: ["items"]
        }
    },
    {
        name: "update_source_metadata",
        description: "Change metadata (e.g. name, status) on an existing uploaded source document. Does not change its parsed content.",
        parameters: {
            type: "OBJECT",
            properties: {
                itemId: { type: "STRING", description: "The 'id' of the source to change." },
                fields: {
                    type: "OBJECT",
                    properties: {
                        name: { type: "STRING" },
                        status: { type: "STRING" }
                    }
                }
            },
            required: ["itemId", "fields"]
        }
    },
    {
        name: "delete_source",
        description: "Remove an uploaded source document from the event by id.",
        parameters: { type: "OBJECT", properties: { itemId: { type: "STRING" } }, required: ["itemId"] }
    }
];

export const handlers = {

    async append_source(args, context) {
        const { updatedEvent, item } = appendItem(context.event, SECTION, args.item || {});
        const persistence = await persistSection(context, SECTION, updatedEvent);

        return { ok: true, updatedEvent, persisted: persistence.persisted, reply: `Added source "${item.name}".` };
    },

    async replace_sources(args, context) {
        if (!Array.isArray(args.items)) {
            return { ok: false, reply: "I need an array of sources to replace the list." };
        }

        const { updatedEvent } = replaceSection(context.event, SECTION, args.items);
        const persistence = await persistSection(context, SECTION, updatedEvent);

        return { ok: true, updatedEvent, persisted: persistence.persisted, reply: `Replaced the sources list with ${args.items.length} entries.` };
    },

    async update_source_metadata(args, context) {
        const existing = findItem(context.event, SECTION, args.itemId);

        if (!existing) {
            return { ok: false, reply: `I couldn't find a source with id '${args.itemId}'.` };
        }

        const { updatedEvent, item } = updateItem(context.event, SECTION, args.itemId, args.fields || {});
        const persistence = await persistSection(context, SECTION, updatedEvent);

        return { ok: true, updatedEvent, persisted: persistence.persisted, reply: `Updated source "${item.name}".` };
    },

    async delete_source(args, context) {
        const existing = findItem(context.event, SECTION, args.itemId);

        if (!existing) {
            return { ok: false, reply: `I couldn't find a source with id '${args.itemId}'.` };
        }

        const { updatedEvent } = deleteItem(context.event, SECTION, args.itemId);
        const persistence = await persistSection(context, SECTION, updatedEvent);

        return { ok: true, updatedEvent, persisted: persistence.persisted, reply: `Removed source "${existing.name}".` };
    }

};
