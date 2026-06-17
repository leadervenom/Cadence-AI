import express from "express";

import RealTimeController from "../controllers/RealTimeController.js";

const router = express.Router();

const controller = new RealTimeController();


router.get(

    "/",

    controller.getStatus

);


export default router;