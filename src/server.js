import express from "express";

import cors from "cors";

import dotenv from "dotenv";

import aiRoutes from "./routes/aiRoutes.js";

import dashboardRoutes from "./routes/dashboardRoutes.js";

import protocolRoutes from "./routes/protocolRoutes.js";

import realtimeRoutes from "./routes/realtimeRoutes.js";

import runningOrderRoutes from "./routes/runningOrderRoutes.js";


dotenv.config();


const app = express();


app.use(cors());

app.use(express.json());


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