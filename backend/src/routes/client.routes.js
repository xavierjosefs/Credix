import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createClientController, getAllClientsController, getClientByIdController, getClientCollectionReportPdfController, getClientCollectionReportController, getClientController, updateClientController } from "../controllers/client.controller.js";
import { upload } from "../middleware/upload.middleware.js";
const router = Router();
router.post("/create", authMiddleware, upload.single("image"), createClientController);
router.get("/get", authMiddleware, getClientController);
router.get("/report", authMiddleware, getClientCollectionReportController);
router.get("/report/pdf", authMiddleware, getClientCollectionReportPdfController);
router.put("/:id", authMiddleware, upload.single("image"), updateClientController);
router.get("/:id", authMiddleware, getClientByIdController);
router.get("", authMiddleware, getAllClientsController);
export default router;
//# sourceMappingURL=client.routes.js.map