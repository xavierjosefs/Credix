import { getAuthToken } from "@/app/src/modules/auth/services/session.service";
import { buildApiUrl } from "@/app/src/modules/shared/config/api";
import type {
  CompleteRegistrationPayload,
  CompleteRegistrationResponse,
  InviteAdminPayload,
  InviteAdminResponse,
  LoginResponse,
} from "@/app/src/modules/types/auth.types";

export async function loginService(data: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  const res = await fetch(buildApiUrl("/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Login failed");
  }

  return res.json();
}

export async function inviteAdminService(
  data: InviteAdminPayload
): Promise<InviteAdminResponse> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const response = await fetch(buildApiUrl("/auth/invite-admin"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const payload = (await response.json()) as InviteAdminResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || payload.message || "No se pudo invitar al administrador.");
  }

  return payload;
}

export async function completeRegistrationService(
  data: CompleteRegistrationPayload
): Promise<CompleteRegistrationResponse> {
  const response = await fetch(buildApiUrl("/auth/complete-registration"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const payload = (await response.json()) as CompleteRegistrationResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || payload.message || "No se pudo completar el registro.");
  }

  return payload;
}
