import pool from "../database/db.js";

class AIChatHistoryRepository {

    async getChat(eventId) {

        const query = `
            SELECT list_name, role, content, created_at
            FROM chat_messages
            WHERE event_id = $1
            ORDER BY message_id;
        `;

        const result = await pool.query(

            query,

            [eventId]

        );

        const messages = result.rows
            .filter((row) => row.list_name === "messages")
            .map((row) => ({ role: row.role, html: row.content }));

        const chatHistory = result.rows
            .filter((row) => row.list_name === "chat_history")
            .map((row) => ({ role: row.role, content: row.content }));

        return {
            eventId: String(eventId),
            messages,
            chatHistory,
            updatedAt: result.rows.length
                ? result.rows[result.rows.length - 1].created_at
                : null
        };

    }


    async saveChat(eventId, data) {

        const messages = Array.isArray(data?.messages) ? data.messages : [];
        const chatHistory = Array.isArray(data?.chatHistory) ? data.chatHistory : [];

        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            await client.query(
                "DELETE FROM chat_messages WHERE event_id = $1",
                [eventId]
            );

            for (const message of messages) {
                await client.query(
                    `INSERT INTO chat_messages (event_id, list_name, role, content)
                     VALUES ($1, 'messages', $2, $3);`,
                    [eventId, message.role, String(message.html || "")]
                );
            }

            for (const message of chatHistory) {
                await client.query(
                    `INSERT INTO chat_messages (event_id, list_name, role, content)
                     VALUES ($1, 'chat_history', $2, $3);`,
                    [eventId, message.role, String(message.content || "")]
                );
            }

            await client.query("COMMIT");
        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }

        return this.getChat(eventId);

    }

}

export default AIChatHistoryRepository;
