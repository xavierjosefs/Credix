import {
  LoanStatus,
  LoanType,
  PaymentFrequency,
  Prisma,
} from '@prisma/client';
import prisma from '../prisma/prisma.js';
import { encrypt } from '../utils/encryption.js';
import type {
  ClientReportFiltersDto,
  CollectionMethod,
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
import {
  calculateLoanAccruedInterest,
  calculateRemainingInstallmentInterest,
  loanRelationsInclude,
  type LoanWithRelations,
  roundMoney,
} from './loan.helpers.js';

const validInstitutions: Institution[] = [
  'POLICIA',
  'PENSIONADO',
  'EDUCACION',
  'MEDICO',
  'GUARDIA',
  'PARTICULAR',
];

const validCredentialBanks: CredentialBank[] = [
  'BANRESERVAS',
  'POPULAR',
  'BHD',
  'CARIBE',
];

const validCollectionMethods: CollectionMethod[] = [
  'CAJERO',
  'DEPOSITO',
  'EFECTIVO',
  'TRANSFERENCIA',
];

const validPaymentFrequencies: PaymentFrequency[] = ['MONTHLY', 'BIWEEKLY'];

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
    clientNumber,
    devicePhone,
    collectionMethod,
    profileImage,
    institution,
    credentials,
    bankAccounts,
  } = data;

  if (!institution || !validInstitutions.includes(institution)) {
    throw new Error('Invalid institution');
  }

  if (!credentials.bank || !validCredentialBanks.includes(credentials.bank)) {
    throw new Error('Invalid credential bank');
  }

  if (collectionMethod && !validCollectionMethods.includes(collectionMethod)) {
    throw new Error('Invalid collection method');
  }

  const existing = await prisma.client.findFirst({
    where: {
      OR: [{ cedula }, { email }, ...(clientNumber ? [{ clientNumber }] : [])],
    },
  });

  if (existing) {
    throw new Error('Client already exists');
  }

  if (!isValidPhone(phone)) {
    throw new Error('Invalid phone format (expected XXX-XXX-XXXX)');
  }

  if (phone2 && !isValidPhone(phone2)) {
    throw new Error('Invalid secondary phone format');
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
        ...(clientNumber && { clientNumber }),
        ...(devicePhone && { devicePhone }),
        ...(collectionMethod && { collectionMethod }),
        ...(profileImage && { profileImage }),
        institution,
      },
    });

    await tx.bankCredential.create({
      data: {
        bank: credentials.bank,
        username: credentials.username,
        password: encrypt(credentials.password),
        clientId: newClient.id,
      },
    });

    for (const account of bankAccounts) {
      await tx.bankAccount.create({
        data: {
          bankName: account.bankName,
          accountNumber: account.accountNumber,
          accountType: account.accountType,
          clientId: newClient.id,
        },
      });
    }

    return newClient;
  });

  return result;
};

export const getClient = async (data: GetClientDto) => {
  const { cedula, name, email } = data;
  const orConditions = buildClientSearchFilters({ cedula, name, email });

  if (orConditions.length === 0) {
    throw new Error('At least one filter is required');
  }

  const client = await prisma.client.findFirst({
    where: { OR: orConditions },
    include: clientRelationsInclude,
  });

  if (!client) {
    throw new Error('Client not found');
  }

  return decryptClientCredentials(client);
};

export const getClientById = async (id: string) => {
  const client = await prisma.client.findUnique({
    where: { id },
    include: clientRelationsInclude,
  });

  if (!client) {
    throw new Error('Client not found');
  }

  return decryptClientCredentials(client);
};

export const getAllClients = async (data?: GetClientDto) => {
  const { cedula, name, email } = data ?? {};
  const orConditions = buildClientSearchFilters({ cedula, name, email });

  const resultClients: ClientWithRelations[] =
    orConditions.length > 0
      ? await prisma.client.findMany({
          where: {
            OR: orConditions,
          },
          include: clientRelationsInclude,
          orderBy: {
            name: 'asc',
          },
        })
      : await prisma.client.findMany({
          include: clientRelationsInclude,
          orderBy: {
            name: 'asc',
          },
        });

  return decryptManyClientCredentials(resultClients);
};

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
    clientNumber,
    devicePhone,
    collectionMethod,
    profileImage,
    institution,
    credentials,
    bankAccounts,
  } = data;

  const existingClient = await prisma.client.findUnique({
    where: { id },
    include: clientRelationsInclude,
  });

  if (!existingClient) {
    throw new Error('Client not found');
  }

  const conflictingClient = await prisma.client.findFirst({
    where: {
      id: { not: id },
      OR: [{ cedula }, { email }, ...(clientNumber ? [{ clientNumber }] : [])],
    },
  });

  if (conflictingClient) {
    throw new Error('Client already exists');
  }

  if (!isValidPhone(phone)) {
    throw new Error('Invalid phone format (expected XXX-XXX-XXXX)');
  }

  if (phone2 && !isValidPhone(phone2)) {
    throw new Error('Invalid secondary phone format');
  }

  if (!institution || !validInstitutions.includes(institution)) {
    throw new Error('Invalid institution');
  }

  if (!credentials.bank || !validCredentialBanks.includes(credentials.bank)) {
    throw new Error('Invalid credential bank');
  }

  if (collectionMethod && !validCollectionMethods.includes(collectionMethod)) {
    throw new Error('Invalid collection method');
  }

  const parsedBirthDate = new Date(birthDate);

  if (Number.isNaN(parsedBirthDate.getTime())) {
    throw new Error('Invalid birth date');
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
        clientNumber: clientNumber || null,
        devicePhone: devicePhone || null,
        collectionMethod: collectionMethod || null,
        institution,
        ...(profileImage !== undefined
          ? {
              profileImage: profileImage || null,
            }
          : {}),
      },
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
      },
    });

    await tx.bankAccount.deleteMany({
      where: { clientId: id },
    });

    if (bankAccounts.length > 0) {
      await tx.bankAccount.createMany({
        data: bankAccounts.map((account) => ({
          bankName: account.bankName,
          accountNumber: account.accountNumber,
          accountType: account.accountType,
          clientId: id,
        })),
      });
    }

    return updatedClient;
  });

  const updatedWithRelations = await prisma.client.findUnique({
    where: { id: result.id },
    include: clientRelationsInclude,
  });

  if (!updatedWithRelations) {
    throw new Error('Client not found');
  }

  return decryptClientCredentials(updatedWithRelations);
};

