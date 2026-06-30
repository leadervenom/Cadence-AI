import express from "express";

import RunningOrderController from "../controllers/RunningOrderController.js";

const router = express.Router();

const controller = new RunningOrderController();


router.get(

    "/",

    controller.getStatus

);


export default router;