import {
  CashMovementType,
  LoanStatus,
  PaymentFrequency,
  Prisma,
} from "@prisma/client";
import type { CreateLoanDto, GetLoansDto, RegisterLoanPaymentDto,} from "../dto/loan.dto.js";
import prisma from "../prisma/prisma.js";

type LoanWithRelations = Prisma.LoanGetPayload<{
  include: {
    client: true;
    payments: {
      orderBy: {
        paymentDate: "desc";
      };
    };
  };
}>;

export const createLoan = async (data: CreateLoanDto, adminId: string) => {
  const { clientId, principalAmount, interestRate, frequency, startDate, method } = data;

  if (principalAmount <= 0) {
    throw new Error("Principal amount must be greater than zero");
  }

  if (interestRate < 0) {
    throw new Error("Interest rate cannot be negative");
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client) {
    throw new Error("Client not found");
  }

  const parsedStartDate = new Date(startDate);

  if (Number.isNaN(parsedStartDate.getTime())) {
    throw new Error("Invalid start date");
  }

  const nextDueDate = addDays(parsedStartDate, getPeriodDays(frequency));

  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.create({
      data: {
        clientId,
        principalAmount: roundMoney(principalAmount),
        remainingBalance: roundMoney(principalAmount),
        interestRate,
        frequency,
        startDate: parsedStartDate,
        lastPaymentDate: parsedStartDate,
        nextDueDate,
        status: LoanStatus.ACTIVE,
      },
      include: {
        client: true,
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
        },
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

    return loan;
  });
};

export const getLoanById = async (loanId: string) => {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: {
      client: true,
      payments: {
        orderBy: {
          paymentDate: "desc",
        },
      },
    },
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
    include: {
      client: true,
      payments: {
        orderBy: {
          paymentDate: "desc",
        },
      },
    },
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
  const { loanId, amount, paymentDate, method } = data;

  if (amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      include: {
        client: true,
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
        },
      },
    });

    if (loan!.remainingBalance <= 0) {
      throw new Error("Loan has no remaining balance");
    }

    if (!loan) {
      throw new Error("Loan not found");
    }

    if (loan.status === LoanStatus.PAID || loan.remainingBalance <= 0) {
      throw new Error("Loan is already paid");
    }

    const effectivePaymentDate = paymentDate ? new Date(paymentDate) : new Date();

    if (Number.isNaN(effectivePaymentDate.getTime())) {
      throw new Error("Invalid payment date");
    }

    if (effectivePaymentDate < loan.lastPaymentDate) {
      throw new Error("Payment date cannot be earlier than last payment date");
    }

    const daysCalculated = diffInDays(loan.lastPaymentDate, effectivePaymentDate);

    if (daysCalculated === 0) {
      throw new Error("At least 1 day must pass to calculate interest");
    }
    const accruedInterest = calculateAccruedInterest({
      remainingBalance: loan.remainingBalance,
      interestRate: loan.interestRate,
      frequency: loan.frequency,
      daysElapsed: daysCalculated,
    });

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

    const wasLateAtPayment = effectivePaymentDate > loan.nextDueDate;
    let nextDueDate = loan.nextDueDate;

    if (effectivePaymentDate >= loan.nextDueDate) {
      nextDueDate = calculateNextDueDate(
        loan.nextDueDate,
        effectivePaymentDate,
        loan.frequency
      );
    }

    const nextStatus =
      newRemainingBalance === 0
        ? LoanStatus.PAID
        : wasLateAtPayment
          ? LoanStatus.LATE
          : LoanStatus.ACTIVE;

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

    const updatedLoan = await tx.loan.update({
      where: { id: loan.id },
      data: {
        remainingBalance: newRemainingBalance,
        lastPaymentDate: effectivePaymentDate,
        nextDueDate,
        status: nextStatus,
      },
      include: {
        client: true,
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
        },
      },
    });

    return {
      payment,
      loan: enrichLoan(updatedLoan),
      breakdown: {
        accruedInterest,
        interestPaid,
        principalPaid,
        daysCalculated,
      },
    };
  });
};

function enrichLoan(loan: LoanWithRelations) {
  const accruedInterest = calculateAccruedInterest({
    remainingBalance: loan.remainingBalance,
    interestRate: loan.interestRate,
    frequency: loan.frequency,
    daysElapsed: diffInDays(loan.lastPaymentDate, new Date()),
  });

  return {
    ...loan,
    currentAccruedInterest: accruedInterest,
    currentTotalDue: roundMoney(loan.remainingBalance + accruedInterest),
  };
}

function getPeriodDays(frequency: PaymentFrequency) {
  return frequency === PaymentFrequency.MONTHLY ? 30 : 15;
}

function calculateAccruedInterest({
  remainingBalance,
  interestRate,
  frequency,
  daysElapsed,
}: {
  remainingBalance: number;
  interestRate: number;
  frequency: PaymentFrequency;
  daysElapsed: number;
}) {
  if (remainingBalance <= 0 || interestRate <= 0 || daysElapsed <= 0) {
    return 0;
  }

  const periodDays = getPeriodDays(frequency);
  const periodInterest = remainingBalance * (interestRate / 100);
  const dailyInterest = periodInterest / periodDays;

  return roundMoney(dailyInterest * daysElapsed);
}

function calculateNextDueDate(
  currentDueDate: Date,
  paymentDate: Date,
  frequency: PaymentFrequency
) {
  const periodDays = getPeriodDays(frequency);
  let nextDueDate = new Date(currentDueDate);

  while (nextDueDate <= paymentDate) {
    nextDueDate = addDays(nextDueDate, periodDays);
  }

  return nextDueDate;
}

function diffInDays(startDate: Date, endDate: Date) {
  const diffMs = endDate.getTime() - startDate.getTime();

  if (diffMs <= 0) {
    return 0;
  }

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}
