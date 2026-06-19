import type { Request, Response } from "express";
import type { GetCashMovementsDto } from "../dto/cash.dto.js";
import { getCashMovements } from "../service/cash.service.js";
import { generateCashReportPdf } from "../service/report.service.js";

export const getCashMovementsController = async (req: Request, res: Response) => {
  try {
    const result = await getCashMovements(req.query as GetCashMovementsDto);
    return res.status(200).json({
      message: "Cash movements retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: "Error retrieving cash movements",
      error: error.message,
    });
  }
};

export const getCashReportPdfController = async (req: Request, res: Response) => {
  try {
    const pdf = await generateCashReportPdf(req.query as GetCashMovementsDto & {
      admin?: string;
      q?: string;
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${pdf.fileName}"`);
    return res.status(200).send(pdf.buffer);
  } catch (error: any) {
    return res.status(400).json({
      message: "Error generating cash report",
      error: error.message,
    });
  }
};
