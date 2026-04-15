"use client";

import {
  clearSession,
  getStoredUser,
  getStoredUserServerSnapshot,
  subscribeStoredUser,
} from "@/app/src/modules/auth/services/session.service";
import type { ClientRecord } from "@/app/src/modules/client/types/client.types";
import { getClientsService } from "@/app/src/modules/client/services/client.service";
import AppSidebar from "@/app/src/modules/dashboard/components/AppSidebar";
import { useCreateLoan } from "@/app/src/modules/loan/hooks/useCreateLoan";
import type { PaymentFrequency, PaymentMethod } from "@/app/src/modules/loan/types/loan.types";
import type { AuthUser } from "@/app/src/modules/types/auth.types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

const inputClassName =
  "h-14 w-full rounded-2xl border border-[#d9e2ed] bg-white px-4 text-[1.05rem] text-[#25384f] outline-none transition placeholder:text-[#8f9db0] focus:border-[#bfd0e3] focus:ring-4 focus:ring-[#edf4fb]";

export default function NewLoanPageView() {
  const router = useRouter();
  const user = useSyncExternalStore(
    subscribeStoredUser,
    getStoredUser,
    getStoredUserServerSnapshot
  ) as AuthUser | null;
  const { createLoan, loading, error, successMessage, clearMessages } = useCreateLoan();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ClientRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [form, setForm] = useState({
    principalAmount: "",
    startDate: "",
    interestRate: "",
    frequency: "MONTHLY" as PaymentFrequency,
    method: "CASH" as PaymentMethod,
  });

  useEffect(() => {
    let cancelled = false;

    if (selectedClient || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setSearching(true);
        const response = await getClientsService(query.trim());

        if (!cancelled) {
          setSearchResults(response.data.slice(0, 6));
        }
      } catch {
        if (!cancelled) {
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [query, selectedClient]);

  const analytics = useMemo(() => {
    const principalAmount = Number.parseFloat(form.principalAmount || "0");
    const interestRate = Number.parseFloat(form.interestRate || "0");
    const periodInterest = principalAmount * (interestRate / 100);
    const totalFirstDue = principalAmount + periodInterest;
    const nextDueDate = form.startDate
      ? addDays(form.startDate, form.frequency === "MONTHLY" ? 30 : 15)
      : "";

    return {
      principalAmount,
      periodInterest,
      totalFirstDue,
      nextDueDate,
      paymentFrequencyLabel: form.frequency === "MONTHLY" ? "Mensual" : "Quincenal",
      effectiveRate:
        principalAmount > 0 ? ((periodInterest / principalAmount) * 100).toFixed(1) : "0.0",
    };
  }, [form.frequency, form.interestRate, form.principalAmount, form.startDate]);

  const handleFieldChange = (
    field: keyof typeof form,
    value: string | PaymentFrequency
  ) => {
    clearMessages();
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSelectClient = (client: ClientRecord) => {
    clearMessages();
    setSelectedClient(client);
    setQuery(client.name);
    setSearchResults([]);
  };

  const handleRemoveClient = () => {
    clearMessages();
    setSelectedClient(null);
    setQuery("");
    setSearchResults([]);
  };

  const handleCancel = () => {
    router.push("/home");
  };

  const handleExpiredSession = () => {
    clearSession();
    router.replace("/login");
  };

  const handleSubmit = async () => {
    if (!selectedClient) {
      return;
    }

    const response = await createLoan({
      clientId: selectedClient.id,
      principalAmount: Number.parseFloat(form.principalAmount),
      interestRate: Number.parseFloat(form.interestRate),
      frequency: form.frequency,
      startDate: form.startDate,
      method: form.method,
    });

    router.push(`/clients/${response.data.clientId}`);
  };

  const adminName = user?.name ?? "Administrador";
  const adminInitials = getInitials(adminName);
  const isFormValid =
    !!selectedClient &&
    !!form.startDate &&
    Number.parseFloat(form.principalAmount) > 0 &&
    Number.parseFloat(form.interestRate) >= 0;

  return (
    <main className="bg-[#f4f7fb] text-[#213754] lg:h-screen lg:overflow-hidden">
      <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row">
        <AppSidebar />

        <section className="flex-1 lg:overflow-y-auto">
          <header className="border-b border-[#dfe6ef] bg-white px-5 py-5 sm:px-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-[#f6efdf]">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9b8d64]">
                    IF
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[1.15rem] text-[#617792]">
                  <Link href="/home" className="transition hover:text-[#203754]">
                    Panel
                  </Link>
                  <span>/</span>
                  <span>Préstamos</span>
                  <span>/</span>
                  <span className="font-semibold text-[#102844]">Nueva Configuración</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button className="flex h-10 w-10 items-center justify-center rounded-full text-[#203754] transition hover:bg-[#f1f5f9]">
                  <MoonIcon />
                </button>
                <div className="h-9 w-px bg-[#dfe6ef]" />
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#102844] font-bold text-white">
                    {adminInitials}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[#102844]">{adminName}</p>
                    <p className="text-xs uppercase tracking-[0.12em] text-[#7f91a6]">
                      Personal administrativo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="px-5 py-8 sm:px-8">
            <div className="mb-8">
              <h1 className="text-[2.8rem] font-bold tracking-[-0.04em] text-[#102844]">
                Nueva Configuración de Préstamo
              </h1>
              <p className="mt-2 text-[1.15rem] text-[#6f8198]">
                Configure los parámetros para la creación de un nuevo crédito financiero.
              </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.7fr)]">
              <section className="rounded-[24px] border border-[#d8e2ee] bg-white p-6 shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-[1.7rem] font-bold tracking-[-0.03em] text-[#102844]">
                      Seleccionar Cliente
                    </h2>
                    <div className="relative mt-4">
                      <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#95a5b8]">
                        <SearchIcon />
                      </span>
                      <input
                        type="text"
                        value={query}
                        onChange={(event) => {
                          setQuery(event.target.value);
                          if (selectedClient) {
                            setSelectedClient(null);
                          }
                        }}
                        placeholder="Buscar por nombre o cédula..."
                        className={`${inputClassName} pl-14`}
                      />
                    </div>

                    {!selectedClient && (searchResults.length > 0 || searching) ? (
                      <div className="mt-4 overflow-hidden rounded-2xl border border-[#e1e8f1] bg-[#fbfcfe]">
                        {searching ? (
                          <div className="px-5 py-4 text-sm text-[#7f91a6]">Buscando clientes...</div>
                        ) : (
                          searchResults.map((client) => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => handleSelectClient(client)}
                              className="flex w-full items-center justify-between border-t border-[#edf1f6] px-5 py-4 text-left first:border-t-0 transition hover:bg-white"
                            >
                              <div>
                                <p className="font-semibold text-[#203754]">{client.name}</p>
                                <p className="mt-1 text-sm text-[#7f91a6]">Cédula: {client.cedula}</p>
                              </div>
                              <span className="text-sm font-semibold text-[#63b649]">Seleccionar</span>
                            </button>
                          ))
                        )}
                      </div>
                    ) : null}

                    {selectedClient ? (
                      <div className="mt-5 flex items-center justify-between rounded-[22px] border border-dashed border-[#dbe5ef] bg-[#fbfcfe] px-5 py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#edf2f8] text-lg font-bold text-[#8394a8]">
                            {getInitials(selectedClient.name)}
                          </div>
                          <div>
                            <p className="text-[1.35rem] font-semibold text-[#1d3552]">
                              {selectedClient.name}
                            </p>
                            <p className="text-sm text-[#7f91a6]">
                              Cédula: {selectedClient.cedula}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveClient}
                          className="rounded-full p-2 text-[#8ea0b5] transition hover:bg-white hover:text-[#62768f]"
                        >
                          <CloseIcon />
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="border-t border-[#edf1f6] pt-8">
                    <Field label="Monto del Préstamo">
                      <div className="relative">
                        <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[1.1rem] text-[#8ca0b7]">
                          $
                        </span>
                        <input
                          type="text"
                          value={form.principalAmount}
                          onChange={(event) =>
                            handleFieldChange(
                              "principalAmount",
                              formatMoneyInput(event.target.value)
                            )
                          }
                          placeholder="0.00"
                          className={`${inputClassName} pl-10`}
                        />
                      </div>
                    </Field>

                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                      <Field label="Fecha de Inicio">
                        <input
                          type="date"
                          value={form.startDate}
                          onChange={(event) => handleFieldChange("startDate", event.target.value)}
                          className={inputClassName}
                        />
                      </Field>

                      <Field label="Rédito (Tasa de Interés %)">
                        <div className="relative">
                          <input
                            type="text"
                            value={form.interestRate}
                            onChange={(event) =>
                              handleFieldChange(
                                "interestRate",
                                formatPercentageInput(event.target.value)
                              )
                            }
                            placeholder="5.00"
                            className={`${inputClassName} pr-12`}
                          />
                          <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[1.15rem] text-[#8ca0b7]">
                            %
                          </span>
                        </div>
                      </Field>
                    </div>

                    <div className="mt-6">
                      <Field label="Frecuencia de Pago">
                        <div className="inline-flex rounded-2xl bg-[#eef3f8] p-1">
                          <FrequencyButton
                            label="Mensual"
                            active={form.frequency === "MONTHLY"}
                            onClick={() => handleFieldChange("frequency", "MONTHLY")}
                          />
                          <FrequencyButton
                            label="Quincenal"
                            active={form.frequency === "BIWEEKLY"}
                            onClick={() => handleFieldChange("frequency", "BIWEEKLY")}
                          />
                        </div>
                      </Field>
                    </div>

                    <div className="mt-6">
                      <Field label="Método de Entrega">
                        <div className="inline-flex rounded-2xl bg-[#eef3f8] p-1">
                          <FrequencyButton
                            label="Efectivo"
                            active={form.method === "CASH"}
                            onClick={() => handleFieldChange("method", "CASH")}
                          />
                          <FrequencyButton
                            label="Transferencia"
                            active={form.method === "TRANSFER"}
                            onClick={() => handleFieldChange("method", "TRANSFER")}
                          />
                        </div>
                      </Field>
                    </div>
                  </div>

                  {error ? (
                    <div className="rounded-2xl border border-[#f5caca] bg-[#fff5f5] px-5 py-4 text-sm text-[#c24141]">
                      {error === "Tu sesion expiro. Inicia sesion nuevamente." ? (
                        <span>
                          {error}{" "}
                          <button
                            type="button"
                            onClick={handleExpiredSession}
                            className="font-semibold underline"
                          >
                            Volver al login
                          </button>
                        </span>
                      ) : (
                        error
                      )}
                    </div>
                  ) : null}

                  {successMessage ? (
                    <div className="rounded-2xl border border-[#cce9c5] bg-[#f3fbf1] px-5 py-4 text-sm text-[#3d8b3d]">
                      {successMessage}
                    </div>
                  ) : null}

                  <div className="flex flex-col-reverse gap-4 border-t border-[#edf1f6] pt-7 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#d9e2ed] bg-white px-9 text-[1.05rem] font-semibold text-[#4b5f79] transition hover:bg-[#f8fafc]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!isFormValid || loading}
                      className="inline-flex h-14 items-center justify-center rounded-2xl bg-[#4dab3f] px-9 text-[1.15rem] font-bold text-white shadow-[0_16px_30px_rgba(77,171,63,0.24)] transition hover:bg-[#419735] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? "Creando..." : "Crear Préstamo"}
                    </button>
                  </div>
                </div>
              </section>

              <div className="space-y-6">
                <section className="rounded-[24px] border border-[#14314d] bg-[linear-gradient(180deg,_#173755_0%,_#18354d_100%)] p-6 text-white shadow-[0_18px_40px_rgba(16,40,68,0.18)]">
                  <p className="text-[1rem] font-semibold tracking-[0.02em] text-[#8fc4ff]">
                    analytics
                  </p>
                  <h2 className="mt-1 text-[2rem] font-bold tracking-[-0.03em] text-white">
                    Resumen del Cálculo
                  </h2>

                  <div className="mt-8 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#90aecd]">
                        Monto del primer corte
                      </p>
                      <p className="mt-2 text-[3.2rem] font-bold leading-none tracking-[-0.05em]">
                        {formatCurrency(analytics.totalFirstDue)}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#204f3a] px-4 py-2 text-sm font-semibold text-[#76d35a]">
                      Cálculo en vivo
                    </span>
                  </div>

                  <div className="mt-8 grid gap-5 border-t border-white/10 pt-6 md:grid-cols-2">
                    <MiniMetric
                      label="Intereses del período"
                      value={formatCurrency(analytics.periodInterest)}
                    />
                    <MiniMetric
                      label="Capital + interés"
                      value={formatCurrency(analytics.totalFirstDue)}
                    />
                  </div>

                  <div className="mt-6 rounded-[20px] bg-white/6 p-5">
                    <SummaryRow
                      label="Capital inicial"
                      value={formatCurrency(analytics.principalAmount)}
                    />
                    <SummaryRow
                      label="Próximo vencimiento"
                      value={analytics.nextDueDate ? formatDate(analytics.nextDueDate) : "--"}
                    />
                    <SummaryRow
                      label="Frecuencia"
                      value={analytics.paymentFrequencyLabel}
                    />
                    <SummaryRow
                      label="Costo del crédito"
                      value={`${analytics.effectiveRate}%`}
                      valueTone="text-[#76d35a]"
                    />
                  </div>
                </section>

                <section className="rounded-[24px] border border-[#d8e2ee] bg-white p-6 shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
                  <h2 className="text-[2rem] font-bold tracking-[-0.03em] text-[#102844]">
                    Información Administrativa
                  </h2>

                  <div className="mt-5 space-y-4 text-[1.05rem] leading-8 text-[#4b607b]">
                    <InfoBullet text="Los pagos quincenales reducen el interés acumulado anual." />
                    <InfoBullet text="Asegúrese de validar la capacidad de pago del cliente antes de proceder." />
                    <InfoBullet text="Este cálculo es preliminar y está basado en la tasa configurada para el período." />
                  </div>
                </section>
              </div>
            </div>

            <footer className="mt-12 text-center text-sm text-[#8ba0b9]">
              © 2024 Inversiones Fernandez. Sistema de Gestión de Préstamos v2.4.1
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-3 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#617792]">
        {label}
      </span>
      {children}
    </label>
  );
}

function FrequencyButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[18px] px-8 py-3 text-[1.05rem] font-semibold transition ${
        active
          ? "bg-white text-[#102844] shadow-[0_8px_16px_rgba(16,40,68,0.08)]"
          : "text-[#5d728c] hover:text-[#314861]"
      }`}
    >
      {label}
    </button>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#89a7c6]">{label}</p>
      <p className="mt-2 text-[2rem] font-bold tracking-[-0.04em]">{value}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueTone,
}: {
  label: string;
  value: string;
  valueTone?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 text-[1.05rem] text-[#d9e6f3]">
      <span>{label}</span>
      <span className={`font-semibold text-white ${valueTone ?? ""}`}>{value}</span>
    </div>
  );
}

function InfoBullet({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-3 h-2 w-2 rounded-full bg-[#63b649]" />
      <p>{text}</p>
    </div>
  );
}

function addDays(dateString: string, days: number) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function formatDate(dateString: string) {
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatMoneyInput(value: string) {
  const normalized = value.replace(/[^\d.]/g, "");
  const [integerPart = "", decimalPart = ""] = normalized.split(".");
  return decimalPart.length > 0
    ? `${integerPart}.${decimalPart.slice(0, 2)}`
    : integerPart;
}

function formatPercentageInput(value: string) {
  const normalized = value.replace(/[^\d.]/g, "");
  const [integerPart = "", decimalPart = ""] = normalized.split(".");
  return decimalPart.length > 0
    ? `${integerPart}.${decimalPart.slice(0, 2)}`
    : integerPart;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M10 2a8 8 0 1 0 5 14.24l4.38 4.38 1.42-1.42-4.38-4.38A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1-6 6 6 6 0 0 1 6-6Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="m18.3 5.71-1.41-1.42L12 9.17 7.11 4.29 5.7 5.71 10.59 10.6 5.7 15.49l1.41 1.42L12 12l4.89 4.91 1.41-1.42L13.41 10.6Z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12.7 2.05A8.5 8.5 0 1 0 21.95 11 7.5 7.5 0 0 1 12.7 2.05Z" />
    </svg>
  );
}
