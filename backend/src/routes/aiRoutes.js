import express from "express";
import AIController from "../controllers/AIController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import asyncHandler from "../middleware/asyncHandler.js";

const router = express.Router();
const controller = new AIController();

router.use(authMiddleware);

router.get("/", controller.getStatus.bind(controller));
router.post("/chat", asyncHandler(controller.chat.bind(controller)));
router.get("/chats/:eventId", asyncHandler(controller.getChatHistory.bind(controller)));
router.put("/chats/:eventId", asyncHandler(controller.saveChatHistory.bind(controller)));

export default router;
