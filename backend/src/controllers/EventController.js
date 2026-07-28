import EventRepository from "../repositories/EventRepository.js";
import EventAssignmentRepository from "../repositories/EventAssignmentRepository.js";

class EventController {

    constructor() {
        this.eventRepository = new EventRepository();
        this.eventAssignmentRepository = new EventAssignmentRepository();
    }

    getAllEvents = async (req, res) => {
        const events = req.user?.role === "admin"
            ? await this.eventRepository.getAllEvents()
            : await this.eventAssignmentRepository.getEventsForUser(req.user.id);

        res.json(events);
    };


    getEventById = async (req, res) => {
        const event = await this.eventRepository.getEventById(req.params.id);

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.json(event);
    };


    createEvent = async (req, res) => {
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
    };


    updateEvent = async (req, res) => {
        const existing = await this.eventRepository.getEventById(req.params.id);

        if (!existing) {
            return res.status(404).json({ error: "Event not found" });
        }

        const { name, type, date, venue, venueAddress, district, status, startTime, endTime } = req.body || {};
        const fields = {};

        if (name !== undefined) fields.name = String(name).trim();
        if (type !== undefined) fields.type = type;
        if (date !== undefined) fields.date = date;
        if (venue !== undefined) fields.venue = venue;
        if (venueAddress !== undefined) fields.venueAddress = venueAddress;
        if (district !== undefined) fields.district = district;
        if (status !== undefined) fields.status = status;
        if (startTime !== undefined) fields.startTime = startTime;
        if (endTime !== undefined) fields.endTime = endTime;

        if (fields.name === "") {
            return res.status(400).json({ error: "Event name cannot be empty" });
        }

        const event = await this.eventRepository.updateEvent(req.params.id, fields);

        res.json(event);
    };


    deleteEvent = async (req, res) => {
        const deleted = await this.eventRepository.deleteEvent(req.params.id);

        if (!deleted) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.status(204).end();
    };

}

export default EventController;
