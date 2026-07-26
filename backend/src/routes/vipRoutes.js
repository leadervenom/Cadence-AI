import express from "express";
import VIPController from "../controllers/VIPController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import asyncHandler from "../middleware/asyncHandler.js";

const router = express.Router();
const controller = new VIPController();

router.use(authMiddleware);

router.get("/search", asyncHandler(controller.searchVIPs));
router.get("/", asyncHandler(controller.getAllVIPs));
router.post("/", asyncHandler(controller.createVIP));
router.get("/:id", asyncHandler(controller.getVIPById));
router.put("/:id", asyncHandler(controller.updateVIP));
router.delete("/:id", asyncHandler(controller.deleteVIP));

export default router;
