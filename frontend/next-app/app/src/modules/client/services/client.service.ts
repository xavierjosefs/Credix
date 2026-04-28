import { getAuthToken } from "@/app/src/modules/auth/services/session.service";
import { buildApiUrl } from "@/app/src/modules/shared/config/api";
import type {
  ClientLoanRecord,
  ClientRecord,
  CreateClientPayload,
  CreateClientResponse,
  GetClientsResponse,
  UpdateClientPayload,
} from "../types/client.types";

export async function createClientService(
  data: CreateClientPayload
): Promise<CreateClientResponse> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const formData = new FormData();
  formData.set("name", data.name);
  formData.set("cedula", data.cedula);
  formData.set("address", data.address);
  formData.set("birthDate", data.birthDate);
  formData.set("email", data.email);
  formData.set("phone", data.phone);
  formData.set("institution", data.institution);

  if (data.phone2) {
    formData.set("phone2", data.phone2);
  }

  if (data.phoneCompany) {
    formData.set("phoneCompany", data.phoneCompany);
  }

  formData.set("credentials", JSON.stringify(data.credentials));
  formData.set("bankAccounts", JSON.stringify(data.bankAccounts));

  if (data.profileImageFile) {
    formData.set("image", data.profileImageFile);
  }

  const response = await fetch(buildApiUrl("/client/create"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const payload = (await response.json()) as CreateClientResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || payload.message || "No se pudo crear el cliente.");
  }

  return payload;
}

export async function getClientsService(query?: string): Promise<GetClientsResponse> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const trimmedQuery = query?.trim() ?? "";
  const requestUrl = trimmedQuery
    ? `${buildApiUrl("/client")}?${new URLSearchParams({
        [resolveSearchParam(trimmedQuery)]: trimmedQuery,
      }).toString()}`
    : buildApiUrl("/client");

  const response = await fetch(requestUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = (await response.json()) as GetClientsResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || payload.message || "No se pudieron cargar los clientes.");
  }

  return payload;
}

export async function getClientByIdService(clientId: string): Promise<ClientRecord> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const response = await fetch(buildApiUrl(`/client/${clientId}`), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = (await response.json()) as {
    message?: string;
    error?: string;
    data?: ClientRecord;
  };

  if (!response.ok || !payload.data) {
    throw new Error(payload.error || payload.message || "No se pudo cargar el cliente.");
  }

  return payload.data;
}

export async function getClientLoansService(clientId: string): Promise<ClientLoanRecord[]> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const response = await fetch(
    `${buildApiUrl("/loan")}?${new URLSearchParams({ clientId }).toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

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

export async function updateClientService(
  clientId: string,
  data: UpdateClientPayload
): Promise<ClientRecord> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const formData = new FormData();
  formData.set("name", data.name);
  formData.set("cedula", data.cedula);
  formData.set("address", data.address);
  formData.set("birthDate", data.birthDate);
  formData.set("email", data.email);
  formData.set("phone", data.phone);
  formData.set("institution", data.institution);

  if (data.phone2) {
    formData.set("phone2", data.phone2);
  }

  if (data.phoneCompany) {
    formData.set("phoneCompany", data.phoneCompany);
  }

  if (data.profileImage) {
    formData.set("profileImage", data.profileImage);
  }

  formData.set("credentials", JSON.stringify(data.credentials));
  formData.set("bankAccounts", JSON.stringify(data.bankAccounts));

  if (data.profileImageFile) {
    formData.set("image", data.profileImageFile);
  }

  const response = await fetch(buildApiUrl(`/client/${clientId}`), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const payload = (await response.json()) as {
    message?: string;
    error?: string;
    data?: ClientRecord;
  };

  if (!response.ok || !payload.data) {
    throw new Error(payload.error || payload.message || "No se pudo actualizar el cliente.");
  }

  return payload.data;
}

function resolveSearchParam(query: string) {
  if (query.includes("@")) {
    return "email";
  }

  if (/^[\d-]+$/.test(query)) {
    return "cedula";
  }

  return "name";
}
