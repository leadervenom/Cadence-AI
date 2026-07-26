import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import vipRoutes from "./routes/vipRoutes.js";
import vipRankingRoutes from "./routes/vipRankingRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import rsvpRoutes from "./routes/rsvpRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Public: register/login and the token-based RSVP responder (the recipient
// clicks this from an email with no account/session of their own).
app.use("/api/auth", authRoutes);
app.use("/api/rsvp", rsvpRoutes);

// Everything else requires a Bearer token (see authMiddleware in each
// protected router below) — mirrors the "protected unless explicitly public"
// convention from the Greenstep backend.
app.use("/api/ai", aiRoutes);
app.use("/api/vips", vipRoutes);
app.use("/api/vip-rankings", vipRankingRoutes);
app.use("/api/events", eventRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

server.on("error", (error) => {
    console.error(`Server failed to start: ${error.message}`);
    process.exitCode = 1;
});
