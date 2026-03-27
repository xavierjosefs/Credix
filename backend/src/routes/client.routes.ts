import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createClientController, getAllClientsController, getClientController } from "../controllers/client.controller.js";

const router = Router();
router.post("/create", authMiddleware, createClientController);
router.get("/get", authMiddleware, getClientController);
router.get("", authMiddleware, getAllClientsController)

export default router;