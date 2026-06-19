import { Prisma } from "@prisma/client";
import { decrypt } from "../utils/encryption.js";
export const clientRelationsInclude = {
    bankAccounts: true,
    credentials: true,
};
export function buildClientSearchFilters({ cedula, name, email, }) {
    const orConditions = [];
    if (cedula) {
        orConditions.push({ cedula });
    }
    if (email) {
        orConditions.push({ email });
    }
    if (name) {
        orConditions.push({
            name: {
                contains: name,
                mode: "insensitive",
            },
        });
    }
    return orConditions;
}
export function decryptClientCredentials(client) {
    if (client.credentials) {
        client.credentials.password = decrypt(client.credentials.password);
    }
    return client;
}
export function decryptManyClientCredentials(clients) {
    for (const client of clients) {
        decryptClientCredentials(client);
    }
    return clients;
}
//# sourceMappingURL=client.helpers.js.map