export interface ClientBankAccountInput {
  bankName: string;
  accountType: string;
  accountNumber: string;
}

export type ClientInstitution =
  | "POLICIA"
  | "PENSIONADO"
  | "EDUCACION"
  | "MEDICO"
  | "GUARDIA"
  | "PARTICULAR";

export type ClientCredentialBank = "BANRESERVAS" | "POPULAR" | "BHD" | "CARIBE";

export interface CreateClientPayload {
  name: string;
  cedula: string;
  address: string;
  birthDate: string;
  email: string;
  phone: string;
  phone2?: string;
  phoneCompany?: string;
  institution: ClientInstitution;
  credentials: {
    bank: ClientCredentialBank;
    username: string;
    password: string;
  };
  bankAccounts: ClientBankAccountInput[];
  profileImageFile?: File | null;
}

export interface UpdateClientPayload {
  name: string;
  cedula: string;
  address: string;
  birthDate: string;
  email: string;
  phone: string;
  phone2?: string;
  phoneCompany?: string;
  institution: ClientInstitution;
  credentials: {
    bank: ClientCredentialBank;
    username: string;
    password: string;
  };
  bankAccounts: ClientBankAccountInput[];
  profileImage?: string;
  profileImageFile?: File | null;
}

export interface CreateClientResponse {
  message: string;
  data: {
    id: string;
    name: string;
    cedula: string;
    email: string;
    createdAt: string;
  };
}

export interface ClientBankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  createdAt?: string;
}

export interface ClientCredentials {
  id: string;
  bank: ClientCredentialBank;
  username: string;
  password: string;
}

export interface ClientRecord {
  id: string;
  name: string;
  cedula: string;
  address: string;
  birthDate: string;
  email: string;
  phone: string;
  phone2?: string | null;
  phoneCompany?: string | null;
  profileImage?: string | null;
  institution: ClientInstitution;
  createdAt: string;
  bankAccounts: ClientBankAccount[];
  credentials?: ClientCredentials | null;
}

export interface GetClientsResponse {
  message: string;
  data: ClientRecord[];
}

export type LoanFrequency = "MONTHLY" | "BIWEEKLY";
export type LoanStatus = "ACTIVE" | "LATE" | "PAID";
export type LoanType = "FLEXIBLE" | "INSTALLMENT";

export interface LoanPaymentRecord {
  id: string;
  amount: number;
  interestPaid: number;
  principalPaid: number;
  remainingBalance: number;
  daysCalculated: number;
  paymentDate: string;
  loanId: string;
}

export interface LoanSegmentRecord {
  id: string;
  amount: number;
  startDate: string;
}

export interface LoanInstallmentRecord {
  id: string;
  number: number;
  dueDate: string;
  amount: number;
  interestPortion: number;
  principalPortion: number;
  paidAmount: number;
  status: "PENDING" | "PARTIAL" | "PAID";
}

export interface ClientLoanRecord {
  id: string;
  clientId: string;
  principalAmount: number;
  remainingBalance: number;
  interestRate: number;
  type: LoanType;
  frequency: LoanFrequency;
  startDate: string;
  lastPaymentDate: string;
  nextDueDate: string;
  status: LoanStatus;
  createdAt: string;
  currentAccruedInterest: number;
  currentTotalDue: number;
  payments: LoanPaymentRecord[];
  segments: LoanSegmentRecord[];
  installments: LoanInstallmentRecord[];
  client?: {
    id: string;
    name: string;
    cedula: string;
    address: string;
    email: string;
  };
}
