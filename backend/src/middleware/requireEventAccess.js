import EventAssignmentRepository from "../repositories/EventAssignmentRepository.js";

const eventAssignmentRepository = new EventAssignmentRepository();

export default async function requireEventAccess(req, res, next) {
    if (req.user?.role === "admin") {
        return next();
    }

    const eventId = req.params.eventId || req.params.id || req.body?.event?.id;

    if (!eventId) {
        return res.status(400).json({ error: "Missing event id" });
    }

    const assigned = await eventAssignmentRepository.isAssigned(req.user.id, eventId);

    if (!assigned) {
        return res.status(403).json({ error: "You are not assigned to this event" });
    }

    next();
}
