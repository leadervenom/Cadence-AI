import pool from "../database/db.js";

class VIPRankingRepository {

    async getCurrentRankings() {

        const query = `
            SELECT
                *
            FROM current_vip_leaderboard
            ORDER BY rank_number;
        `;

        const result = await pool.query(query);

        return result.rows;

    }


    async getTopVIPs(limit = 10) {

        const query = `
            SELECT
                *
            FROM current_vip_leaderboard
            ORDER BY rank_number
            LIMIT $1;
        `;

        const result = await pool.query(

            query,

            [limit]

        );

        return result.rows;

    }


    async setRanking({
        vipId,
        rankNumber,
        rankingScope = "Johor State",
        sourceName = null,
        notes = null,
        createdBy = null
    }) {

        const client = await pool.connect();

        try {

            await client.query("BEGIN");

            // Retire whoever currently holds this rank number in this scope
            // (the unique_current_rank index only allows one is_current row
            // per rank_number+ranking_scope) and any current row this VIP
            // already holds in this scope, before inserting the new one.
            await client.query(
                `UPDATE vip_rankings
                 SET is_current = FALSE, effective_to = CURRENT_DATE
                 WHERE ranking_scope = $1
                   AND is_current = TRUE
                   AND (rank_number = $2 OR vip_id = $3);`,
                [rankingScope, rankNumber, vipId]
            );

            const result = await client.query(
                `INSERT INTO vip_rankings (
                    vip_id, rank_number, ranking_scope,
                    source_name, notes, created_by
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *;`,
                [vipId, rankNumber, rankingScope, sourceName, notes, createdBy]
            );

            await client.query("COMMIT");

            return result.rows[0];

        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }

    }


    async removeRanking(vipId, rankingScope = "Johor State") {

        const query = `
            UPDATE vip_rankings
            SET is_current = FALSE, effective_to = CURRENT_DATE
            WHERE vip_id = $1
              AND ranking_scope = $2
              AND is_current = TRUE
            RETURNING ranking_id;
        `;

        const result = await pool.query(

            query,

            [vipId, rankingScope]

        );

        return result.rows[0];

    }

}

export default VIPRankingRepository;