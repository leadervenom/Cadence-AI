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

    controller.chat.bind(controller)

);

router.post(

    "/protocol/parse",

    controller.parseProtocol.bind(controller)

);

router.post(

    "/protocol/running-order",

    controller.generateProtocolRunningOrder.bind(controller)

);

router.post(

    "/protocol/extract",

    controller.extractProtocol.bind(controller)

);


export default router;
