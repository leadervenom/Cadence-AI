import pool from "../database/db.js";

const EVENT_SELECT = `
    event_id AS id,
    event_name AS name,
    event_type AS type,
    COALESCE(to_char(event_date, 'DD Mon YYYY'), 'TBD') AS date,
    venue_name AS venue,
    status,
    COALESCE(jsonb_array_length(event_data->'sources'), 0) AS docs,
    COALESCE(event_data->'running_order', '[]'::jsonb) AS running_order,
    COALESCE(event_data->'vips', '[]'::jsonb) AS vips,
    COALESCE(event_data->'sources', '[]'::jsonb) AS sources,
    COALESCE(event_data->'seating', '{"rows":[]}'::jsonb) AS seating,
    event_data->>'ai_context' AS ai_context
`;

class EventRepository {

    async getAllEvents() {

        const query = `
            SELECT ${EVENT_SELECT}
            FROM events
            ORDER BY event_id;
        `;

        const result = await pool.query(query);

        return result.rows;

    }


    async getEventById(eventId) {

        const query = `
            SELECT ${EVENT_SELECT}
            FROM events
            WHERE event_id = $1;
        `;

        const result = await pool.query(

            query,

            [eventId]

        );

        return result.rows[0];

    }


    async createEvent({
        name,
        type = null,
        date = null,
        venue = null,
        status = "draft"
    }) {

        const query = `
            INSERT INTO events (event_name, event_type, event_date, venue_name, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING ${EVENT_SELECT};
        `;

        const result = await pool.query(

            query,

            [name, type, date, venue, status]

        );

        return result.rows[0];

    }


    async updateEventData(eventId, sectionUpdate) {

        const query = `
            UPDATE events
            SET event_data = event_data || $2::jsonb,
                updated_at = CURRENT_TIMESTAMP
            WHERE event_id = $1
            RETURNING ${EVENT_SELECT};
        `;

        const result = await pool.query(

            query,

            [eventId, JSON.stringify(sectionUpdate)]

        );

        return result.rows[0];

    }

}

export default EventRepository;
