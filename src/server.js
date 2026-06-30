import express from "express";

import cors from "cors";

import dotenv from "dotenv";

import aiRoutes from "./routes/aiRoutes.js";

import dashboardRoutes from "./routes/dashboardRoutes.js";

import eventRoutes from "./routes/eventRoutes.js";

import protocolRoutes from "./routes/protocolRoutes.js";

import realtimeRoutes from "./routes/realtimeRoutes.js";

import runningOrderRoutes from "./routes/runningOrderRoutes.js";


dotenv.config();


const app = express();


app.use(cors());

const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || "25mb";

app.use(express.json({ limit: JSON_BODY_LIMIT }));

app.get(

    "/api/health",

    (req, res) => res.json({ status: "ok" })

);


app.use(

    "/api/events",

    eventRoutes

);


app.use(

    "/api/ai",

    aiRoutes

);


app.use(

    "/api/dashboard",

    dashboardRoutes

);


app.use(

    "/api/protocol",

    protocolRoutes

);


app.use(

    "/api/realtime",

    realtimeRoutes

);


app.use(

    "/api/running-order",

    runningOrderRoutes

);


app.use((error, req, res, next) => {

    console.error(error);

    if (error.type === "entity.too.large") {

        res.status(413).json({

            error: `Request body is too large. Upload a smaller file or increase JSON_BODY_LIMIT above ${JSON_BODY_LIMIT}.`

        });

        return;

    }

    res.status(500).json({

        error: error.message || "Internal server error"

    });

});


const PORT =

process.env.PORT ||

3000;


app.listen(

    PORT,

    () => {

        console.log(

            `Server running on port ${PORT}`

        );

    }

);
