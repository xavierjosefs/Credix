export type Institution =
  | "POLICIA"
  | "PENSIONADO"
  | "EDUCACION"
  | "MEDICO"
  | "GUARDIA"
  | "PARTICULAR";

export type CredentialBank = "BANRESERVAS" | "POPULAR" | "BHD" | "CARIBE";

export interface CreateClientDto {
  name: string
  cedula: string
  address: string
  birthDate: string

  email: string
  phone: string
  phone2?: string
  phoneCompany?: string

  profileImage?: string
  institution: Institution
  credentials: {
    bank: CredentialBank
    username: string
    password: string
  }

  bankAccounts: {
    bankName: string
    accountNumber: string
    accountType: string
  }[]
}
export interface GetClientDto {
  cedula?: string
  name?: string
  email?: string
}

export interface UpdateClientDto {
  name: string
  cedula: string
  address: string
  birthDate: string
  email: string
  phone: string
  phone2?: string
  phoneCompany?: string
  profileImage?: string
  institution: Institution
  credentials: {
    bank: CredentialBank
    username: string
    password: string
  }
  bankAccounts: {
    bankName: string
    accountNumber: string
    accountType: string
  }[]
}
