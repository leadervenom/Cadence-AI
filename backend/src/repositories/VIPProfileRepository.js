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


    async createVIP({
        fullName,
        honorificTitle = null,
        positionTitle = null,
        organizationId = null,
        district = null,
        vipCategory = "vip",
        phone = null,
        email = null,
        notes = null
    }) {

        const query = `
            INSERT INTO vip_profiles (
                full_name, honorific_title, position_title,
                organization_id, district, vip_category,
                phone, email, notes
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;

        const result = await pool.query(

            query,

            [fullName, honorificTitle, positionTitle, organizationId, district, vipCategory, phone, email, notes]

        );

        return result.rows[0];

    }


    async updateVIP(vipId, fields) {

        const columnByField = {
            fullName: "full_name",
            honorificTitle: "honorific_title",
            positionTitle: "position_title",
            organizationId: "organization_id",
            district: "district",
            vipCategory: "vip_category",
            phone: "phone",
            email: "email",
            notes: "notes"
        };

        const sets = [];
        const values = [];

        for (const [field, column] of Object.entries(columnByField)) {
            if (Object.prototype.hasOwnProperty.call(fields, field)) {
                values.push(fields[field]);
                sets.push(`${column} = $${values.length}`);
            }
        }

        if (sets.length === 0) {
            return this.getVIPById(vipId);
        }

        values.push(vipId);

        const query = `
            UPDATE vip_profiles
            SET ${sets.join(", ")},
                updated_at = CURRENT_TIMESTAMP
            WHERE vip_id = $${values.length}
            RETURNING *;
        `;

        const result = await pool.query(query, values);

        return result.rows[0];

    }


    async updateEmail(vipId, email) {

        return this.updateVIP(vipId, { email });

    }


    async deactivateVIP(vipId) {

        const query = `
            UPDATE vip_profiles
            SET is_active = FALSE,
                updated_at = CURRENT_TIMESTAMP
            WHERE vip_id = $1
            RETURNING vip_id, full_name, is_active;
        `;

        const result = await pool.query(

            query,

            [vipId]

        );

        return result.rows[0];

    }

}

export default VIPProfileRepository;