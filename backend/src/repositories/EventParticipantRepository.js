import pool from "../database/db.js";

const PARTICIPANT_SELECT = `
    ev.event_vip_id,
    ev.event_id,
    ev.vip_id,
    ev.attendance_status,
    ev.event_role,
    ev.rsvp_token,
    ev.invited_at,
    ev.responded_at,
    vp.full_name,
    vp.honorific_title,
    vp.position_title,
    vp.vip_category,
    vp.email
`;

class EventParticipantRepository {

    async getParticipantsByEvent(eventId) {

        const query = `
            SELECT ${PARTICIPANT_SELECT}
            FROM event_vips ev
            JOIN vip_profiles vp ON vp.vip_id = ev.vip_id
            WHERE ev.event_id = $1
            ORDER BY ev.invited_at DESC NULLS LAST, vp.full_name;
        `;

        const result = await pool.query(query, [eventId]);

        return result.rows;

    }


    async invite({ eventId, vipId, role, token }) {

        const query = `
            INSERT INTO event_vips (event_id, vip_id, event_role, attendance_status, rsvp_token, invited_at)
            VALUES ($1, $2, $3, 'invited', $4, CURRENT_TIMESTAMP)
            ON CONFLICT (event_id, vip_id) DO UPDATE
            SET event_role = EXCLUDED.event_role,
                attendance_status = 'invited',
                rsvp_token = EXCLUDED.rsvp_token,
                invited_at = CURRENT_TIMESTAMP,
                responded_at = NULL,
                updated_at = CURRENT_TIMESTAMP
            RETURNING event_vip_id;
        `;

        const result = await pool.query(query, [eventId, vipId, role || null, token]);
        const eventVipId = result.rows[0].event_vip_id;

        const detail = await pool.query(
            `SELECT ${PARTICIPANT_SELECT}
             FROM event_vips ev
             JOIN vip_profiles vp ON vp.vip_id = ev.vip_id
             WHERE ev.event_vip_id = $1;`,
            [eventVipId]
        );

        return detail.rows[0];

    }


    async getByToken(token) {

        const query = `
            SELECT
                ev.event_vip_id,
                ev.event_id,
                ev.attendance_status,
                ev.rsvp_token,
                vp.full_name,
                e.event_name
            FROM event_vips ev
            JOIN vip_profiles vp ON vp.vip_id = ev.vip_id
            JOIN events e ON e.event_id = ev.event_id
            WHERE ev.rsvp_token = $1;
        `;

        const result = await pool.query(query, [token]);

        return result.rows[0];

    }


    async respondByToken(token, status) {

        const query = `
            UPDATE event_vips
            SET attendance_status = $2,
                responded_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE rsvp_token = $1
            RETURNING event_vip_id;
        `;

        const result = await pool.query(query, [token, status]);

        return result.rows[0];

    }


    async updateStatus(eventId, eventVipId, status) {

        const updated = await pool.query(
            `UPDATE event_vips
             SET attendance_status = $3, responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE event_vip_id = $1 AND event_id = $2
             RETURNING event_vip_id;`,
            [eventVipId, eventId, status]
        );

        if (!updated.rows[0]) {
            return null;
        }

        const result = await pool.query(
            `SELECT ${PARTICIPANT_SELECT} FROM event_vips ev
             JOIN vip_profiles vp ON vp.vip_id = ev.vip_id
             WHERE ev.event_vip_id = $1;`,
            [eventVipId]
        );

        return result.rows[0];

    }


    async updateDetails(eventId, eventVipId, fields) {

        const columnByField = {
            eventRole: "event_role",
            plusOneName: "plus_one_name",
            arrivalTime: "arrival_time",
            departureTime: "departure_time",
            specialNotes: "special_notes",
            eventRankOverride: "event_rank_override"
        };

        const sets = [];
        const values = [];

        for (const [field, column] of Object.entries(columnByField)) {
            if (Object.prototype.hasOwnProperty.call(fields, field)) {
                values.push(fields[field]);
                sets.push(`${column} = $${values.length}`);
            }
        }

        if (sets.length === 0) {
            const existing = await pool.query(
                `SELECT ${PARTICIPANT_SELECT} FROM event_vips ev
                 JOIN vip_profiles vp ON vp.vip_id = ev.vip_id
                 WHERE ev.event_vip_id = $1 AND ev.event_id = $2;`,
                [eventVipId, eventId]
            );

            return existing.rows[0] || null;
        }

        values.push(eventVipId, eventId);

        const updated = await pool.query(
            `UPDATE event_vips
             SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP
             WHERE event_vip_id = $${values.length - 1} AND event_id = $${values.length}
             RETURNING event_vip_id;`,
            values
        );

        if (!updated.rows[0]) {
            return null;
        }

        const result = await pool.query(
            `SELECT ${PARTICIPANT_SELECT} FROM event_vips ev
             JOIN vip_profiles vp ON vp.vip_id = ev.vip_id
             WHERE ev.event_vip_id = $1;`,
            [eventVipId]
        );

        return result.rows[0];

    }


    async uninvite(eventId, eventVipId) {

        const query = `
            DELETE FROM event_vips
            WHERE event_vip_id = $1 AND event_id = $2
            RETURNING event_vip_id;
        `;

        const result = await pool.query(query, [eventVipId, eventId]);

        return result.rows[0];

    }

}

export default EventParticipantRepository;
