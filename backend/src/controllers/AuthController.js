import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserRepository from "../repositories/UserRepository.js";

const SELF_SERVICE_ROLES = ["event_organizer", "protocol_officer", "usher", "viewer"];

function signToken(user) {
    return jwt.sign(
        { id: user.user_id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

function sanitize(user) {
    return {
        id: user.user_id,
        fullName: user.full_name,
        email: user.email,
        role: user.role
    };
}

class AuthController {

    constructor() {
        this.userRepository = new UserRepository();
    }


    register = async (req, res) => {
        const { fullName, email, password, role } = req.body || {};

        if (!fullName || !email || !password || !role) {
            return res.status(400).json({ error: "fullName, email, password, and role are all required" });
        }

        if (!SELF_SERVICE_ROLES.includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }

        if (String(password).length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters" });
        }

        const existing = await this.userRepository.getUserByEmail(email);

        if (existing) {
            return res.status(409).json({ error: "An account with this email already exists" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await this.userRepository.createUser({
            fullName: String(fullName).trim(),
            email: String(email).trim().toLowerCase(),
            passwordHash,
            role
        });

        const token = signToken(user);

        res.status(201).json({ token, user: sanitize(user) });
    };


    login = async (req, res) => {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ error: "email and password are required" });
        }

        const user = await this.userRepository.getUserByEmail(String(email).trim().toLowerCase());

        if (!user || !user.password_hash || !user.is_active) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const matches = await bcrypt.compare(password, user.password_hash);

        if (!matches) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = signToken(user);

        res.json({ token, user: sanitize(user) });
    };


    me = async (req, res) => {
        const user = await this.userRepository.getUserById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(sanitize(user));
    };

}

export default AuthController;
