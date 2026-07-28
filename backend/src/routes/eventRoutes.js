import express from "express";
import EventController from "../controllers/EventController.js";
import RsvpController from "../controllers/RsvpController.js";
import SeatingController from "../controllers/SeatingController.js";
import EventAssignmentController from "../controllers/EventAssignmentController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import asyncHandler from "../middleware/asyncHandler.js";
import requireRole from "../middleware/requireRole.js";
import requireEventAccess from "../middleware/requireEventAccess.js";
import { EVENT_CREATE_DELETE_ROLES, EVENT_UPDATE_ROLES, WRITE_ROLES, CHECKIN_ROLES } from "../middleware/roles.js";

const router = express.Router();
const controller = new EventController();
const rsvpController = new RsvpController();
const seatingController = new SeatingController();
const assignmentController = new EventAssignmentController();

router.use(authMiddleware);

router.get("/", asyncHandler(controller.getAllEvents));
router.get("/:id", requireEventAccess, asyncHandler(controller.getEventById));
router.post("/", requireRole(...EVENT_CREATE_DELETE_ROLES), asyncHandler(controller.createEvent));
router.put("/:id", requireRole(...EVENT_UPDATE_ROLES), requireEventAccess, asyncHandler(controller.updateEvent));
router.delete("/:id", requireRole(...EVENT_CREATE_DELETE_ROLES), asyncHandler(controller.deleteEvent));

router.post("/:eventId/organizers/invite", requireRole(...EVENT_CREATE_DELETE_ROLES), asyncHandler(assignmentController.inviteOrganizer));

router.get("/:eventId/participants", requireEventAccess, asyncHandler(rsvpController.getParticipants));
router.post("/:eventId/invite", requireRole(...WRITE_ROLES), requireEventAccess, asyncHandler(rsvpController.invite));
router.patch("/:eventId/participants/:eventVipId", requireRole(...WRITE_ROLES), requireEventAccess, asyncHandler(rsvpController.updateDetails));
router.patch("/:eventId/participants/:eventVipId/status", requireRole(...CHECKIN_ROLES), requireEventAccess, asyncHandler(rsvpController.updateStatus));
router.delete("/:eventId/participants/:eventVipId", requireRole(...WRITE_ROLES), requireEventAccess, asyncHandler(rsvpController.uninvite));

router.put("/:eventId/seating", requireRole(...WRITE_ROLES), requireEventAccess, asyncHandler(seatingController.updateSeating));

export default router;
