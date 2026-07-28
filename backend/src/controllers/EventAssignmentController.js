import crypto from "node:crypto";
import EventRepository from "../repositories/EventRepository.js";
import EventAssignmentRepository from "../repositories/EventAssignmentRepository.js";
import OrganizerInviteRepository from "../repositories/OrganizerInviteRepository.js";
import UserRepository from "../repositories/UserRepository.js";
import EmailService from "../services/EmailService.js";

function frontendBaseUrl() {
    return process.env.PUBLIC_FRONTEND_URL || "http://localhost:5173";
}

class EventAssignmentController {

    constructor() {
        this.eventRepository = new EventRepository();
        this.eventAssignmentRepository = new EventAssignmentRepository();
        this.organizerInviteRepository = new OrganizerInviteRepository();
        this.userRepository = new UserRepository();
        this.emailService = new EmailService();
    }


    inviteOrganizer = async (req, res) => {
        const eventId = req.params.eventId;
        const { email } = req.body || {};

        if (!email || !String(email).trim()) {
            return res.status(400).json({ error: "email is required" });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const event = await this.eventRepository.getEventById(eventId);

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        const existingUser = await this.userRepository.getUserByEmail(normalizedEmail);

        if (existingUser) {
            if (existingUser.role !== "event_organizer") {
                return res.status(400).json({
                    error: "Only Event Organizer accounts can be assigned to an event"
                });
            }

            await this.eventAssignmentRepository.assign({
                eventId,
                userId: existingUser.user_id,
                assignedBy: req.user.id
            });

            try {
                await this.emailService.sendOrganizerAssigned({ event, user: existingUser });
            }
            catch (emailError) {
                console.error(emailError);
            }

            return res.status(201).json({ status: "assigned", email: normalizedEmail });
        }

        const token = crypto.randomBytes(24).toString("hex");

        const invite = await this.organizerInviteRepository.create({
            eventId,
            email: normalizedEmail,
            invitedBy: req.user.id,
            token
        });

        const signupUrl = `${frontendBaseUrl()}/?invite=${token}`;

        try {
            await this.emailService.sendOrganizerInvite({ event, email: normalizedEmail, signupUrl });
        }
        catch (emailError) {
            console.error(emailError);
            return res.status(502).json({
                error: `Invite was recorded but the email could not be sent: ${emailError.message}`,
                invite
            });
        }

        res.status(201).json({ status: "invited", invite });
    };

}

export default EventAssignmentController;
