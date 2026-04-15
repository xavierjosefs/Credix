import { getAuthToken } from "@/app/src/modules/auth/services/session.service";
import type {
  CreateLoanPayload,
  CreateLoanResponse,
  RegisterLoanPaymentPayload,
  RegisterLoanPaymentResponse,
} from "../types/loan.types";
import type { ClientLoanRecord } from "@/app/src/modules/client/types/client.types";

export async function createLoanService(
  data: CreateLoanPayload
): Promise<CreateLoanResponse> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const response = await fetch("http://localhost:8000/loan/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const payload = (await response.json()) as CreateLoanResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || payload.message || "No se pudo crear el prestamo.");
  }

  return payload;
}

export async function getLoansService(): Promise<ClientLoanRecord[]> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const response = await fetch("http://localhost:8000/loan", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = (await response.json()) as {
    message?: string;
    error?: string;
    data?: ClientLoanRecord[];
  };

  if (!response.ok || !payload.data) {
    throw new Error(payload.error || payload.message || "No se pudieron cargar los prestamos.");
  }

  return payload.data;
}

export async function getLoanByIdService(loanId: string): Promise<ClientLoanRecord> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const response = await fetch(`http://localhost:8000/loan/${loanId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = (await response.json()) as {
    message?: string;
    error?: string;
    data?: ClientLoanRecord;
  };

  if (!response.ok || !payload.data) {
    throw new Error(payload.error || payload.message || "No se pudo cargar el prestamo.");
  }

  return payload.data;
}

export async function registerLoanPaymentService(
  loanId: string,
  data: RegisterLoanPaymentPayload
): Promise<RegisterLoanPaymentResponse> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const response = await fetch(`http://localhost:8000/loan/${loanId}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const payload = (await response.json()) as RegisterLoanPaymentResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || payload.message || "No se pudo registrar el pago.");
  }

  return payload;
}
