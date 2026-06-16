import pool from "../database/db.js";

class EventRepository {

    async getAllEvents() {

        const query = `
            SELECT
                *
            FROM events
            ORDER BY event_id;
        `;

        const result = await pool.query(query);

        return result.rows;

    }


    async getEventById(eventId) {

        const query = `
            SELECT
                *
            FROM events
            WHERE event_id = $1;
        `;

        const result = await pool.query(

            query,

            [eventId]

        );

        return result.rows[0];

    }

}

export default EventRepository;