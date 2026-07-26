import express from "express";
import VIPRankingController from "../controllers/VIPRankingController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import asyncHandler from "../middleware/asyncHandler.js";

const router = express.Router();
const controller = new VIPRankingController();

router.use(authMiddleware);

router.get("/", asyncHandler(controller.getRankings));
router.get("/top", asyncHandler(controller.getTopVIPs));
router.post("/", asyncHandler(controller.setRanking));
router.delete("/:vipId", asyncHandler(controller.removeRanking));

export default router;
