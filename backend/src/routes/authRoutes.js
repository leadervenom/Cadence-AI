import express from "express";
import AuthController from "../controllers/AuthController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
const controller = new AuthController();

router.post("/register", controller.register);
router.post("/login", controller.login);
router.get("/me", authMiddleware, controller.me);

export default router;
