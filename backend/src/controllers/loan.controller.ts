import type { Request, Response } from "express";
import type { GetLoansDto } from "../dto/loan.dto.js";
import {
  createLoan,
  getLoanById,
  getLoans,
  registerLoanPayment,
} from "../service/loan.service.js";

export const createLoanController = async (req: Request, res: Response) => {
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
  } catch (error: any) {
    return res.status(400).json({
      message: "Error creating loan",
      error: error.message,
    });
  }
};

export const registerLoanPaymentController = async (req: Request, res: Response) => {
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
  } catch (error: any) {
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

export const getLoanController = async (req: Request, res: Response) => {
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
  } catch (error: any) {
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

export const getLoansController = async (req: Request, res: Response) => {
  try {
    const result = await getLoans(req.query as GetLoansDto);
    return res.status(200).json({
      message: "Loans retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: "Error retrieving loans",
      error: error.message,
    });
  }
};

function normalizeRouteParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
