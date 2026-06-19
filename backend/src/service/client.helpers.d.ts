import { Prisma } from "@prisma/client";
export declare const clientRelationsInclude: {
    bankAccounts: true;
    credentials: true;
};
export type ClientWithRelations = Prisma.ClientGetPayload<{
    include: typeof clientRelationsInclude;
}>;
export declare function buildClientSearchFilters({ cedula, name, email, }: {
    cedula?: string | undefined;
    name?: string | undefined;
    email?: string | undefined;
}): Prisma.ClientWhereInput[];
export declare function decryptClientCredentials<T extends {
    credentials?: {
        password: string;
    } | null;
}>(client: T): T;
export declare function decryptManyClientCredentials<T extends {
    credentials?: {
        password: string;
    } | null;
}>(clients: T[]): T[];
//# sourceMappingURL=client.helpers.d.ts.map