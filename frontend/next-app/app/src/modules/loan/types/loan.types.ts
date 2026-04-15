export type PaymentFrequency = "MONTHLY" | "BIWEEKLY";
export type PaymentMethod = "CASH" | "TRANSFER";

export interface CreateLoanPayload {
  clientId: string;
  principalAmount: number;
  interestRate: number;
  frequency: PaymentFrequency;
  startDate: string;
  method: PaymentMethod;
}

export interface CreateLoanResponse {
  message: string;
  data: {
    id: string;
    clientId: string;
    principalAmount: number;
    remainingBalance: number;
    interestRate: number;
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
