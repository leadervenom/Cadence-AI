import express from "express";

import AIController from "../controllers/AIController.js";

const router = express.Router();

const controller = new AIController();


router.get(

    "/",

    controller.getStatus

);

router.post(

    "/chat",

    controller.chat

);


export default router;
