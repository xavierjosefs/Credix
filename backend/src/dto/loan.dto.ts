import { LoanStatus, LoanType, PaymentFrequency, PaymentMethod } from "@prisma/client";

export interface CreateLoanDto {
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

export interface RegisterLoanPaymentDto {
  loanId: string;
  amount: number;
  paymentDate?: string;
  method: PaymentMethod;
  interestDays?: number;
}

export interface GetLoansDto {
  clientId?: string;
  status?: LoanStatus;
}
