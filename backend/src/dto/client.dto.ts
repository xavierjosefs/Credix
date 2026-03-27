export interface CreateClientDto {
  name: string
  cedula: string
  address: string
  birthDate: string

  email: string
  phone: string
  phone2?: string

  profileImage?: string

  // 🔐 ahora es único
  credentials: {
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