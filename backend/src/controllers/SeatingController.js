import EventRepository from "../repositories/EventRepository.js";
import EventExtractionRepository from "../repositories/EventExtractionRepository.js";
import { persistSection } from "../services/sectionPersistence.js";

class SeatingController {

    constructor() {
        this.eventRepository = new EventRepository();
        this.eventExtractionRepository = new EventExtractionRepository();
    }

    updateSeating = async (req, res) => {
        const eventId = req.params.eventId;
        const { layouts, activeLayoutId } = req.body || {};

        if (!Array.isArray(layouts)) {
            return res.status(400).json({ error: "layouts must be an array" });
        }

        const existing = await this.eventRepository.getEventById(eventId);

        if (!existing) {
            return res.status(404).json({ error: "Event not found" });
        }

        const updatedEvent = { id: eventId, seating: { layouts, activeLayoutId: activeLayoutId ?? null } };
        const context = {
            repositories: {
                eventRepository: this.eventRepository,
                eventExtractionRepository: this.eventExtractionRepository
            }
        };

        await persistSection(context, "seating", updatedEvent);

        res.json(updatedEvent.seating);
    };

}

export default SeatingController;
