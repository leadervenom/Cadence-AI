import express from "express";
import VIPController from "../controllers/VIPController.js";

const router = express.Router();
const controller = new VIPController();

router.get("/search", controller.searchVIPs);
router.get("/", controller.getAllVIPs);
router.get("/:id", controller.getVIPById);

export default router;
