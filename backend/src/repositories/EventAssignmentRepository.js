import pool from "../database/db.js";

const EVENT_SELECT = `
    e.event_id AS id,
    e.event_name AS name,
    e.event_type AS type,
    COALESCE(to_char(e.event_date, 'DD Mon YYYY'), 'TBD') AS date,
    e.venue_name AS venue,
    e.status,
    COALESCE(jsonb_array_length(e.event_data->'sources'), 0) AS docs,
    COALESCE(e.event_data->'running_order', '[]'::jsonb) AS running_order,
    COALESCE(e.event_data->'vips', '[]'::jsonb) AS vips,
    COALESCE(e.event_data->'sources', '[]'::jsonb) AS sources,
    COALESCE(e.event_data->'seating', '{"layouts":[],"activeLayoutId":null}'::jsonb) AS seating,
    e.event_data->>'ai_context' AS ai_context
`;

class EventAssignmentRepository {

    async getEventsForUser(userId) {

        const query = `
            SELECT ${EVENT_SELECT}
            FROM events e
            JOIN event_assignments ea ON ea.event_id = e.event_id
            WHERE ea.user_id = $1
            ORDER BY e.event_id;
        `;

        const result = await pool.query(query, [userId]);

        return result.rows;

    }


    async assign({ eventId, userId, assignedBy = null }) {

        const query = `
            INSERT INTO event_assignments (user_id, event_id, assigned_by)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, event_id) DO NOTHING
            RETURNING assignment_id;
        `;

        const result = await pool.query(query, [userId, eventId, assignedBy]);

        return result.rows[0];

    }


    async isAssigned(userId, eventId) {

        const query = `
            SELECT 1
            FROM event_assignments
            WHERE user_id = $1 AND event_id = $2;
        `;

        const result = await pool.query(query, [userId, eventId]);

        return result.rows.length > 0;

    }

}

export default EventAssignmentRepository;
