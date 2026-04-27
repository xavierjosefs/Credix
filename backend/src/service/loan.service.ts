import { CashMovementType, LoanStatus, LoanType } from "@prisma/client";
import type {
  CreateLoanDto,
  GetLoansDto,
  RegisterLoanPaymentDto,
} from "../dto/loan.dto.js";
import prisma from "../prisma/prisma.js";
import {
  addDays,
  applyPaymentToInstallments,
  applyPrincipalPaymentToSegments,
  calculateInstallmentSchedule,
  calculateLoanAccruedInterest,
  calculateNextDueDate,
  calculateRemainingInstallmentInterest,
  diffInDays,
  enrichLoan,
  getNextPendingInstallmentDueDate,
  getLoanWithRelationsById,
  getPeriodDays,
  loanRelationsInclude,
  resolveInstallmentLoanStatus,
  resolveLoanStatus,
  roundMoney,
} from "./loan.helpers.js";

export const createLoan = async (data: CreateLoanDto, adminId: string) => {
  const {
    clientId,
    principalAmount,
    interestRate,
    frequency,
    startDate,
    method,
    existingLoanId,
    installmentCount,
    type = LoanType.FLEXIBLE,
  } = data;

  if (principalAmount <= 0) {
    throw new Error("Principal amount must be greater than zero");
  }

  if (!existingLoanId && interestRate < 0) {
    throw new Error("Interest rate cannot be negative");
  }

  if (type === LoanType.INSTALLMENT) {
    if (existingLoanId) {
      throw new Error("Top-ups are only available for flexible loans");
    }

    if (!Number.isInteger(installmentCount) || (installmentCount ?? 0) <= 0) {
      throw new Error("Installment count must be a positive integer");
    }
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client) {
    throw new Error("Client not found");
  }

  return prisma.$transaction(async (tx) => {
    if (existingLoanId) {
      const existingLoan = await tx.loan.findUnique({
        where: { id: existingLoanId },
        include: loanRelationsInclude,
      });

      if (!existingLoan) {
        throw new Error("Loan not found");
      }

      if (existingLoan.clientId !== clientId) {
        throw new Error("Loan does not belong to the provided client");
      }

      if (existingLoan.status !== LoanStatus.ACTIVE) {
        throw new Error("Only active loans can receive additional amount");
      }

      if (existingLoan.type !== LoanType.FLEXIBLE) {
        throw new Error("Only flexible loans can receive additional amount");
      }

      const updatedLoan = await tx.loan.update({
        where: { id: existingLoan.id },
        data: {
          principalAmount: roundMoney(existingLoan.principalAmount + principalAmount),
          remainingBalance: roundMoney(existingLoan.remainingBalance + principalAmount),
        },
        include: loanRelationsInclude,
      });

      await tx.loanSegment.create({
        data: {
          amount: roundMoney(principalAmount),
          startDate: new Date(),
          loanId: updatedLoan.id,
        },
      });

      await tx.cashMovement.create({
        data: {
          type: CashMovementType.EXPENSE,
          method,
          amount: roundMoney(principalAmount),
          description: "Monto agregado a prestamo existente",
          loanId: updatedLoan.id,
          clientId: updatedLoan.clientId,
          adminId,
        },
      });

      return enrichLoan(await getLoanWithRelationsById(tx, updatedLoan.id));
    }

    const parsedStartDate = new Date(startDate);

    if (Number.isNaN(parsedStartDate.getTime())) {
      throw new Error("Invalid start date");
    }

    const nextDueDate = addDays(parsedStartDate, getPeriodDays(frequency));

    if (type === LoanType.INSTALLMENT) {
      const { installments, totalAmount } = calculateInstallmentSchedule({
        principalAmount: roundMoney(principalAmount),
        interestRate,
        installmentCount: installmentCount!,
        frequency,
        startDate: parsedStartDate,
      });

      const loan = await tx.loan.create({
        data: {
          clientId,
          principalAmount: roundMoney(principalAmount),
          remainingBalance: totalAmount,
          interestRate,
          type: LoanType.INSTALLMENT,
          frequency,
          startDate: parsedStartDate,
          lastPaymentDate: parsedStartDate,
          nextDueDate: installments[0]?.dueDate ?? nextDueDate,
          status: LoanStatus.ACTIVE,
        },
        include: loanRelationsInclude,
      });

      if (installments.length > 0) {
        await tx.installment.createMany({
          data: installments.map((installment) => ({
            ...installment,
            loanId: loan.id,
          })),
        });
      }

      await tx.cashMovement.create({
        data: {
          type: CashMovementType.EXPENSE,
          method,
          amount: roundMoney(principalAmount),
          description: "Prestamo otorgado",
          loanId: loan.id,
          clientId: loan.clientId,
          adminId,
        },
      });

      return enrichLoan(await getLoanWithRelationsById(tx, loan.id));
    }

    const loan = await tx.loan.create({
      data: {
        clientId,
        principalAmount: roundMoney(principalAmount),
        remainingBalance: roundMoney(principalAmount),
        interestRate,
        type: LoanType.FLEXIBLE,
        frequency,
        startDate: parsedStartDate,
        lastPaymentDate: parsedStartDate,
        nextDueDate,
        status: LoanStatus.ACTIVE,
      },
      include: loanRelationsInclude,
    });

    await tx.loanSegment.create({
      data: {
        amount: roundMoney(principalAmount),
        startDate: parsedStartDate,
        loanId: loan.id,
      },
    });

    await tx.cashMovement.create({
      data: {
        type: CashMovementType.EXPENSE,
        method,
        amount: roundMoney(principalAmount),
        description: "Prestamo otorgado",
        loanId: loan.id,
        clientId: loan.clientId,
        adminId,
      },
    });

    return enrichLoan(await getLoanWithRelationsById(tx, loan.id));
  });
};

