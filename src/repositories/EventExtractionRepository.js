import pool from "../database/db.js";

class EventExtractionRepository {

    async getExtractionsByEvent(eventId) {

        const query = `
            SELECT
                *
            FROM event_extractions
            WHERE event_id = $1
            ORDER BY extraction_id;
        `;

        const result = await pool.query(

            query,

            [eventId]

        );

        return result.rows;

    }


    async getExtractionById(extractionId) {

        const query = `
            SELECT
                *
            FROM event_extractions
            WHERE extraction_id = $1;
        `;

        const result = await pool.query(

            query,

            [extractionId]

        );

        return result.rows[0];

    }

}

export default EventExtractionRepository;