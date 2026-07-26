export const declarations = [
    {
        name: "update_event_metadata",
        description: "Change this event's core details: name, type, date, venue, status, or start/end time. Only send fields that should change.",
        parameters: {
            type: "OBJECT",
            properties: {
                name: { type: "STRING" },
                type: { type: "STRING" },
                date: { type: "STRING", description: "ISO date, e.g. '2026-08-15'." },
                venue: { type: "STRING" },
                venueAddress: { type: "STRING" },
                district: { type: "STRING" },
                status: { type: "STRING", enum: ["draft", "extracting", "under_review", "published", "completed", "archived"] },
                startTime: { type: "STRING", description: "24h time, e.g. '09:00'." },
                endTime: { type: "STRING", description: "24h time, e.g. '17:00'." }
            }
        }
    }
];

export const handlers = {

    async update_event_metadata(args, context) {
        const { eventRepository } = context.repositories;
        const eventId = context.event?.id;

        if (!eventId) {
            return { ok: false, reply: "I don't have an event to update." };
        }

        const fields = { ...args };
        delete fields.eventId;

        if (Object.keys(fields).length === 0) {
            return { ok: false, reply: "I need at least one field to change." };
        }

        const updatedEvent = await eventRepository.updateEvent(eventId, fields);

        if (!updatedEvent) {
            return { ok: false, reply: "That event could not be found." };
        }

        const changed = Object.keys(fields).join(", ");

        return {
            ok: true,
            updatedEvent,
            persisted: true,
            reply: `Updated event ${changed}.`
        };
    }

};
