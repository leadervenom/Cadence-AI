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


    async createExtractionSnapshot({
        eventId,
        extractionType,
        extractedData,
        confidenceScore = null,
        validationStatus = "published"
    }) {

        const query = `
            INSERT INTO event_extractions (
                event_id,
                extraction_type,
                extracted_data,
                confidence_score,
                validation_status
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;

        const result = await pool.query(

            query,

            [
                eventId,
                extractionType,
                extractedData,
                confidenceScore,
                validationStatus
            ]

        );

        return result.rows[0];

    }

}

export default EventExtractionRepository;
