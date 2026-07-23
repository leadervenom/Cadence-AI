import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    }
    catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
