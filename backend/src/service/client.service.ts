import prisma from '../prisma/prisma.js';
import { encrypt } from '../utils/encryption.js';
import type {
    CreateClientDto,
    CredentialBank,
    GetClientDto,
    Institution,
    UpdateClientDto,
} from '../dto/client.dto.js';
import { isValidPhone } from '../utils/validators/phone.js';
import {
  buildClientSearchFilters,
  clientRelationsInclude,
  decryptClientCredentials,
  decryptManyClientCredentials,
  type ClientWithRelations,
} from './client.helpers.js';

const validInstitutions: Institution[] = [
    "POLICIA",
    "PENSIONADO",
    "EDUCACION",
    "MEDICO",
    "GUARDIA",
    "PARTICULAR",
];

const validCredentialBanks: CredentialBank[] = [
    "BANRESERVAS",
    "POPULAR",
    "BHD",
    "CARIBE",
];

export const createClient = async (data: CreateClientDto) => {
    const {
        name,
        cedula,
        address,
        birthDate,
        email,
        phone,
        phone2,
        phoneCompany,
        profileImage,
        institution,
        credentials,
        bankAccounts,
    } = data;

    if (!institution || !validInstitutions.includes(institution)) {
        throw new Error("Invalid institution");
    }

    if (!credentials.bank || !validCredentialBanks.includes(credentials.bank)) {
        throw new Error("Invalid credential bank");
    }

    //validar si existe el cliente con la cedula o correo
    const existing = await prisma.client.findFirst({
        where : {
            OR: [
                { cedula },
                { email }
            ]
        }
    });

    if (existing) {
        throw new Error("Client already exists");
    }

    if (!isValidPhone(phone)) {
    throw new Error("Invalid phone format (expected XXX-XXX-XXXX)")
    }

    if (phone2 && !isValidPhone(phone2)) {
    throw new Error("Invalid secondary phone format")
    }

    //transaccion para crear el cliente y sus cuentas bancarias
    const result = await prisma.$transaction(async (tx) => {

        //crear cliente
        const newClient = await tx.client.create({
            data: {
                name,
                cedula,
                address,
                birthDate: new Date(birthDate),
                email,
                phone,
                ...(phone2 && { phone2 }),
                ...(phoneCompany && { phoneCompany }),
                ...(profileImage && { profileImage }),
                institution,
            }
            });

        //crear credenciales
        await tx.bankCredential.create({
            data: {
                bank: credentials.bank,
                username: credentials.username,
                password: encrypt(credentials.password),
                clientId: newClient.id
            }
        });

        //crear cuentas bancarias
        for (const account of bankAccounts) {
            await tx.bankAccount.create({
                data: {
                    bankName: account.bankName,
                    accountNumber: account.accountNumber,
                    accountType: account.accountType,
                    clientId: newClient.id
                }
            })
        }
        return newClient;
    })
    return result;
}

export const getClient = async (data: GetClientDto) => {
    const { cedula, name, email } = data;
    const orConditions = buildClientSearchFilters({ cedula, name, email });

    if (orConditions.length === 0) {
        throw new Error("At least one filter is required");
    }

    const client = await prisma.client.findFirst({
        where: { OR: orConditions },
        include: clientRelationsInclude
    });

    if (!client) {
        throw new Error("Client not found");
    }

    return decryptClientCredentials(client);
}

export const getClientById = async (id: string) => {
    const client = await prisma.client.findUnique({
        where: { id },
        include: clientRelationsInclude
    });

    if (!client) {
        throw new Error("Client not found");
    }

    return decryptClientCredentials(client);
}

export const getAllClients = async(data?: GetClientDto) => {
    const { cedula, name, email } = data ?? {};
    const orConditions = buildClientSearchFilters({ cedula, name, email });

    const clients: ClientWithRelations[] =
        orConditions.length > 0
            ? await prisma.client.findMany({
                where: {
                    OR: orConditions
                },
                include: clientRelationsInclude,
                orderBy: {
                    createdAt: "desc"
                }
            })
            : await prisma.client.findMany({
                include: clientRelationsInclude,
                orderBy: {
                    createdAt: "desc"
                }
            });

    return decryptManyClientCredentials(clients);
}

export const updateClient = async (id: string, data: UpdateClientDto) => {
    const {
        name,
        cedula,
        address,
        birthDate,
        email,
        phone,
        phone2,
        phoneCompany,
        profileImage,
        institution,
        credentials,
        bankAccounts,
    } = data;

    const existingClient = await prisma.client.findUnique({
        where: { id },
        include: clientRelationsInclude
    });

    if (!existingClient) {
        throw new Error("Client not found");
    }

    const conflictingClient = await prisma.client.findFirst({
        where: {
            id: { not: id },
            OR: [
                { cedula },
                { email }
            ]
        }
    });

    if (conflictingClient) {
        throw new Error("Client already exists");
    }

    if (!isValidPhone(phone)) {
        throw new Error("Invalid phone format (expected XXX-XXX-XXXX)");
    }

    if (phone2 && !isValidPhone(phone2)) {
        throw new Error("Invalid secondary phone format");
    }

    if (!institution || !validInstitutions.includes(institution)) {
        throw new Error("Invalid institution");
    }

    if (!credentials.bank || !validCredentialBanks.includes(credentials.bank)) {
        throw new Error("Invalid credential bank");
    }

    const parsedBirthDate = new Date(birthDate);

    if (Number.isNaN(parsedBirthDate.getTime())) {
        throw new Error("Invalid birth date");
    }

    const result = await prisma.$transaction(async (tx) => {
        const updatedClient = await tx.client.update({
            where: { id },
            data: {
                name,
                cedula,
                address,
                birthDate: parsedBirthDate,
                email,
                phone,
                phone2: phone2 || null,
                phoneCompany: phoneCompany || null,
                institution,
                ...(profileImage !== undefined
                    ? {
                        profileImage: profileImage || null,
                    }
                    : {}),
            }
        });

        await tx.bankCredential.upsert({
            where: { clientId: id },
            update: {
                bank: credentials.bank,
                username: credentials.username,
                password: encrypt(credentials.password),
            },
            create: {
                bank: credentials.bank,
                username: credentials.username,
                password: encrypt(credentials.password),
                clientId: id,
            }
        });

        await tx.bankAccount.deleteMany({
            where: { clientId: id }
        });

        if (bankAccounts.length > 0) {
            await tx.bankAccount.createMany({
                data: bankAccounts.map((account) => ({
                    bankName: account.bankName,
                    accountNumber: account.accountNumber,
                    accountType: account.accountType,
                    clientId: id,
                }))
            });
        }

        return updatedClient;
    });

    const updatedWithRelations = await prisma.client.findUnique({
        where: { id: result.id },
        include: clientRelationsInclude
    });

    if (!updatedWithRelations) {
        throw new Error("Client not found");
    }

    return decryptClientCredentials(updatedWithRelations);
}
