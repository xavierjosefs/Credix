import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  createLoanController,
  getDisbursementReceiptPdfController,
  getLoanController,
  getLoansController,
  getPaymentReceiptPdfController,
  registerLoanPaymentController,
} from "../controllers/loan.controller.js";

const router = Router();

router.post("/create", authMiddleware, createLoanController);
router.post("/:loanId/payments", authMiddleware, registerLoanPaymentController);
router.get("/:loanId/payments/:paymentId/receipt/pdf", authMiddleware, getPaymentReceiptPdfController);
router.get("/:loanId/disbursement/pdf", authMiddleware, getDisbursementReceiptPdfController);
router.get("/:loanId", authMiddleware, getLoanController);
router.get("", authMiddleware, getLoansController);

export default router;
