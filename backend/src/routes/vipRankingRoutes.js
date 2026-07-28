import express from "express";
import VIPRankingController from "../controllers/VIPRankingController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import asyncHandler from "../middleware/asyncHandler.js";
import requireRole from "../middleware/requireRole.js";
import { WRITE_ROLES } from "../middleware/roles.js";

const router = express.Router();
const controller = new VIPRankingController();

router.use(authMiddleware);

router.get("/", asyncHandler(controller.getRankings));
router.get("/top", asyncHandler(controller.getTopVIPs));
router.post("/", requireRole(...WRITE_ROLES), asyncHandler(controller.setRanking));
router.delete("/:vipId", requireRole(...WRITE_ROLES), asyncHandler(controller.removeRanking));

export default router;
