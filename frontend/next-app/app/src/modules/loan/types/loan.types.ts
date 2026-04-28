export type PaymentFrequency = "MONTHLY" | "BIWEEKLY";
export type PaymentMethod = "CASH" | "TRANSFER";
export type LoanType = "FLEXIBLE" | "INSTALLMENT";

export interface CreateLoanPayload {
  clientId: string;
  principalAmount: number;
  interestRate: number;
  type?: LoanType;
  installmentCount?: number;
  frequency: PaymentFrequency;
  startDate: string;
  method: PaymentMethod;
  existingLoanId?: string;
}

export interface CreateLoanResponse {
  message: string;
  data: {
    id: string;
    clientId: string;
    principalAmount: number;
    remainingBalance: number;
    interestRate: number;
    type: LoanType;
    frequency: PaymentFrequency;
    startDate: string;
    nextDueDate: string;
    status: string;
  };
}

export interface RegisterLoanPaymentPayload {
  amount: number;
  method: PaymentMethod;
  paymentDate?: string;
  interestDays?: number;
}

export interface RegisterLoanPaymentResponse {
  message: string;
  data: {
    payment: {
      id: string;
      amount: number;
      interestPaid: number;
      principalPaid: number;
      remainingBalance: number;
      daysCalculated: number;
      paymentDate: string;
      loanId: string;
    };
    loan: {
      id: string;
      remainingBalance: number;
      status: string;
      currentAccruedInterest: number;
      currentTotalDue: number;
    };
    breakdown: {
      accruedInterest: number;
      interestPaid: number;
      principalPaid: number;
      daysCalculated: number;
    };
  };
}
