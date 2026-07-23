import crypto from "node:crypto";
import EventParticipantRepository from "../repositories/EventParticipantRepository.js";
import VIPProfileRepository from "../repositories/VIPProfileRepository.js";

function baseUrl() {
    return process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
}

function confirmationPage(message) {
    return `<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Cadence AI — RSVP</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #0b0f1a; color: #e5e7eb; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #131826; border: 1px solid #262d40; border-radius: 12px; padding: 32px 40px; text-align: center; max-width: 420px; }
        h1 { font-size: 18px; margin: 0 0 8px; }
        p { color: #9ca3af; font-size: 14px; margin: 0; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Cadence AI</h1>
        <p>${message}</p>
    </div>
</body>
</html>`;
}

class RsvpController {

    constructor() {
        this.participantRepository = new EventParticipantRepository();
        this.vipRepository = new VIPProfileRepository();
    }


    getParticipants = async (req, res) => {
        try {
            const participants = await this.participantRepository
                .getParticipantsByEvent(req.params.eventId);

            res.json(participants);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to fetch participants" });
        }
    };


    invite = async (req, res) => {
        try {
            const eventId = req.params.eventId;
            const { vipId, role, email } = req.body || {};

            if (!vipId) {
                return res.status(400).json({ error: "vipId is required" });
            }

            if (email) {
                await this.vipRepository.updateEmail(vipId, email);
            }

            const vip = await this.vipRepository.getVIPById(vipId);

            if (!vip) {
                return res.status(404).json({ error: "VIP not found" });
            }

            if (!vip.email) {
                return res.status(400).json({ error: "This person has no email on file. Provide one to invite them." });
            }

            const token = crypto.randomBytes(24).toString("hex");

            const participant = await this.participantRepository.invite({
                eventId,
                vipId,
                role,
                token
            });

            res.status(201).json({
                participant,
                acceptUrl: `${baseUrl()}/api/rsvp/${token}/accept`,
                declineUrl: `${baseUrl()}/api/rsvp/${token}/decline`
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to invite participant" });
        }
    };


    respond = async (req, res) => {
        try {
            const { token, decision } = req.params;

            if (!["accept", "decline"].includes(decision)) {
                return res.status(400).send(confirmationPage("Invalid RSVP link."));
            }

            const invite = await this.participantRepository.getByToken(token);

            if (!invite) {
                return res.status(404).send(confirmationPage("This RSVP link is invalid or has expired."));
            }

            if (invite.attendance_status !== "invited") {
                return res.send(confirmationPage(
                    `You already responded to this invitation (${invite.attendance_status}) for ${invite.event_name}.`
                ));
            }

            const status = decision === "accept" ? "confirmed" : "declined";

            await this.participantRepository.respondByToken(token, status);

            const message = decision === "accept"
                ? `Thank you, ${invite.full_name}. Your attendance for ${invite.event_name} has been confirmed.`
                : `Thank you, ${invite.full_name}. We've recorded that you can't attend ${invite.event_name}.`;

            res.send(confirmationPage(message));
        }
        catch (error) {
            console.error(error);
            res.status(500).send(confirmationPage("Something went wrong recording your RSVP."));
        }
    };

}

export default RsvpController;
