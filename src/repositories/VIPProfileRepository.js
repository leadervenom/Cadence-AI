import pool from "../database/db.js";

class VIPProfileRepository {

    async getAllVIPs() {

        const query = `
            SELECT
                vip_id,
                full_name,
                honorific_title,
                position_title,
                vip_category,
                is_active
            FROM vip_profiles
            ORDER BY vip_id;
        `;

        const result = await pool.query(query);

        return result.rows;

    }


    async getVIPById(vipId) {

        const query = `
            SELECT
                *
            FROM vip_profiles
            WHERE vip_id = $1;
        `;

        const result = await pool.query(

            query,

            [vipId]

        );

        return result.rows[0];

    }

}

export default VIPProfileRepository;