export const getLoanById = async (loanId: string) => {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: loanRelationsInclude,
  });

  if (!loan) {
    throw new Error("Loan not found");
  }

  return enrichLoan(loan);
};

export const getLoans = async (filters: GetLoansDto) => {
  const loans = await prisma.loan.findMany({
    where: {
      ...(filters.clientId && { clientId: filters.clientId }),
      ...(filters.status && { status: filters.status }),
    },
    include: loanRelationsInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  return loans.map(enrichLoan);
};

export const registerLoanPayment = async (
  data: RegisterLoanPaymentDto,
  adminId: string
) => {
  const { loanId, amount, paymentDate, method, interestDays } = data;

  if (amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  if (interestDays !== undefined) {
    if (!Number.isFinite(interestDays)) {
      throw new Error("Interest days must be a valid number");
    }

    if (!Number.isInteger(interestDays)) {
      throw new Error("Interest days must be an integer");
    }

    if (interestDays <= 0) {
      throw new Error("Interest days must be greater than zero");
    }
  }

  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      include: loanRelationsInclude,
    });

    if (!loan) {
      throw new Error("Loan not found");
    }

    if (loan.remainingBalance <= 0 || loan.status === LoanStatus.PAID) {
      throw new Error("Loan is already paid");
    }

    const effectivePaymentDate = paymentDate ? new Date(paymentDate) : new Date();

    if (Number.isNaN(effectivePaymentDate.getTime())) {
      throw new Error("Invalid payment date");
    }

    if (effectivePaymentDate < loan.lastPaymentDate) {
      throw new Error("Payment date cannot be earlier than last payment date");
    }

    if (loan.type === LoanType.INSTALLMENT) {
      if (interestDays !== undefined) {
        throw new Error("Interest days override is only available for flexible loans");
      }

      const { installments, appliedAmount, interestPaid, principalPaid } =
        applyPaymentToInstallments(loan, amount);

      if (appliedAmount <= 0) {
        throw new Error("Payment could not be applied to any installment");
      }

      const newRemainingBalance = roundMoney(Math.max(loan.remainingBalance - appliedAmount, 0));

      const nextDueDate = getNextPendingInstallmentDueDate({
        ...loan,
        installments,
      });

      const nextStatus = resolveInstallmentLoanStatus({
        remainingBalance: newRemainingBalance,
        effectivePaymentDate,
        nextDueDate,
      });

      const payment = await tx.payment.create({
        data: {
          amount: appliedAmount,
          interestPaid,
          principalPaid,
          remainingBalance: newRemainingBalance,
          daysCalculated: 0,
          paymentDate: effectivePaymentDate,
          loanId: loan.id,
        },
      });

      await tx.cashMovement.create({
        data: {
          type: CashMovementType.INCOME,
          method,
          amount: appliedAmount,
          description: "Pago de prestamo",
          loanId: loan.id,
          clientId: loan.clientId,
          adminId,
        },
      });

      await tx.loan.update({
        where: { id: loan.id },
        data: {
          remainingBalance: newRemainingBalance,
          lastPaymentDate: effectivePaymentDate,
          nextDueDate: nextDueDate ?? loan.nextDueDate,
          status: nextStatus,
        },
      });

      for (const installment of installments) {
        await tx.installment.update({
          where: { id: installment.id },
          data: {
            paidAmount: installment.paidAmount,
            status: installment.status,
          },
        });
      }

      return {
        payment,
        loan: enrichLoan(await getLoanWithRelationsById(tx, loan.id)),
        breakdown: {
          accruedInterest: calculateRemainingInstallmentInterest({
            ...loan,
            installments,
          }),
          interestPaid,
          principalPaid,
          daysCalculated: 0,
        },
      };
    }

    const realDays = diffInDays(loan.lastPaymentDate, effectivePaymentDate);
    const periodDays = getPeriodDays(loan.frequency);

    if (interestDays !== undefined && interestDays > periodDays) {
      throw new Error(`Interest days cannot be greater than ${periodDays} for this loan`);
    }

    const daysCalculated = interestDays ?? realDays;

    const accruedInterest = calculateLoanAccruedInterest(
      loan,
      effectivePaymentDate,
      interestDays
    );

    if (amount < accruedInterest) {
      throw new Error(
        `Payment must cover at least accrued interest (${accruedInterest})`
      );
    }

    const interestPaid = roundMoney(accruedInterest);
    const principalPaid = roundMoney(
      Math.min(Math.max(amount - interestPaid, 0), loan.remainingBalance)
    );
    const newRemainingBalance = roundMoney(
      Math.max(loan.remainingBalance - principalPaid, 0)
    );
    const nextSegments = applyPrincipalPaymentToSegments(loan, principalPaid);

    let nextDueDate = loan.nextDueDate;

    if (effectivePaymentDate >= loan.nextDueDate) {
      nextDueDate = calculateNextDueDate(
        loan.nextDueDate,
        effectivePaymentDate,
        loan.frequency
      );
    }

    const nextStatus = resolveLoanStatus({
      remainingBalance: newRemainingBalance,
      effectivePaymentDate,
      nextDueDate: loan.nextDueDate,
    });

    const payment = await tx.payment.create({
      data: {
        amount: roundMoney(amount),
        interestPaid,
        principalPaid,
        remainingBalance: newRemainingBalance,
        daysCalculated,
        paymentDate: effectivePaymentDate,
        loanId: loan.id,
      },
    });

    await tx.cashMovement.create({
      data: {
        type: CashMovementType.INCOME,
        method,
        amount: roundMoney(amount),
        description: "Pago de prestamo",
        loanId: loan.id,
        clientId: loan.clientId,
        adminId,
      },
    });

    await tx.loan.update({
      where: { id: loan.id },
      data: {
        remainingBalance: newRemainingBalance,
        lastPaymentDate: effectivePaymentDate,
        nextDueDate,
        status: nextStatus,
      },
    });

    for (const segment of nextSegments) {
      if (!segment.persistedId) {
        continue;
      }

      await tx.loanSegment.update({
        where: { id: segment.persistedId },
        data: {
          amount: segment.amount,
        },
      });
    }

    return {
      payment,
      loan: enrichLoan(await getLoanWithRelationsById(tx, loan.id)),
      breakdown: {
        accruedInterest,
        interestPaid,
        principalPaid,
        daysCalculated,
      },
    };
  });
};
