import express from "express";
import EventController from "../controllers/EventController.js";
import RsvpController from "../controllers/RsvpController.js";

const router = express.Router();
const controller = new EventController();
const rsvpController = new RsvpController();

router.get("/", controller.getAllEvents);
router.get("/:id", controller.getEventById);
router.post("/", controller.createEvent);

router.get("/:eventId/participants", rsvpController.getParticipants);
router.post("/:eventId/invite", rsvpController.invite);

export default router;
