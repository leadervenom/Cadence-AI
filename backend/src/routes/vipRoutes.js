import express from "express";
import VIPController from "../controllers/VIPController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import asyncHandler from "../middleware/asyncHandler.js";
import requireRole from "../middleware/requireRole.js";
import { WRITE_ROLES } from "../middleware/roles.js";

const router = express.Router();
const controller = new VIPController();

router.use(authMiddleware);

router.get("/search", asyncHandler(controller.searchVIPs));
router.get("/", asyncHandler(controller.getAllVIPs));
router.post("/", requireRole(...WRITE_ROLES), asyncHandler(controller.createVIP));
router.get("/:id", asyncHandler(controller.getVIPById));
router.put("/:id", requireRole(...WRITE_ROLES), asyncHandler(controller.updateVIP));
router.delete("/:id", requireRole(...WRITE_ROLES), asyncHandler(controller.deleteVIP));

export default router;
