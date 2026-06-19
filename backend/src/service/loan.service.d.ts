import type { CreateLoanDto, GetLoansDto, RegisterLoanPaymentDto } from "../dto/loan.dto.js";
export declare const createLoan: (data: CreateLoanDto, adminId: string) => Promise<any>;
export declare const getLoanById: (loanId: string) => Promise<{
    currentAccruedInterest: number;
    currentTotalDue: number;
    client: {
        name: string;
        email: string;
        id: string;
        cedula: string;
        createdAt: Date;
        address: string;
        birthDate: Date;
        phone: string;
        phone2: string | null;
        phoneCompany: string | null;
        clientNumber: string | null;
        devicePhone: string | null;
        collectionMethod: import("@prisma/client").$Enums.CollectionMethod | null;
        profileImage: string | null;
        institution: import("@prisma/client").$Enums.Institution;
    };
    payments: {
        id: string;
        amount: number;
        loanId: string;
        interestPaid: number;
        principalPaid: number;
        remainingBalance: number;
        daysCalculated: number;
        paymentDate: Date;
    }[];
    segments: {
        id: string;
        amount: number;
        loanId: string;
        createdAt: Date;
        startDate: Date;
    }[];
    installments: {
        number: number;
        id: string;
        amount: number;
        loanId: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.InstallmentStatus;
        dueDate: Date;
        interestPortion: number;
        principalPortion: number;
        paidAmount: number;
    }[];
    id: string;
    type: import("@prisma/client").$Enums.LoanType;
    clientId: string;
    createdAt: Date;
    remainingBalance: number;
    principalAmount: number;
    interestRate: number;
    frequency: import("@prisma/client").$Enums.PaymentFrequency;
    startDate: Date;
    lastPaymentDate: Date;
    nextDueDate: Date;
    status: import("@prisma/client").$Enums.LoanStatus;
}>;
export declare const getLoans: (filters: GetLoansDto) => Promise<any>;
export declare const registerLoanPayment: (data: RegisterLoanPaymentDto, adminId: string) => Promise<any>;
//# sourceMappingURL=loan.service.d.ts.map