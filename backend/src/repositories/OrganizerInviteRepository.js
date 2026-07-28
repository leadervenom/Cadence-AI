import pool from "../database/db.js";

class OrganizerInviteRepository {

    async create({ eventId, email, invitedBy, token }) {

        const query = `
            INSERT INTO event_organizer_invites (event_id, email, token, invited_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;

        const result = await pool.query(query, [eventId, email, token, invitedBy || null]);

        return result.rows[0];

    }


    async getByToken(token) {

        const query = `
            SELECT
                i.invite_id,
                i.event_id,
                i.email,
                i.token,
                i.status,
                i.invited_by,
                e.event_name
            FROM event_organizer_invites i
            JOIN events e ON e.event_id = i.event_id
            WHERE i.token = $1;
        `;

        const result = await pool.query(query, [token]);

        return result.rows[0];

    }


    async markAccepted(inviteId) {

        const query = `
            UPDATE event_organizer_invites
            SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
            WHERE invite_id = $1
            RETURNING invite_id;
        `;

        const result = await pool.query(query, [inviteId]);

        return result.rows[0];

    }

}

export default OrganizerInviteRepository;
