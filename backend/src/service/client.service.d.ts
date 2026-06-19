import { PaymentFrequency } from '@prisma/client';
import type { ClientReportFiltersDto, CollectionMethod, CreateClientDto, GetClientDto, Institution, UpdateClientDto } from '../dto/client.dto.js';
export declare const createClient: (data: CreateClientDto) => Promise<any>;
export declare const getClient: (data: GetClientDto) => Promise<any>;
export declare const getClientById: (id: string) => Promise<any>;
export declare const getAllClients: (data?: GetClientDto) => Promise<({
    bankAccounts: {
        id: string;
        clientId: string;
        createdAt: Date;
        bankName: string;
        accountNumber: string;
        accountType: string;
    }[];
    credentials: {
        password: string;
        id: string;
        clientId: string;
        bank: import("@prisma/client").$Enums.CredentialBank;
        username: string;
    } | null;
} & {
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
})[]>;
export declare const updateClient: (id: string, data: UpdateClientDto) => Promise<any>;
export declare const getClientCollectionReport: (filters: ClientReportFiltersDto) => Promise<{
    filters: {
        frequency: "MONTHLY" | "BIWEEKLY" | null;
        collectionMethod: CollectionMethod | null;
        institution: Institution | null;
    };
    summary: {
        clientsCount: number;
        totalCapitalPending: number;
        totalInterestPending: number;
    };
    data: {
        clientId: string;
        clientNumber: string;
        clientName: string;
        activeLoansCount: number;
        lateLoansCount: number;
        totalLoansCount: number;
        capitalPending: number;
        interestPending: number;
        totalDue: number;
        nextDueDate: Date | null;
        collectionMethod: CollectionMethod | null;
        institution: Institution;
        frequencies: PaymentFrequency[];
    }[];
}>;
//# sourceMappingURL=client.service.d.ts.map