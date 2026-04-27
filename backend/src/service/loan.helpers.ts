import {
  InstallmentStatus,
  LoanStatus,
  LoanType,
  PaymentFrequency,
  Prisma,
} from "@prisma/client";
import prisma from "../prisma/prisma.js";

export const loanRelationsInclude = {
  client: true,
  payments: {
    orderBy: {
      paymentDate: "desc",
    },
  },
  segments: {
    orderBy: {
      createdAt: "asc",
    },
  },
  installments: {
    orderBy: {
      number: "asc",
    },
  },
} satisfies Prisma.LoanInclude;

export type LoanWithRelations = Prisma.LoanGetPayload<{
  include: typeof loanRelationsInclude;
}>;

type SegmentBalance = {
  persistedId: string | null;
  amount: number;
  startDate: Date;
};

export function enrichLoan(loan: LoanWithRelations) {
  const accruedInterest =
    loan.type === LoanType.INSTALLMENT
      ? calculateRemainingInstallmentInterest(loan)
      : calculateLoanAccruedInterest(loan, new Date());

  return {
    ...loan,
    currentAccruedInterest: accruedInterest,
    currentTotalDue:
      loan.type === LoanType.INSTALLMENT
        ? roundMoney(loan.remainingBalance)
        : roundMoney(loan.remainingBalance + accruedInterest),
  };
}

export function getPeriodDays(frequency: PaymentFrequency) {
  return frequency === PaymentFrequency.MONTHLY ? 30 : 15;
}

