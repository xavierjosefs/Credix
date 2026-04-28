import type { CashMovementRecord } from "@/app/src/modules/cash/types/cash.types";
import type { ClientLoanRecord } from "@/app/src/modules/client/types/client.types";

export function formatDopCurrency(value: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatInteger(value: number) {
  return new Intl.NumberFormat("es-DO").format(value);
}

export function formatLoanCode(loanId: string) {
  return `#PL-${loanId.slice(0, 5).toUpperCase()}`;
}

export function formatCashRefId(id: string) {
  return `TRX-${id.slice(0, 4).toUpperCase()}`;
}

export function formatPaymentMethod(method?: string) {
  if (method === "TRANSFER") {
    return "Transferencia";
  }

  return "Efectivo";
}

export function formatCashMethod(method: CashMovementRecord["method"]) {
  if (method === "CASH") {
    return "Efectivo";
  }

  if (method === "TRANSFER") {
    return "Transferencia";
  }

  return "Sin registro";
}

export function formatLoanStatus(status: ClientLoanRecord["status"]) {
  if (status === "PAID") return "Liquidado";
  if (status === "LATE") return "En mora";
  return "Al dia";
}

export function formatReceiptDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatCurrentDateTime() {
  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}
