import { PaymentFrequency, Prisma } from "@prisma/client";
import prisma from "../prisma/prisma.js";
export declare const loanRelationsInclude: {
    client: true;
    payments: {
        orderBy: {
            paymentDate: "desc";
        };
    };
    segments: {
        orderBy: {
            createdAt: "asc";
        };
    };
    installments: {
        orderBy: {
            number: "asc";
        };
    };
};
export type LoanWithRelations = Prisma.LoanGetPayload<{
    include: typeof loanRelationsInclude;
}>;
type SegmentBalance = {
    persistedId: string | null;
    amount: number;
    startDate: Date;
};
export declare function enrichLoan(loan: LoanWithRelations): {
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
};
export declare function getPeriodDays(frequency: PaymentFrequency): 30 | 15;
export declare function calculateAccruedInterest({ remainingBalance, interestRate, frequency, daysElapsed, }: {
    remainingBalance: number;
    interestRate: number;
    frequency: PaymentFrequency;
    daysElapsed: number;
}): number;
export declare function calculateLoanAccruedInterest(loan: LoanWithRelations, effectiveDate: Date, interestDaysOverride?: number): number;
export declare function calculateInstallmentSchedule({ principalAmount, interestRate, installmentCount, frequency, startDate, }: {
    principalAmount: number;
    interestRate: number;
    installmentCount: number;
    frequency: PaymentFrequency;
    startDate: Date;
}): {
    installments: {
        number: number;
        dueDate: Date;
        amount: number;
        principalPortion: number;
        interestPortion: number;
    }[];
    totalInterest: number;
    totalAmount: number;
};
export declare function applyPaymentToInstallments(loan: LoanWithRelations, paymentAmount: number): {
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
    appliedAmount: number;
    interestPaid: number;
    principalPaid: number;
};
export declare function calculateRemainingInstallmentInterest(loan: LoanWithRelations): number;
export declare function getNextPendingInstallmentDueDate(loan: LoanWithRelations): Date | null;
export declare function resolveInstallmentLoanStatus({ remainingBalance, effectivePaymentDate, nextDueDate, }: {
    remainingBalance: number;
    effectivePaymentDate: Date;
    nextDueDate: Date | null;
}): "ACTIVE" | "PAID" | "LATE";
export declare function getInterestSegments(loan: LoanWithRelations): SegmentBalance[];
export declare function applyPrincipalPaymentToSegments(loan: LoanWithRelations, principalPaid: number): {
    persistedId: string | null;
    amount: number;
    startDate: Date;
}[];
export declare function calculateNextDueDate(currentDueDate: Date, paymentDate: Date, frequency: PaymentFrequency): Date;
export declare function diffInDays(startDate: Date, endDate: Date): number;
export declare function addDays(date: Date, days: number): Date;
export declare function roundMoney(value: number): number;
export declare function getLoanWithRelationsById(db: Prisma.TransactionClient | typeof prisma, loanId: string): any;
export declare function resolveLoanStatus({ remainingBalance, effectivePaymentDate, nextDueDate, }: {
    remainingBalance: number;
    effectivePaymentDate: Date;
    nextDueDate: Date;
}): "ACTIVE" | "PAID" | "LATE";
export {};
//# sourceMappingURL=loan.helpers.d.ts.map