import { randomUUID } from "node:crypto";

const EVENT_SECTIONS = new Set([
    "running_order",
    "vips",
    "seating",
    "sources"
]);

const ARRAY_SECTIONS = new Set([
    "running_order",
    "vips",
    "sources"
]);

const OBJECT_SECTIONS = new Set([
    "seating"
]);

// Sections whose editable items don't live at the section root, but nested
// one level in (e.g. seating.layouts). Lets append/update/delete share one
// code path for both plain array sections and this kind of section.
const NESTED_COLLECTIONS = {
    seating: "layouts"
};

const ITEM_SECTIONS = new Set([
    ...ARRAY_SECTIONS,
    ...Object.keys(NESTED_COLLECTIONS)
]);

const OPERATIONS = new Set([
    "none",
    "replace",
    "merge",
    "append",
    "update",
    "delete"
]);

export const STRUCTURED_COMMAND_SYSTEM_PROMPT = `
You are Cadence AI inside an event management system.

Always return exactly one JSON object and no markdown.

Schema:
{
  "reply": "Short user-facing answer.",
  "command": {
    "version": "1.0",
    "action": "none | update_event_section",
    "target": {
      "eventId": "Current event id.",
      "section": "running_order | vips | seating | sources",
      "itemId": "Required for operation 'update' or 'delete'. The 'id' field of the item being changed, taken from the current event data you were given."
    },
    "operation": "none | replace | merge | append | update | delete",
    "payload": "New data for the selected section.",
    "reason": "Why this change is needed."
  }
}

Rules:
- Use action "none" and operation "none" when the user only asks a question.
- Use action "update_event_section" only when the user asks you to change event data.
- Only update one section per command.
- Every item in running_order, vips, sources, and seating.layouts has a stable "id". Never invent or change an "id" yourself — the system assigns ids for new items automatically.
- Use "append" to add ONE new item to running_order, vips, sources, or seating (a new layout). Payload is a single item object (no "id" field). For running_order items use shape {"time","dur","activity","loc","role","status"} — status is one of pending|next|on-air|passed. For seating, payload is a single layout {"name","rows"}.
- Use "update" to change fields on ONE existing item: set target.itemId to that item's id, and payload to only the fields that should change (partial object). Do not resend the whole item or the whole array.
- Use "delete" to remove ONE existing item: set target.itemId to that item's id. No payload needed.
- Use "replace" only when the user wants to replace the ENTIRE section's contents at once (e.g. generating a brand new running order from scratch). For running_order, vips, and sources, "replace" payload must be an array. For seating, "replace" payload must be an object shaped like {"layouts": [{"name","rows"}], "activeLayoutId"}.
- "merge" is seating-only and shallow-merges top-level keys (e.g. to set "activeLayoutId"). Prefer "append"/"update"/"delete" for layout-level changes; only use "merge" with a full "layouts" array if you must rebuild it by hand.
- When asked to build a running order from uploaded source documents: read the source content already provided to you in context, extract the event's activities in chronological order, and emit operation "replace" on section "running_order" with a properly shaped array (infer "dur" from time ranges when possible, default "status" to "pending" for all-new items).
- Do not invent unrelated fields. Preserve existing field names from the current event data.
- The "reply" field is only for normal human chat text. Never put JSON, code blocks, or command details inside "reply".
`.trim();

class StructuredCommandService {

    buildSystemPrompt(systemPrompt = "") {
        return [
            STRUCTURED_COMMAND_SYSTEM_PROMPT,
            String(systemPrompt || "").trim()
        ]
            .filter(Boolean)
            .join("\n\n");
    }


    parseGeminiResponse(text) {
        const raw = String(text || "").trim();

        if(!raw) {
            throw new Error("Gemini returned an empty response.");
        }

        const withoutFence = raw
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        try {
            return JSON.parse(withoutFence);
        }
        catch(error) {
            const start = withoutFence.indexOf("{");
            const end = withoutFence.lastIndexOf("}");

            if(start >= 0 && end > start) {
                return JSON.parse(withoutFence.slice(start, end + 1));
            }

            throw error;
        }
    }


    normalize(parsed) {
        const command = parsed?.command || {};
        const action = command.action || "none";
        const operation = command.operation || "none";

        return {
            reply: String(parsed?.reply || "").trim(),
            command: {
                version: String(command.version || "1.0"),
                action,
                target: {
                    eventId: command.target?.eventId,
                    section: command.target?.section,
                    itemId: command.target?.itemId
                },
                operation,
                payload: command.payload,
                reason: String(command.reason || "").trim()
            }
        };
    }


    validate(normalized, event) {
        const errors = [];
        const { command } = normalized;

        if(!["none", "update_event_section"].includes(command.action)) {
            errors.push("Unsupported command action.");
        }

        if(!OPERATIONS.has(command.operation)) {
            errors.push("Unsupported command operation.");
        }

        if(command.action === "none") {
            if(command.operation !== "none") {
                errors.push("No-op commands must use operation 'none'.");
            }

            return {
                valid: errors.length === 0,
                errors
            };
        }

        if(!event || typeof event !== "object") {
            errors.push("An event snapshot is required for update commands.");
        }

        if(command.target?.eventId !== undefined && event?.id !== undefined) {
            if(String(command.target.eventId) !== String(event.id)) {
                errors.push("Command eventId does not match the current event.");
            }
        }

        if(!EVENT_SECTIONS.has(command.target?.section)) {
            errors.push("Unsupported event section.");
        }

        if(command.operation === "none") {
            errors.push("Update commands must use replace, merge, append, update, or delete.");
        }

        this.validatePayloadShape(command, errors, event);

        return {
            valid: errors.length === 0,
            errors
        };
    }


