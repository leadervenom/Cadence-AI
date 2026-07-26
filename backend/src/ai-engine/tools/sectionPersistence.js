// event_extractions is an append-only audit trail of *interpreted* section
// snapshots (see CLAUDE.md), not a mirror of every JSONB write — raw
// "sources" uploads intentionally have no entry here since they're input
// documents, not extracted/interpreted data.
const EXTRACTION_TYPE_BY_SECTION = {
    running_order: "running_order",
    vips: "vip_list",
    seating: "seating_layout"
};

export async function persistSection(context, section, updatedEvent) {
    const { eventRepository, eventExtractionRepository } = context.repositories;
    const eventId = updatedEvent?.id;

    if (!eventId) {
        return { persisted: false, reason: "Missing event id." };
    }

    await eventRepository.updateEventData(eventId, { [section]: updatedEvent[section] });

    const extractionType = EXTRACTION_TYPE_BY_SECTION[section];

    if (!extractionType) {
        return { persisted: true, snapshotted: false };
    }

    await eventExtractionRepository.createExtractionSnapshot({
        eventId,
        extractionType,
        extractedData: updatedEvent[section],
        validationStatus: "published"
    });

    return { persisted: true, snapshotted: true };
}
