import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getCashMovementsController } from "../controllers/cash.controller.js";

const router = Router();

router.get("", authMiddleware, getCashMovementsController);

export default router;
