import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getCashMovementsController, getCashReportPdfController } from "../controllers/cash.controller.js";
const router = Router();
router.get("/report/pdf", authMiddleware, getCashReportPdfController);
router.get("", authMiddleware, getCashMovementsController);
export default router;
//# sourceMappingURL=cash.routes.js.map