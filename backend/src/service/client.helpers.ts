import { Prisma } from "@prisma/client";
import { decrypt } from "../utils/encryption.js";

export const clientRelationsInclude = {
  bankAccounts: true,
  credentials: true,
} satisfies Prisma.ClientInclude;

export type ClientWithRelations = Prisma.ClientGetPayload<{
  include: typeof clientRelationsInclude;
}>;

export function buildClientSearchFilters({
  cedula,
  name,
  email,
}: {
  cedula?: string | undefined;
  name?: string | undefined;
  email?: string | undefined;
}) {
  const orConditions: Prisma.ClientWhereInput[] = [];

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

export function decryptClientCredentials<T extends { credentials?: { password: string } | null }>(
  client: T
) {
  if (client.credentials) {
    client.credentials.password = decrypt(client.credentials.password);
  }

  return client;
}

export function decryptManyClientCredentials<T extends { credentials?: { password: string } | null }>(
  clients: T[]
) {
  for (const client of clients) {
    decryptClientCredentials(client);
  }

  return clients;
}
