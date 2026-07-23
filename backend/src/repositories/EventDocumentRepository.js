import pool from "../database/db.js";

class EventDocumentRepository {

    async getDocumentsByEvent(eventId) {

        const query = `
            SELECT
                *
            FROM event_documents
            WHERE event_id = $1
            ORDER BY document_id;
        `;

        const result = await pool.query(

            query,

            [eventId]

        );

        return result.rows;

    }


    async getDocumentById(documentId) {

        const query = `
            SELECT
                *
            FROM event_documents
            WHERE document_id = $1;
        `;

        const result = await pool.query(

            query,

            [documentId]

        );

        return result.rows[0];

    }

}

export default EventDocumentRepository;