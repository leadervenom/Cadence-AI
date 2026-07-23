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


    async searchVIPs(searchTerm) {

        const query = `
            SELECT
                vip_id,
                full_name,
                honorific_title,
                position_title,
                vip_category,
                email,
                is_active
            FROM vip_profiles
            WHERE is_active = TRUE
              AND (
                full_name ILIKE $1
                OR position_title ILIKE $1
                OR email ILIKE $1
              )
            ORDER BY full_name
            LIMIT 20;
        `;

        const result = await pool.query(

            query,

            [`%${searchTerm}%`]

        );

        return result.rows;

    }


    async updateEmail(vipId, email) {

        const query = `
            UPDATE vip_profiles
            SET email = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE vip_id = $1
            RETURNING vip_id, full_name, email;
        `;

        const result = await pool.query(

            query,

            [vipId, email]

        );

        return result.rows[0];

    }

}

export default VIPProfileRepository;