// RSVP invites always require a human to click confirm before any email is
// sent — stage_rsvp_invite only resolves/validates and returns a proposal,
// it never touches event_vips or EmailService. The frontend renders the
// proposal with a confirm button that calls the existing
// POST /api/events/:eventId/invite endpoint (RsvpController.invite) itself.

function matchParticipants(participants, query) {
    const needle = String(query || "").trim().toLowerCase();

    return participants.filter((p) => p.full_name.toLowerCase().includes(needle));
}

export const declarations = [
    {
        name: "stage_rsvp_invite",
        description: "Propose inviting a VIP/guest to this event. Does NOT send anything — a human must confirm before the invite email goes out.",
        parameters: {
            type: "OBJECT",
            properties: {
                vipNameOrQuery: { type: "STRING", description: "Name (or partial name) of the person to invite." },
                role: { type: "STRING", description: "Their role at this event, e.g. 'Guest of Honour'." },
                email: { type: "STRING", description: "Only needed if this person has no email on file yet." }
            },
            required: ["vipNameOrQuery"]
        }
    },
    {
        name: "update_rsvp_status",
        description: "Manually override an already-invited guest's attendance status for this event (staff override, not the guest's own response).",
        parameters: {
            type: "OBJECT",
            properties: {
                vipNameOrQuery: { type: "STRING" },
                status: { type: "STRING", enum: ["invited", "confirmed", "declined", "absent", "arrived", "attended"] }
            },
            required: ["vipNameOrQuery", "status"]
        }
    },
    {
        name: "uninvite_guest",
        description: "Remove a guest's invitation/RSVP record from this event entirely.",
        parameters: {
            type: "OBJECT",
            properties: { vipNameOrQuery: { type: "STRING" } },
            required: ["vipNameOrQuery"]
        }
    }
];

export const handlers = {

    async stage_rsvp_invite(args, context) {
        const { vipRepository } = context.repositories;
        const matches = await vipRepository.searchVIPs(args.vipNameOrQuery || "");

        if (matches.length === 0) {
            return { ok: false, reply: `I couldn't find anyone named "${args.vipNameOrQuery}" in the VIP directory.` };
        }

        if (matches.length > 1) {
            const names = matches.slice(0, 5).map((m) => m.full_name).join(", ");
            return { ok: false, reply: `That matches more than one person: ${names}. Which one did you mean?` };
        }

        const vip = matches[0];
        const needsEmail = !vip.email && !args.email;

        if (needsEmail) {
            return {
                ok: true,
                reply: `${vip.full_name} has no email on file. Provide one so I can prepare the invite.`
            };
        }

        return {
            ok: true,
            proposedAction: {
                type: "rsvp_invite",
                eventId: context.event.id,
                vipId: vip.vip_id,
                vipName: vip.full_name,
                role: args.role || null,
                email: vip.email || args.email
            },
            reply: `I found ${vip.full_name}. Confirm to send the invite?`
        };
    },

    async update_rsvp_status(args, context) {
        const { participantRepository } = context.repositories;
        const participants = await participantRepository.getParticipantsByEvent(context.event.id);
        const matches = matchParticipants(participants, args.vipNameOrQuery);

        if (matches.length === 0) {
            return { ok: false, reply: `"${args.vipNameOrQuery}" isn't on this event's participant list.` };
        }

        if (matches.length > 1) {
            const names = matches.map((m) => m.full_name).join(", ");
            return { ok: false, reply: `That matches more than one participant: ${names}. Which one did you mean?` };
        }

        const updated = await participantRepository.updateStatus(context.event.id, matches[0].event_vip_id, args.status);

        return { ok: true, persisted: true, reply: `Set ${updated.full_name}'s status to ${args.status}.` };
    },

    async uninvite_guest(args, context) {
        const { participantRepository } = context.repositories;
        const participants = await participantRepository.getParticipantsByEvent(context.event.id);
        const matches = matchParticipants(participants, args.vipNameOrQuery);

        if (matches.length === 0) {
            return { ok: false, reply: `"${args.vipNameOrQuery}" isn't on this event's participant list.` };
        }

        if (matches.length > 1) {
            const names = matches.map((m) => m.full_name).join(", ");
            return { ok: false, reply: `That matches more than one participant: ${names}. Which one did you mean?` };
        }

        await participantRepository.uninvite(context.event.id, matches[0].event_vip_id);

        return { ok: true, persisted: true, reply: `Removed ${matches[0].full_name} from this event's participant list.` };
    }

};
