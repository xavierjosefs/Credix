export type CashMovementType = "INCOME" | "EXPENSE";
export type PaymentMethod = "CASH" | "TRANSFER" | "UNKNOWN";

export interface CashMovementRecord {
  id: string;
  type: CashMovementType;
  method: PaymentMethod;
  amount: number;
  description?: string | null;
  loanId?: string | null;
  clientId?: string | null;
  adminId: string;
  createdAt: string;
  client?: {
    id: string;
    name: string;
    cedula: string;
  } | null;
  loan?: {
    id: string;
  } | null;
  admin?: {
    id: string;
    name: string;
  } | null;
}
