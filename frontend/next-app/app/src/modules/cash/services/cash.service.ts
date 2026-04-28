import { getAuthToken } from "@/app/src/modules/auth/services/session.service";
import { buildApiUrl } from "@/app/src/modules/shared/config/api";
import type { CashMovementRecord } from "../types/cash.types";

export interface CashMovementFilters {
  day?: string;
  month?: string;
  year?: string;
}

export async function getCashMovementsService(
  filters: CashMovementFilters
): Promise<CashMovementRecord[]> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const params = new URLSearchParams();

  if (filters.day) {
    params.set("day", filters.day);
  }

  if (filters.month) {
    params.set("month", filters.month);
  }

  if (filters.year) {
    params.set("year", filters.year);
  }

  const requestUrl = params.size
    ? `${buildApiUrl("/cash")}?${params.toString()}`
    : buildApiUrl("/cash");

  const response = await fetch(requestUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = (await response.json()) as {
    message?: string;
    error?: string;
    data?: CashMovementRecord[];
  };

  if (!response.ok || !payload.data) {
    throw new Error(payload.error || payload.message || "No se pudieron cargar los movimientos de caja.");
  }

  return payload.data;
}
