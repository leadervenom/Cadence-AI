import express from "express";
import EventController from "../controllers/EventController.js";
import RsvpController from "../controllers/RsvpController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import asyncHandler from "../middleware/asyncHandler.js";

const router = express.Router();
const controller = new EventController();
const rsvpController = new RsvpController();

router.use(authMiddleware);

router.get("/", asyncHandler(controller.getAllEvents));
router.get("/:id", asyncHandler(controller.getEventById));
router.post("/", asyncHandler(controller.createEvent));
router.put("/:id", asyncHandler(controller.updateEvent));
router.delete("/:id", asyncHandler(controller.deleteEvent));

router.get("/:eventId/participants", asyncHandler(rsvpController.getParticipants));
router.post("/:eventId/invite", asyncHandler(rsvpController.invite));
router.patch("/:eventId/participants/:eventVipId", asyncHandler(rsvpController.updateDetails));
router.patch("/:eventId/participants/:eventVipId/status", asyncHandler(rsvpController.updateStatus));
router.delete("/:eventId/participants/:eventVipId", asyncHandler(rsvpController.uninvite));

export default router;