export function calculateAccruedInterest({
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

export function calculateLoanAccruedInterest(
  loan: LoanWithRelations,
  effectiveDate: Date,
  interestDaysOverride?: number
) {
  if (loan.type === LoanType.INSTALLMENT) {
    return calculateRemainingInstallmentInterest(loan);
  }

  const segments = getInterestSegments(loan);

  if (segments.length === 0) {
    return calculateAccruedInterest({
      remainingBalance: loan.remainingBalance,
      interestRate: loan.interestRate,
      frequency: loan.frequency,
      daysElapsed:
        interestDaysOverride ?? diffInDays(loan.lastPaymentDate, effectiveDate),
    });
  }

  return roundMoney(
    segments.reduce((sum, segment) => {
      const accrualStart =
        segment.startDate > loan.lastPaymentDate ? segment.startDate : loan.lastPaymentDate;

      return (
        sum +
        calculateAccruedInterest({
          remainingBalance: segment.amount,
          interestRate: loan.interestRate,
          frequency: loan.frequency,
          daysElapsed: interestDaysOverride ?? diffInDays(accrualStart, effectiveDate),
        })
      );
    }, 0)
  );
}

export function calculateInstallmentSchedule({
  principalAmount,
  interestRate,
  installmentCount,
  frequency,
  startDate,
}: {
  principalAmount: number;
  interestRate: number;
  installmentCount: number;
  frequency: PaymentFrequency;
  startDate: Date;
}) {
  const totalInterest = roundMoney(principalAmount * (interestRate / 100) * installmentCount);
  const totalAmount = roundMoney(principalAmount + totalInterest);
  const baseInstallmentAmount = roundMoney(totalAmount / installmentCount);
  const basePrincipalPortion = roundMoney(principalAmount / installmentCount);
  const baseInterestPortion = roundMoney(totalInterest / installmentCount);
  const periodDays = getPeriodDays(frequency);

  const installments = Array.from({ length: installmentCount }, (_, index) => {
    const isLastInstallment = index === installmentCount - 1;
    const paidPrincipalBefore = roundMoney(basePrincipalPortion * index);
    const paidInterestBefore = roundMoney(baseInterestPortion * index);
    const principalPortion = isLastInstallment
      ? roundMoney(principalAmount - paidPrincipalBefore)
      : basePrincipalPortion;
    const interestPortion = isLastInstallment
      ? roundMoney(totalInterest - paidInterestBefore)
      : baseInterestPortion;
    const amount = roundMoney(principalPortion + interestPortion);

    return {
      number: index + 1,
      dueDate: addDays(startDate, periodDays * (index + 1)),
      amount,
      principalPortion,
      interestPortion,
    };
  });

  return {
    installments,
    totalInterest,
    totalAmount,
  };
}

export function applyPaymentToInstallments(
  loan: LoanWithRelations,
  paymentAmount: number
) {
  const updatedInstallments = loan.installments.map((installment) => ({ ...installment }));
  let remainingPayment = roundMoney(paymentAmount);
  let interestPaid = 0;
  let principalPaid = 0;

  for (const installment of updatedInstallments) {
    if (remainingPayment <= 0) {
      break;
    }

    if (installment.status === InstallmentStatus.PAID) {
      continue;
    }

    const remainingInstallmentAmount = roundMoney(installment.amount - installment.paidAmount);

    if (remainingInstallmentAmount <= 0) {
      installment.status = InstallmentStatus.PAID;
      continue;
    }

    const interestCoveredBefore = Math.min(installment.paidAmount, installment.interestPortion);
    const principalCoveredBefore = Math.max(
      roundMoney(installment.paidAmount - installment.interestPortion),
      0
    );
    const remainingInterestPortion = roundMoney(
      Math.max(installment.interestPortion - interestCoveredBefore, 0)
    );
    const remainingPrincipalPortion = roundMoney(
      Math.max(installment.principalPortion - principalCoveredBefore, 0)
    );

    const appliedToInstallment = Math.min(remainingPayment, remainingInstallmentAmount);
    const appliedToInterest = Math.min(appliedToInstallment, remainingInterestPortion);
    const appliedToPrincipal = roundMoney(
      Math.min(appliedToInstallment - appliedToInterest, remainingPrincipalPortion)
    );

    installment.paidAmount = roundMoney(installment.paidAmount + appliedToInstallment);
    remainingPayment = roundMoney(remainingPayment - appliedToInstallment);
    interestPaid = roundMoney(interestPaid + appliedToInterest);
    principalPaid = roundMoney(principalPaid + appliedToPrincipal);

    const remainingAfterPayment = roundMoney(installment.amount - installment.paidAmount);

    if (remainingAfterPayment <= 0) {
      installment.status = InstallmentStatus.PAID;
    } else if (installment.paidAmount > 0) {
      installment.status = InstallmentStatus.PARTIAL;
    } else {
      installment.status = InstallmentStatus.PENDING;
    }
  }

  const appliedAmount = roundMoney(paymentAmount - remainingPayment);

  return {
    installments: updatedInstallments,
    appliedAmount,
    interestPaid,
    principalPaid,
  };
}

export function calculateRemainingInstallmentInterest(loan: LoanWithRelations) {
  if (loan.installments.length === 0) {
    return 0;
  }

  return roundMoney(
    loan.installments.reduce((sum, installment) => {
      const interestCovered = Math.min(installment.paidAmount, installment.interestPortion);
      const remainingInterest = roundMoney(
        Math.max(installment.interestPortion - interestCovered, 0)
      );

      return sum + remainingInterest;
    }, 0)
  );
}

export function getNextPendingInstallmentDueDate(loan: LoanWithRelations) {
  const nextInstallment = loan.installments.find(
    (installment) => installment.status !== InstallmentStatus.PAID
  );

  return nextInstallment?.dueDate ?? null;
}

export function resolveInstallmentLoanStatus({
  remainingBalance,
  effectivePaymentDate,
  nextDueDate,
}: {
  remainingBalance: number;
  effectivePaymentDate: Date;
  nextDueDate: Date | null;
}) {
  if (remainingBalance === 0) {
    return LoanStatus.PAID;
  }

  if (nextDueDate && effectivePaymentDate > nextDueDate) {
    return LoanStatus.LATE;
  }

  return LoanStatus.ACTIVE;
}

export function getInterestSegments(loan: LoanWithRelations): SegmentBalance[] {
  const persistedSegments: SegmentBalance[] = loan.segments.map((segment) => ({
    persistedId: segment.id,
    amount: segment.amount,
    startDate: segment.startDate,
  }));

  const persistedTotal = roundMoney(
    persistedSegments.reduce((sum, segment) => sum + segment.amount, 0)
  );
  const missingBalance = roundMoney(Math.max(loan.remainingBalance - persistedTotal, 0));

  if (missingBalance > 0) {
    persistedSegments.unshift({
      persistedId: null,
      amount: missingBalance,
      startDate: loan.startDate,
    });
  }

  if (persistedSegments.length > 0) {
    return persistedSegments.map((segment) => ({
      persistedId: segment.persistedId,
      amount: segment.amount,
      startDate: segment.startDate,
    }));
  }

  if (loan.remainingBalance <= 0) {
    return [];
  }

  return [
    {
      persistedId: null,
      amount: loan.remainingBalance,
      startDate: loan.startDate,
    },
  ];
}

export function applyPrincipalPaymentToSegments(
  loan: LoanWithRelations,
  principalPaid: number
) {
  const segments = getInterestSegments(loan).map((segment) => ({ ...segment }));

  if (principalPaid <= 0 || segments.length === 0) {
    return segments;
  }

  let remainingPrincipalToApply = principalPaid;

  for (const segment of segments) {
    if (remainingPrincipalToApply <= 0) {
      break;
    }

    const amountApplied = Math.min(segment.amount, remainingPrincipalToApply);
    segment.amount = roundMoney(Math.max(segment.amount - amountApplied, 0));
    remainingPrincipalToApply = roundMoney(remainingPrincipalToApply - amountApplied);
  }

  return segments;
}

export function calculateNextDueDate(
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

export function diffInDays(startDate: Date, endDate: Date) {
  const diffMs = endDate.getTime() - startDate.getTime();

  if (diffMs <= 0) {
    return 0;
  }

  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

export function getLoanWithRelationsById(
  db: Prisma.TransactionClient | typeof prisma,
  loanId: string
) {
  return db.loan.findUniqueOrThrow({
    where: { id: loanId },
    include: loanRelationsInclude,
  });
}

export function resolveLoanStatus({
  remainingBalance,
  effectivePaymentDate,
  nextDueDate,
}: {
  remainingBalance: number;
  effectivePaymentDate: Date;
  nextDueDate: Date;
}) {
  if (remainingBalance === 0) {
    return LoanStatus.PAID;
  }

  return effectivePaymentDate > nextDueDate ? LoanStatus.LATE : LoanStatus.ACTIVE;
}
