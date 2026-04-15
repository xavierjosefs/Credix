import { Prisma } from "@prisma/client";
import type { GetCashMovementsDto } from "../dto/cash.dto.js";
import prisma from "../prisma/prisma.js";

export const getCashMovements = async (filters: GetCashMovementsDto) => {
  const where: Prisma.CashMovementWhereInput = {};
  let rangeFilter:
    | {
        gte: Date;
        lt: Date;
      }
    | undefined;

  rangeFilter = buildRangeFilter(filters);

  if (rangeFilter) {
    where.createdAt = rangeFilter;
  }

  const paymentWhere: Prisma.PaymentWhereInput = rangeFilter
    ? {
        paymentDate: rangeFilter,
      }
    : {};

  const loanWhere: Prisma.LoanWhereInput = rangeFilter
    ? {
        createdAt: rangeFilter,
      }
    : {};

  const [cashMovements, legacyPayments, legacyLoans] = await Promise.all([
    prisma.cashMovement.findMany({
      where,
      include: {
        client: true,
        loan: true,
        admin: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.payment.findMany({
      where: paymentWhere,
      include: {
        loan: {
          include: {
            client: true,
          },
        },
      },
      orderBy: {
        paymentDate: "desc",
      },
    }),
    prisma.loan.findMany({
      where: loanWhere,
      include: {
        client: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const existingIncomeKeys = new Set(
    cashMovements
      .filter((movement) => movement.type === "INCOME" && movement.loanId)
      .map((movement) =>
        buildMovementKey(movement.loanId!, movement.amount, movement.createdAt)
      )
  );

  const existingExpenseKeys = new Set(
    cashMovements
      .filter((movement) => movement.type === "EXPENSE" && movement.loanId)
      .map((movement) =>
        buildMovementKey(movement.loanId!, movement.amount, movement.createdAt)
      )
  );

  const synthesizedPaymentMovements = legacyPayments
    .filter((payment) => {
      const key = buildMovementKey(payment.loanId, payment.amount, payment.paymentDate);
      return !existingIncomeKeys.has(key);
    })
    .map((payment) => ({
      id: `legacy-payment-${payment.id}`,
      type: "INCOME" as const,
      method: "UNKNOWN" as const,
      amount: payment.amount,
      description: "Pago de prestamo",
      loanId: payment.loanId,
      clientId: payment.loan.clientId,
      adminId: "",
      createdAt: payment.paymentDate,
      client: payment.loan.client,
      loan: {
        id: payment.loanId,
      },
      admin: null,
    }));

  const synthesizedLoanMovements = legacyLoans
    .filter((loan) => {
      const key = buildMovementKey(loan.id, loan.principalAmount, loan.createdAt);
      return !existingExpenseKeys.has(key);
    })
    .map((loan) => ({
      id: `legacy-loan-${loan.id}`,
      type: "EXPENSE" as const,
      method: "UNKNOWN" as const,
      amount: loan.principalAmount,
      description: "Prestamo otorgado",
      loanId: loan.id,
      clientId: loan.clientId,
      adminId: "",
      createdAt: loan.createdAt,
      client: loan.client,
      loan: {
        id: loan.id,
      },
      admin: null,
    }));

  return [...cashMovements, ...synthesizedPaymentMovements, ...synthesizedLoanMovements].sort(
    (firstMovement, secondMovement) =>
      new Date(secondMovement.createdAt).getTime() -
      new Date(firstMovement.createdAt).getTime()
  );
};

function buildMovementKey(loanId: string, amount: number, date: Date) {
  return `${loanId}:${roundMoney(amount)}:${date.toISOString().slice(0, 10)}`;
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function buildRangeFilter(filters: GetCashMovementsDto) {
  if (filters.day) {
    const startOfDay = new Date(`${filters.day}T00:00:00.000`);

    if (Number.isNaN(startOfDay.getTime())) {
      throw new Error("Invalid day");
    }

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return {
      gte: startOfDay,
      lt: endOfDay,
    };
  }

  if (filters.month) {
    const [yearPart, monthPart] = filters.month.split("-");
    const year = Number.parseInt(yearPart ?? "", 10);
    const month = Number.parseInt(monthPart ?? "", 10);

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error("Invalid month");
    }

    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const endOfMonth = new Date(Date.UTC(year, month, 1));

    return {
      gte: startOfMonth,
      lt: endOfMonth,
    };
  }

  if (filters.year) {
    const year = Number.parseInt(filters.year, 10);

    if (!Number.isInteger(year) || filters.year.length !== 4) {
      throw new Error("Invalid year");
    }

    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const endOfYear = new Date(Date.UTC(year + 1, 0, 1));

    return {
      gte: startOfYear,
      lt: endOfYear,
    };
  }

  return undefined;
}
