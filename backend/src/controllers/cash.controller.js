import { getCashMovements } from "../service/cash.service.js";
import { generateCashReportPdf } from "../service/report.service.js";
export const getCashMovementsController = async (req, res) => {
    try {
        const result = await getCashMovements(req.query);
        return res.status(200).json({
            message: "Cash movements retrieved successfully",
            data: result,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: "Error retrieving cash movements",
            error: error.message,
        });
    }
};
export const getCashReportPdfController = async (req, res) => {
    try {
        const pdf = await generateCashReportPdf(req.query);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${pdf.fileName}"`);
        return res.status(200).send(pdf.buffer);
    }
    catch (error) {
        return res.status(400).json({
            message: "Error generating cash report",
            error: error.message,
        });
    }
};
//# sourceMappingURL=cash.controller.js.map