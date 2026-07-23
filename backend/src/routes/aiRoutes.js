import express from "express";
import AIController from "../controllers/AIController.js";

const router = express.Router();
const controller = new AIController();

router.get("/", controller.getStatus.bind(controller));
router.post("/chat", controller.chat.bind(controller));
router.get("/chats/:eventId", controller.getChatHistory.bind(controller));
router.put("/chats/:eventId", controller.saveChatHistory.bind(controller));

export default router;
