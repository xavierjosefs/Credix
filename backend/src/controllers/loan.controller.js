import { createLoan, getLoanById, getLoans, registerLoanPayment, } from "../service/loan.service.js";
import { generateDisbursementReceiptPdf, generatePaymentReceiptPdf, } from "../service/report.service.js";
export const createLoanController = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const result = await createLoan(req.body, req.user.id);
        return res.status(201).json({
            message: "Loan processed successfully",
            data: result,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: "Error creating loan",
            error: error.message,
        });
    }
};
export const registerLoanPaymentController = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const loanId = normalizeRouteParam(req.params.loanId);
        if (!loanId) {
            return res.status(400).json({
                message: "Loan id is required",
            });
        }
        const result = await registerLoanPayment({
            loanId,
            ...req.body,
        }, req.user.id);
        return res.status(201).json({
            message: "Payment registered successfully",
            data: result,
        });
    }
    catch (error) {
        if (error.message === "Loan not found") {
            return res.status(404).json({
                message: "Loan not found",
                error: error.message,
            });
        }
        return res.status(400).json({
            message: "Error registering payment",
            error: error.message,
        });
    }
};
export const getLoanController = async (req, res) => {
    try {
        const loanId = normalizeRouteParam(req.params.loanId);
        if (!loanId) {
            return res.status(400).json({
                message: "Loan id is required",
            });
        }
        const result = await getLoanById(loanId);
        return res.status(200).json({
            message: "Loan retrieved successfully",
            data: result,
        });
    }
    catch (error) {
        if (error.message === "Loan not found") {
            return res.status(404).json({
                message: "Loan not found",
                error: error.message,
            });
        }
        return res.status(400).json({
            message: "Error retrieving loan",
            error: error.message,
        });
    }
};
export const getLoansController = async (req, res) => {
    try {
        const result = await getLoans((req.query ?? {}));
        return res.status(200).json({
            message: "Loans retrieved successfully",
            data: result,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: "Error retrieving loans",
            error: error.message,
        });
    }
};
export const getPaymentReceiptPdfController = async (req, res) => {
    try {
        const loanId = normalizeRouteParam(req.params.loanId);
        const paymentId = normalizeRouteParam(req.params.paymentId);
        if (!loanId || !paymentId) {
            return res.status(400).json({
                message: "Loan id and payment id are required",
            });
        }
        const pdf = await generatePaymentReceiptPdf({
            loanId,
            paymentId,
            ...(normalizeQueryParam(req.query.method) ? { method: normalizeQueryParam(req.query.method) } : {}),
        });
        return sendPdfResponse(res, pdf.buffer, pdf.fileName);
    }
    catch (error) {
        return res.status(400).json({
            message: "Error generating payment receipt",
            error: error.message,
        });
    }
};
export const getDisbursementReceiptPdfController = async (req, res) => {
    try {
        const loanId = normalizeRouteParam(req.params.loanId);
        if (!loanId) {
            return res.status(400).json({
                message: "Loan id is required",
            });
        }
        const movementId = normalizeQueryParam(req.query.movementId);
        const amount = normalizeQueryParam(req.query.amount);
        const issuedAt = normalizeQueryParam(req.query.issuedAt);
        const method = normalizeQueryParam(req.query.method);
        const mode = normalizeQueryParam(req.query.mode);
        const pdf = await generateDisbursementReceiptPdf(loanId, {
            ...(movementId ? { movementId } : {}),
            ...(amount ? { amount } : {}),
            ...(issuedAt ? { issuedAt } : {}),
            ...(method ? { method } : {}),
            ...(mode ? { mode } : {}),
        });
        return sendPdfResponse(res, pdf.buffer, pdf.fileName);
    }
    catch (error) {
        return res.status(400).json({
            message: "Error generating disbursement receipt",
            error: error.message,
        });
    }
};
function normalizeRouteParam(value) {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}
function normalizeQueryParam(value) {
    if (Array.isArray(value)) {
        const firstValue = value[0];
        return typeof firstValue === "string" ? firstValue : undefined;
    }
    return typeof value === "string" ? value : undefined;
}
function sendPdfResponse(res, pdfBuffer, fileName) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    return res.status(200).send(pdfBuffer);
}
//# sourceMappingURL=loan.controller.js.map