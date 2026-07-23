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

const OPERATIONS = new Set([
    "none",
    "replace",
    "merge",
    "append"
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
      "section": "running_order | vips | seating | sources"
    },
    "operation": "none | replace | merge | append",
    "payload": "New data for the selected section.",
    "reason": "Why this change is needed."
  }
}

Rules:
- Use action "none" and operation "none" when the user only asks a question.
- Use action "update_event_section" only when the user asks you to change event data.
- Only update one section per command.
- For running_order, vips, and sources, "replace" payload must be an array and "append" payload may be an object or array.
- For seating, "replace" and "merge" payload must be an object.
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
                    section: command.target?.section
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
            errors.push("Update commands must use replace, merge, or append.");
        }

        this.validatePayloadShape(command, errors);

        return {
            valid: errors.length === 0,
            errors
        };
    }


    validatePayloadShape(command, errors) {
        const section = command.target?.section;
        const payload = command.payload;

        if(ARRAY_SECTIONS.has(section)) {
            if(command.operation === "replace" && !Array.isArray(payload)) {
                errors.push(`Section '${section}' replace payload must be an array.`);
            }

            if(command.operation === "merge") {
                errors.push(`Section '${section}' does not support merge.`);
            }

            if(command.operation === "append") {
                const validAppend =
                    Array.isArray(payload) ||
                    (payload !== null && typeof payload === "object");

                if(!validAppend) {
                    errors.push(`Section '${section}' append payload must be an object or array.`);
                }
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

            if(command.operation === "append") {
                errors.push(`Section '${section}' does not support append.`);
            }
        }
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
        const { section } = normalized.command.target;
        const { operation, payload } = normalized.command;

        if(operation === "replace") {
            updatedEvent[section] = payload;
        }

        if(operation === "merge") {
            updatedEvent[section] = {
                ...(updatedEvent[section] || {}),
                ...payload
            };
        }

        if(operation === "append") {
            const current = Array.isArray(updatedEvent[section]) ?
                updatedEvent[section] :
                [];
            updatedEvent[section] = current.concat(payload);
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
