import type { Request, Response } from "express";
import type { GetCashMovementsDto } from "../dto/cash.dto.js";
import { getCashMovements } from "../service/cash.service.js";

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
