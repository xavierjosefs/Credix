import { Router } from "express";
import { completeRegister, login, inviteAdmin } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";

const router = Router();

router.post('/invite-admin',authMiddleware, requireAdmin, inviteAdmin)
router.post('/complete-registration', completeRegister)
router.post("/login", login)

export default router;