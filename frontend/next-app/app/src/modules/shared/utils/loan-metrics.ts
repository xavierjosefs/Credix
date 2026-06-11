import type { ClientLoanRecord } from "@/app/src/modules/client/types/client.types";

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function getRemainingInstallmentPrincipal(loan: ClientLoanRecord) {
  if (loan.type !== "INSTALLMENT") {
    return loan.remainingBalance;
  }

  return roundMoney(
    (loan.installments ?? []).reduce((sum, installment) => {
      const principalCoveredBefore = Math.max(
        roundMoney(installment.paidAmount - installment.interestPortion),
        0
      );
      const remainingPrincipal = Math.max(
        installment.principalPortion - principalCoveredBefore,
        0
      );

      return sum + remainingPrincipal;
    }, 0)
  );
}

function getRemainingInstallmentInterest(loan: ClientLoanRecord) {
  if (loan.type !== "INSTALLMENT") {
    return loan.currentAccruedInterest;
  }

  return roundMoney(
    (loan.installments ?? []).reduce((sum, installment) => {
      const interestCoveredBefore = Math.min(
        installment.paidAmount,
        installment.interestPortion
      );
      const remainingInterest = Math.max(
        installment.interestPortion - interestCoveredBefore,
        0
      );

      return sum + remainingInterest;
    }, 0)
  );
}

export function getLoanPortfolioBreakdown(loan: ClientLoanRecord) {
  const pendingPrincipal =
    loan.type === "INSTALLMENT"
      ? getRemainingInstallmentPrincipal(loan)
      : roundMoney(loan.remainingBalance);
  const pendingInterest =
    loan.type === "INSTALLMENT"
      ? getRemainingInstallmentInterest(loan)
      : roundMoney(loan.currentAccruedInterest);

  return {
    pendingPrincipal,
    pendingInterest,
    totalDue: roundMoney(pendingPrincipal + pendingInterest),
  };
}

