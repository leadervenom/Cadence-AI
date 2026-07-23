import express from "express";
import RsvpController from "../controllers/RsvpController.js";

const router = express.Router();
const controller = new RsvpController();

router.get("/:token/:decision", controller.respond);

export default router;
