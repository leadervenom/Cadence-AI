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

}

export default VIPRankingRepository;