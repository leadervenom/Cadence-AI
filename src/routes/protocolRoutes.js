import express from "express";

import ProtocolController from "../controllers/ProtocolController.js";

const router = express.Router();

const controller = new ProtocolController();


router.get(

    "/",

    controller.getStatus

);


export default router;