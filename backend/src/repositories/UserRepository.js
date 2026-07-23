import pool from "../database/db.js";

class UserRepository {

    async getUserByEmail(email) {

        const query = `
            SELECT *
            FROM app_users
            WHERE email = $1;
        `;

        const result = await pool.query(query, [email]);

        return result.rows[0];

    }


    async getUserById(userId) {

        const query = `
            SELECT
                user_id,
                full_name,
                email,
                role,
                is_active
            FROM app_users
            WHERE user_id = $1;
        `;

        const result = await pool.query(query, [userId]);

        return result.rows[0];

    }


    async createUser({ fullName, email, passwordHash, role }) {

        const query = `
            INSERT INTO app_users (full_name, email, password_hash, role)
            VALUES ($1, $2, $3, $4)
            RETURNING user_id, full_name, email, role, is_active;
        `;

        const result = await pool.query(query, [fullName, email, passwordHash, role]);

        return result.rows[0];

    }

}

export default UserRepository;