    validatePayloadShape(command, errors, event) {
        const section = command.target?.section;
        const payload = command.payload;
        const isItemSection = ITEM_SECTIONS.has(section);

        if(command.operation === "update" || command.operation === "delete") {
            if(!isItemSection) {
                errors.push(`Section '${section}' does not support ${command.operation}.`);
                return;
            }

            const itemId = command.target?.itemId;

            if(!itemId || typeof itemId !== "string") {
                errors.push(`Operation '${command.operation}' requires target.itemId.`);
                return;
            }

            if(event) {
                const items = this.getCollection(event, section);
                const exists = items.some((item) => item?.id === itemId);

                if(!exists) {
                    errors.push(`No item with id '${itemId}' found in section '${section}'.`);
                }
            }

            if(command.operation === "update") {
                const isObject =
                    payload !== null &&
                    typeof payload === "object" &&
                    !Array.isArray(payload);

                if(!isObject) {
                    errors.push("Operation 'update' payload must be an object of changed fields.");
                }
            }

            return;
        }

        if(command.operation === "append") {
            if(!isItemSection) {
                errors.push(`Section '${section}' does not support append.`);
                return;
            }

            const validAppend =
                Array.isArray(payload) ||
                (payload !== null && typeof payload === "object");

            if(!validAppend) {
                errors.push(`Section '${section}' append payload must be an object or array.`);
            }

            return;
        }

        if(ARRAY_SECTIONS.has(section)) {
            if(command.operation === "replace" && !Array.isArray(payload)) {
                errors.push(`Section '${section}' replace payload must be an array.`);
            }

            if(command.operation === "merge") {
                errors.push(`Section '${section}' does not support merge.`);
            }
        }

        if(OBJECT_SECTIONS.has(section)) {
            const isObject =
                payload !== null &&
                typeof payload === "object" &&
                !Array.isArray(payload);

            if(!isObject) {
                errors.push(`Section '${section}' payload must be an object.`);
            }
        }
    }


    // --- collection helpers: abstract over plain array sections
    // (running_order, vips, sources) vs. nested-collection sections
    // (seating, whose editable items live at seating.layouts) so
    // append/update/delete only need to be written once. ---

    getCollection(event, section) {
        if(ARRAY_SECTIONS.has(section)) {
            return Array.isArray(event?.[section]) ? event[section] : [];
        }

        const key = NESTED_COLLECTIONS[section];
        const collection = event?.[section]?.[key];

        return Array.isArray(collection) ? collection : [];
    }


    setCollection(event, section, items) {
        if(ARRAY_SECTIONS.has(section)) {
            event[section] = items;
            return;
        }

        const key = NESTED_COLLECTIONS[section];

        event[section] = {
            ...(event[section] || {}),
            [key]: items
        };
    }


    backfillIds(event, section) {
        if(!ITEM_SECTIONS.has(section)) {
            return;
        }

        const items = this.getCollection(event, section).map((item) => ({
            ...item,
            id: item?.id || randomUUID()
        }));

        this.setCollection(event, section, items);
    }


    apply(normalized, event) {
        const validation = this.validate(normalized, event);

        if(!validation.valid) {
            return {
                applied: false,
                validation,
                event
            };
        }

        if(normalized.command.action === "none") {
            return {
                applied: false,
                validation,
                event
            };
        }

        const updatedEvent = structuredClone(event);
        const { section, itemId } = normalized.command.target;
        const { operation, payload } = normalized.command;

        if(operation === "replace") {
            updatedEvent[section] = payload;
            this.backfillIds(updatedEvent, section);
        }

        if(operation === "merge") {
            updatedEvent[section] = {
                ...(updatedEvent[section] || {}),
                ...payload
            };
            this.backfillIds(updatedEvent, section);
        }

        if(operation === "append") {
            const items = this.getCollection(updatedEvent, section);
            const incoming = Array.isArray(payload) ? payload : [payload];
            const newItems = incoming.map((item) => ({
                ...item,
                id: randomUUID()
            }));

            this.setCollection(updatedEvent, section, items.concat(newItems));

            if(section === "seating" && !updatedEvent.seating.activeLayoutId && newItems[0]) {
                updatedEvent.seating.activeLayoutId = newItems[0].id;
            }
        }

        if(operation === "update") {
            const items = this.getCollection(updatedEvent, section);
            const index = items.findIndex((item) => item?.id === itemId);

            if(index !== -1) {
                items[index] = {
                    ...items[index],
                    ...payload,
                    id: items[index].id
                };
                this.setCollection(updatedEvent, section, items);
            }
        }

        if(operation === "delete") {
            const items = this.getCollection(updatedEvent, section);
            const remaining = items.filter((item) => item?.id !== itemId);

            this.setCollection(updatedEvent, section, remaining);

            if(section === "seating") {
                const activeStillExists = remaining.some(
                    (layout) => layout.id === updatedEvent.seating.activeLayoutId
                );

                if(!activeStillExists) {
                    updatedEvent.seating.activeLayoutId = remaining[0]?.id || null;
                }
            }
        }

        return {
            applied: true,
            validation,
            event: updatedEvent
        };
    }


    toVisibleReply(normalized, result) {
        const reply = String(normalized?.reply || "").trim();

        if(result?.applied) {
            return reply || "Done. I updated the event.";
        }

        if(result?.validation?.valid === false) {
            return "I could not apply that update. Please make the requested change more specific.";
        }

        if(this.looksLikeJson(reply)) {
            return "I processed that request.";
        }

        return reply || "I processed that request.";
    }


    looksLikeJson(value) {
        const text = String(value || "").trim();

        return (
            text.startsWith("{") ||
            text.startsWith("[") ||
            text.includes('"command"') ||
            text.includes('"payload"')
        );
    }

}

export default StructuredCommandService;
