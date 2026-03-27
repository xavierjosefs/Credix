import prisma from '../prisma/prisma.js';
import { encrypt } from '../utils/encryption.js';
import type { CreateClientDto, GetClientDto } from '../dto/client.dto.js';
import { isValidPhone } from '../utils/validators/phone.js';
import { decrypt } from '../utils/encryption.js';
import { Prisma } from '@prisma/client';

type ClientWithRelations = Prisma.ClientGetPayload<{
  include: {
    bankAccounts: true
    credentials: true
  }
}>

export const createClient = async (data: CreateClientDto) => {
    const {
        name,
        cedula,
        address,
        birthDate,
        email,
        phone,
        phone2,
        profileImage,
        credentials,
        bankAccounts,
    } = data;

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
                ...(profileImage && { profileImage }),
            }
            });

        //crear credenciales
        await tx.bankCredential.create({
            data: {
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
    const orConditions = [];

    if (cedula) orConditions.push({ cedula });
    if (email) orConditions.push({ email });
    if (name) orConditions.push({ name });

    if (orConditions.length === 0) {
        throw new Error("At least one filter is required");
    }

    const client = await prisma.client.findFirst({
        where: { OR: orConditions },
        include: { bankAccounts: true, credentials: true }
    });

    if (!client) {
        throw new Error("Client not found");
    }

    if (client.credentials) {
        client.credentials.password = decrypt(client.credentials.password);
    }

    return client;
}

export const getAllClients = async() => {
    const clients = await prisma.client.findMany({
        include: {
            bankAccounts: true,
            credentials: true
        },
        orderBy: {
            createdAt: "desc"
        }
    });

     //desenccriptar credenciales
    for (const client of clients){
        if(client.credentials) {
            client.credentials.password = decrypt(client.credentials.password);
        }
    }
    return clients;
}