export const getClientCollectionReport = async (filters: ClientReportFiltersDto) => {
  const { frequency, collectionMethod, institution } = filters;

  if (frequency && !validPaymentFrequencies.includes(frequency)) {
    throw new Error('Invalid frequency');
  }

  if (collectionMethod && !validCollectionMethods.includes(collectionMethod)) {
    throw new Error('Invalid collection method');
  }

  if (institution && !validInstitutions.includes(institution)) {
    throw new Error('Invalid institution');
  }

  const loans = await prisma.loan.findMany({
    where: {
      status: {
        not: LoanStatus.PAID,
      },
      ...(frequency ? { frequency } : {}),
      client: {
        ...(collectionMethod ? { collectionMethod } : {}),
        ...(institution ? { institution } : {}),
      },
    },
    include: loanRelationsInclude,
    orderBy: [
      {
        client: {
          name: 'asc',
        },
      },
      {
        createdAt: 'asc',
      },
    ],
  });

  const rowsByClient = new Map<
    string,
    {
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
    }
  >();

  for (const loan of loans) {
    const capitalPending = getLoanPendingPrincipal(loan);
    const interestPending = getLoanPendingInterest(loan);
    const existingRow = rowsByClient.get(loan.clientId);

    if (!existingRow) {
      rowsByClient.set(loan.clientId, {
        clientId: loan.clientId,
        clientNumber: loan.client.clientNumber?.trim() || 'Sin numero',
        clientName: loan.client.name,
        activeLoansCount: loan.status === LoanStatus.ACTIVE ? 1 : 0,
        lateLoansCount: loan.status === LoanStatus.LATE ? 1 : 0,
        totalLoansCount: 1,
        capitalPending,
        interestPending,
        totalDue: roundMoney(capitalPending + interestPending),
        nextDueDate: loan.status === LoanStatus.PAID ? null : loan.nextDueDate,
        collectionMethod: loan.client.collectionMethod ?? null,
        institution: loan.client.institution,
        frequencies: [loan.frequency],
      });
      continue;
    }

    existingRow.activeLoansCount += loan.status === LoanStatus.ACTIVE ? 1 : 0;
    existingRow.lateLoansCount += loan.status === LoanStatus.LATE ? 1 : 0;
    existingRow.totalLoansCount += 1;
    existingRow.capitalPending = roundMoney(existingRow.capitalPending + capitalPending);
    existingRow.interestPending = roundMoney(existingRow.interestPending + interestPending);
    existingRow.totalDue = roundMoney(existingRow.capitalPending + existingRow.interestPending);

    if (loan.status !== LoanStatus.PAID) {
      if (!existingRow.nextDueDate || loan.nextDueDate < existingRow.nextDueDate) {
        existingRow.nextDueDate = loan.nextDueDate;
      }
    }

    if (!existingRow.frequencies.includes(loan.frequency)) {
      existingRow.frequencies.push(loan.frequency);
    }
  }

  const rows = Array.from(rowsByClient.values()).sort((first, second) =>
    first.clientName.localeCompare(second.clientName, 'es')
  );

  return {
    filters: {
      frequency: frequency ?? null,
      collectionMethod: collectionMethod ?? null,
      institution: institution ?? null,
    },
    summary: {
      clientsCount: rows.length,
      totalCapitalPending: roundMoney(rows.reduce((sum, row) => sum + row.capitalPending, 0)),
      totalInterestPending: roundMoney(rows.reduce((sum, row) => sum + row.interestPending, 0)),
    },
    data: rows,
  };
};

function getLoanPendingPrincipal(loan: LoanWithRelations) {
  if (loan.type === LoanType.INSTALLMENT) {
    return roundMoney(
      loan.installments.reduce((sum, installment) => {
        const principalCoveredBefore = Math.max(
          roundMoney(installment.paidAmount - installment.interestPortion),
          0
        );
        const remainingPrincipal = roundMoney(
          Math.max(installment.principalPortion - principalCoveredBefore, 0)
        );

        return sum + remainingPrincipal;
      }, 0)
    );
  }

  return roundMoney(loan.remainingBalance);
}

function getLoanPendingInterest(loan: LoanWithRelations) {
  if (loan.type === LoanType.INSTALLMENT) {
    return calculateRemainingInstallmentInterest(loan);
  }

  return calculateLoanAccruedInterest(loan, new Date());
}
