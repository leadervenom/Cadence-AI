import EventRepository from "../repositories/EventRepository.js";

class EventController {

    constructor() {
        this.eventRepository = new EventRepository();
    }

    getAllEvents = async (req, res) => {
        try {
            const events = await this.eventRepository.getAllEvents();
            res.json(events);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to fetch events" });
        }
    };


    getEventById = async (req, res) => {
        try {
            const event = await this.eventRepository.getEventById(req.params.id);

            if (!event) {
                return res.status(404).json({ error: "Event not found" });
            }

            res.json(event);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to fetch event" });
        }
    };


    createEvent = async (req, res) => {
        try {
            const { name, type, date, venue, status } = req.body || {};

            if (!name || !String(name).trim()) {
                return res.status(400).json({ error: "Event name is required" });
            }

            const created = await this.eventRepository.createEvent({
                name: String(name).trim(),
                type: type || null,
                date: date || null,
                venue: venue || null,
                status: status || "draft"
            });

            const event = await this.eventRepository.updateEventData(created.id, {
                running_order: [],
                vips: [],
                sources: [],
                seating: { layouts: [], activeLayoutId: null },
                ai_context: `You are an AI assistant for ${created.name}. Help with event planning and operations.`
            });

            res.status(201).json(event);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to create event" });
        }
    };

}

export default EventController;
