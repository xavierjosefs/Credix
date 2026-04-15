import { LoanStatus, PaymentFrequency, PaymentMethod } from "@prisma/client";

export interface CreateLoanDto {
  clientId: string;
  principalAmount: number;
  interestRate: number;
  frequency: PaymentFrequency;
  startDate: string;
  method: PaymentMethod;
}

export interface RegisterLoanPaymentDto {
  loanId: string;
  amount: number;
  paymentDate?: string;
  method: PaymentMethod;
}

export interface GetLoansDto {
  clientId?: string;
  status?: LoanStatus;
}
