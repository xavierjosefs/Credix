"use client";

import {
  clearSession,
} from "@/app/src/modules/auth/services/session.service";
import {
  getClientLoansService,
  getClientsService,
} from "@/app/src/modules/client/services/client.service";
import type { ClientLoanRecord, ClientRecord } from "@/app/src/modules/client/types/client.types";
import AppSidebar from "@/app/src/modules/dashboard/components/AppSidebar";
import { useCreateLoan } from "@/app/src/modules/loan/hooks/useCreateLoan";
import type {
  LoanType,
  PaymentFrequency,
  PaymentMethod,
} from "@/app/src/modules/loan/types/loan.types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

const inputClassName =
  "h-14 w-full rounded-2xl border border-[#d9e2ed] bg-white px-4 text-[1.05rem] text-[#25384f] outline-none transition placeholder:text-[#8f9db0] focus:border-[#bfd0e3] focus:ring-4 focus:ring-[#edf4fb]";

type LoanMode = "NEW" | "TOPUP";

export default function NewLoanPageView() {
  const router = useRouter();
  const { createLoan, loading, error, successMessage, clearMessages } = useCreateLoan();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ClientRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [loanMode, setLoanMode] = useState<LoanMode>("NEW");
  const [clientLoans, setClientLoans] = useState<ClientLoanRecord[]>([]);
  const [loadingClientLoans, setLoadingClientLoans] = useState(false);
  const [selectedExistingLoanId, setSelectedExistingLoanId] = useState("");
  const [form, setForm] = useState({
    principalAmount: "",
    startDate: "",
    interestRate: "",
    loanType: "FLEXIBLE" as LoanType,
    installmentCount: "12",
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

  useEffect(() => {
    let cancelled = false;

    if (!selectedClient) {
      setClientLoans([]);
      setSelectedExistingLoanId("");
      return;
    }

    const loadClientLoans = async () => {
      try {
        setLoadingClientLoans(true);
        const loans = await getClientLoansService(selectedClient.id);

        if (!cancelled) {
          const activeLoans = loans.filter(
            (loan) => loan.status === "ACTIVE" && loan.type === "FLEXIBLE"
          );
          setClientLoans(activeLoans);
          setSelectedExistingLoanId((current) =>
            activeLoans.some((loan) => loan.id === current) ? current : ""
          );
        }
      } catch {
        if (!cancelled) {
          setClientLoans([]);
          setSelectedExistingLoanId("");
        }
      } finally {
        if (!cancelled) {
          setLoadingClientLoans(false);
        }
      }
    };

    void loadClientLoans();

    return () => {
      cancelled = true;
    };
  }, [selectedClient]);

  const selectedExistingLoan = useMemo(
    () => clientLoans.find((loan) => loan.id === selectedExistingLoanId) ?? null,
    [clientLoans, selectedExistingLoanId]
  );

  const analytics = useMemo(() => {
    const principalAmount = Number.parseFloat(form.principalAmount || "0");
    const installmentCount = Number.parseInt(form.installmentCount || "0", 10) || 0;
    const interestRate =
      loanMode === "TOPUP"
        ? selectedExistingLoan?.interestRate ?? 0
        : Number.parseFloat(form.interestRate || "0");
    const frequency =
      loanMode === "TOPUP"
        ? selectedExistingLoan?.frequency ?? form.frequency
        : form.frequency;
    const startDate =
      loanMode === "TOPUP" ? selectedExistingLoan?.startDate ?? "" : form.startDate;
    const periodInterest = principalAmount * (interestRate / 100);
    const totalInstallmentInterest =
      form.loanType === "INSTALLMENT" && installmentCount > 0
        ? periodInterest * installmentCount
        : periodInterest;
    const totalLoanAmount =
      form.loanType === "INSTALLMENT" && installmentCount > 0
        ? principalAmount + totalInstallmentInterest
        : principalAmount + periodInterest;
    const estimatedInstallmentAmount =
      form.loanType === "INSTALLMENT" && installmentCount > 0
        ? totalLoanAmount / installmentCount
        : 0;
    const totalFirstDue =
      loanMode === "TOPUP" && selectedExistingLoan
        ? selectedExistingLoan.currentTotalDue + principalAmount
        : form.loanType === "INSTALLMENT"
          ? estimatedInstallmentAmount
          : principalAmount + periodInterest;
    const nextDueDate = startDate ? addDays(startDate, frequency === "MONTHLY" ? 30 : 15) : "";

    return {
      principalAmount,
      periodInterest,
      totalInstallmentInterest,
      totalLoanAmount,
      estimatedInstallmentAmount,
      installmentCount,
      totalFirstDue,
      nextDueDate,
      paymentFrequencyLabel: frequency === "MONTHLY" ? "Mensual" : "Quincenal",
      effectiveRate:
        principalAmount > 0
          ? (((form.loanType === "INSTALLMENT" ? totalInstallmentInterest : periodInterest) /
              principalAmount) *
              100
            ).toFixed(1)
          : "0.0",
    };
  }, [
    form.frequency,
    form.interestRate,
    form.installmentCount,
    form.loanType,
    form.principalAmount,
    form.startDate,
    loanMode,
    selectedExistingLoan,
  ]);

  const handleFieldChange = (
    field: keyof typeof form,
    value: string | PaymentFrequency | PaymentMethod
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
    setSelectedExistingLoanId("");
  };

  const handleRemoveClient = () => {
    clearMessages();
    setSelectedClient(null);
    setQuery("");
    setSearchResults([]);
    setClientLoans([]);
    setSelectedExistingLoanId("");
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

    const principalAmount = Number.parseFloat(form.principalAmount);
    const operationDate = new Date().toISOString();
    const response = await createLoan({
      clientId: selectedClient.id,
      principalAmount,
      interestRate:
        loanMode === "TOPUP"
          ? selectedExistingLoan?.interestRate ?? 0
          : Number.parseFloat(form.interestRate),
      ...(loanMode === "NEW" ? { type: form.loanType } : {}),
      ...(loanMode === "NEW" && form.loanType === "INSTALLMENT"
        ? {
            installmentCount: Number.parseInt(form.installmentCount || "0", 10),
          }
        : {}),
      frequency:
        loanMode === "TOPUP"
          ? selectedExistingLoan?.frequency ?? form.frequency
          : form.frequency,
      startDate:
        loanMode === "TOPUP"
          ? selectedExistingLoan?.startDate ?? new Date().toISOString()
          : form.startDate,
      method: form.method,
      ...(loanMode === "TOPUP" && selectedExistingLoanId
        ? { existingLoanId: selectedExistingLoanId }
        : {}),
    });

    const previousBalance =
      loanMode === "TOPUP"
        ? Math.max(response.data.remainingBalance - principalAmount, 0)
        : 0;

    router.push(
      `/loans/${response.data.id}/disbursement?${new URLSearchParams({
        amount: String(principalAmount),
        issuedAt: operationDate,
        method: form.method,
        mode: loanMode,
        newBalance: String(response.data.remainingBalance),
        previousBalance: String(previousBalance),
      }).toString()}`
    );
  };

  const isFormValid =
    !!selectedClient &&
    Number.parseFloat(form.principalAmount) > 0 &&
    (loanMode === "TOPUP"
      ? !!selectedExistingLoanId
      : !!form.startDate &&
        Number.parseFloat(form.interestRate) >= 0 &&
        (form.loanType === "FLEXIBLE" ||
          (Number.isInteger(Number.parseInt(form.installmentCount || "0", 10)) &&
            Number.parseInt(form.installmentCount || "0", 10) > 0)));

  return (
    <main className="bg-[#f4f7fb] text-[#213754] lg:h-screen lg:overflow-hidden">
      <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row">
        <AppSidebar />

        <section className="flex-1 lg:overflow-y-auto">
          <header className="flex flex-col gap-4 border-b border-[#dfe6ef] bg-white px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-[2rem] font-bold tracking-[-0.03em] text-[#102844]">
                Nuevo Prestamo
              </h1>
              <p className="mt-1 text-sm text-[#74879c]">
                Crea un prestamo nuevo o agrega monto a uno activo desde la misma pantalla.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/loans"
                className="inline-flex h-11 items-center rounded-xl border border-[#d9e2ed] bg-white px-5 text-sm font-semibold text-[#60748d] transition hover:bg-[#f8fafc]"
              >
                Volver a Prestamos
              </Link>
            </div>
          </header>

          <div className="px-5 py-8 sm:px-8">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.7fr)]">
              <section className="rounded-[24px] border border-[#d8e2ee] bg-white p-6 shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
                <div className="space-y-8">
                  <div>
                    <Field label="Tipo de Operacion">
                      <div className="inline-flex rounded-2xl bg-[#eef3f8] p-1">
                        <FrequencyButton
                          label="Nuevo prestamo"
                          active={loanMode === "NEW"}
                          onClick={() => {
                            clearMessages();
                            setLoanMode("NEW");
                            setSelectedExistingLoanId("");
                          }}
                        />
                        <FrequencyButton
                          label="Agregar monto"
                          active={loanMode === "TOPUP"}
                          onClick={() => {
                            clearMessages();
                            setLoanMode("TOPUP");
                          }}
                        />
                      </div>
                    </Field>

                    {loanMode === "NEW" ? (
                      <div className="mt-6">
                        <Field label="Tipo de Prestamo">
                          <div className="inline-flex rounded-2xl bg-[#eef3f8] p-1">
                            <FrequencyButton
                              label="Flexible"
                              active={form.loanType === "FLEXIBLE"}
                              onClick={() => {
                                clearMessages();
                                handleFieldChange("loanType", "FLEXIBLE");
                              }}
                            />
                            <FrequencyButton
                              label="Por cuotas"
                              active={form.loanType === "INSTALLMENT"}
                              onClick={() => {
                                clearMessages();
                                handleFieldChange("loanType", "INSTALLMENT");
                              }}
                            />
                          </div>
                        </Field>
                      </div>
                    ) : null}

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
                            setClientLoans([]);
                            setSelectedExistingLoanId("");
                          }
                        }}
                        placeholder="Buscar por nombre o cedula..."
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
                                <p className="mt-1 text-sm text-[#7f91a6]">Cedula: {client.cedula}</p>
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
                            <p className="text-sm text-[#7f91a6]">Cedula: {selectedClient.cedula}</p>
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

                    {loanMode === "TOPUP" && selectedClient ? (
                      <div className="mt-6">
                        <Field label="Prestamo Activo a Incrementar">
                          <div className="space-y-3">
                            {loadingClientLoans ? (
                              <div className="rounded-2xl border border-[#e1e8f1] bg-[#fbfcfe] px-4 py-4 text-sm text-[#7f91a6]">
                                Cargando prestamos activos...
                              </div>
                            ) : clientLoans.length === 0 ? (
                              <div className="rounded-2xl border border-[#f1ddae] bg-[#fff9eb] px-4 py-4 text-sm text-[#9a7a27]">
                                Este cliente no tiene prestamos activos disponibles.
                              </div>
                            ) : (
                              clientLoans.map((loan) => (
                                <button
                                  key={loan.id}
                                  type="button"
                                  onClick={() => {
                                    clearMessages();
                                    setSelectedExistingLoanId(loan.id);
                                  }}
                                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                                    selectedExistingLoanId === loan.id
                                      ? "border-[#89c96d] bg-[#f3fbf1] shadow-[0_8px_18px_rgba(99,182,73,0.12)]"
                                      : "border-[#e1e8f1] bg-[#fbfcfe] hover:bg-white"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="font-semibold text-[#203754]">
                                        {formatLoanCode(loan.id)}
                                      </p>
                                      <p className="mt-1 text-sm text-[#6f8198]">
                                        Saldo: {formatCurrency(loan.remainingBalance)} · Interes actual:{" "}
                                        {formatCurrency(loan.currentAccruedInterest)}
                                      </p>
                                    </div>
                                    <span className="text-sm font-semibold text-[#63b649]">
                                      {selectedExistingLoanId === loan.id
                                        ? "Seleccionado"
                                        : "Seleccionar"}
                                    </span>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </Field>
                      </div>
                    ) : null}
                  </div>

                  <div className="border-t border-[#edf1f6] pt-8">
                    <Field label={loanMode === "TOPUP" ? "Monto a Agregar" : "Monto del Prestamo"}>
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

                    {loanMode === "NEW" ? (
                      <>
                        <div className="mt-6 grid gap-5 md:grid-cols-2">
                          <Field label="Fecha de Inicio">
                            <input
                              type="date"
                              value={form.startDate}
                              onChange={(event) => handleFieldChange("startDate", event.target.value)}
                              className={inputClassName}
                            />
                          </Field>

                          <Field label="Redito (Tasa de Interes %)">
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

                        {form.loanType === "INSTALLMENT" ? (
                          <div className="mt-6 grid gap-5 md:grid-cols-2">
                            <Field label="Cantidad de Cuotas">
                              <input
                                type="text"
                                value={form.installmentCount}
                                onChange={(event) =>
                                  handleFieldChange(
                                    "installmentCount",
                                    event.target.value.replace(/[^\d]/g, "").slice(0, 3)
                                  )
                                }
                                placeholder="12"
                                className={inputClassName}
                              />
                            </Field>

                            <StaticInfoField
                              label="Monto estimado por cuota"
                              value={formatCurrency(analytics.estimatedInstallmentAmount)}
                            />
                          </div>
                        ) : null}

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
                      </>
                    ) : selectedExistingLoan ? (
                      <div className="mt-6 grid gap-5 md:grid-cols-3">
                        <StaticInfoField
                          label="Frecuencia Actual"
                          value={
                            selectedExistingLoan.frequency === "MONTHLY" ? "Mensual" : "Quincenal"
                          }
                        />
                        <StaticInfoField
                          label="Redito Actual"
                          value={`${selectedExistingLoan.interestRate}%`}
                        />
                        <StaticInfoField label="Tipo de prestamo" value="Flexible" />
                        <StaticInfoField
                          label="Proximo Vencimiento"
                          value={formatDate(selectedExistingLoan.nextDueDate)}
                        />
                      </div>
                    ) : null}

                    <div className="mt-6">
                      <Field label="Metodo de Entrega">
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
                      {loading
                        ? loanMode === "TOPUP"
                          ? "Agregando monto..."
                          : "Creando..."
                        : loanMode === "TOPUP"
                          ? "Agregar Monto"
                          : "Crear Prestamo"}
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
                    Resumen del Calculo
                  </h2>

                  <div className="mt-8 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#90aecd]">
                        {loanMode === "TOPUP"
                          ? "Deuda proyectada"
                          : form.loanType === "INSTALLMENT"
                            ? "Monto estimado por cuota"
                            : "Monto del primer corte"}
                      </p>
                      <p className="mt-2 text-[3.2rem] font-bold leading-none tracking-[-0.05em]">
                        {formatCurrency(analytics.totalFirstDue)}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#204f3a] px-4 py-2 text-sm font-semibold text-[#76d35a]">
                      Calculo en vivo
                    </span>
                  </div>

                  <div className="mt-8 grid gap-5 border-t border-white/10 pt-6 md:grid-cols-2">
                    <MiniMetric
                      label={
                        loanMode === "TOPUP"
                          ? "Interes del monto agregado"
                          : form.loanType === "INSTALLMENT"
                            ? "Intereses del prestamo"
                            : "Intereses del periodo"
                      }
                      value={formatCurrency(
                        form.loanType === "INSTALLMENT"
                          ? analytics.totalInstallmentInterest
                          : analytics.periodInterest
                      )}
                    />
                    <MiniMetric
                      label={
                        loanMode === "TOPUP"
                          ? "Total actualizado"
                          : form.loanType === "INSTALLMENT"
                            ? "Total financiado"
                            : "Capital + interes"
                      }
                      value={formatCurrency(
                        loanMode === "TOPUP" ? analytics.totalFirstDue : analytics.totalLoanAmount
                      )}
                    />
                  </div>

                  <div className="mt-6 rounded-[20px] bg-white/6 p-5">
                    <SummaryRow
                      label={loanMode === "TOPUP" ? "Monto agregado" : "Capital inicial"}
                      value={formatCurrency(analytics.principalAmount)}
                    />
                    <SummaryRow
                      label="Proximo vencimiento"
                      value={analytics.nextDueDate ? formatDate(analytics.nextDueDate) : "--"}
                    />
                    {loanMode === "NEW" && form.loanType === "INSTALLMENT" ? (
                      <SummaryRow
                        label="Cantidad de cuotas"
                        value={
                          analytics.installmentCount > 0 ? `${analytics.installmentCount}` : "--"
                        }
                      />
                    ) : null}
                    <SummaryRow label="Frecuencia" value={analytics.paymentFrequencyLabel} />
                    <SummaryRow
                      label="Costo del credito"
                      value={`${analytics.effectiveRate}%`}
                      valueTone="text-[#76d35a]"
                    />
                  </div>
                </section>

                <section className="rounded-[24px] border border-[#d8e2ee] bg-white p-6 shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
                  <h2 className="text-[2rem] font-bold tracking-[-0.03em] text-[#102844]">
                    Informacion Administrativa
                  </h2>

                  <div className="mt-5 space-y-4 text-[1.05rem] leading-8 text-[#4b607b]">
                    <InfoBullet text="Los pagos quincenales reducen el interes acumulado anual." />
                    <InfoBullet text="Asegure la capacidad de pago del cliente antes de proceder." />
                    <InfoBullet text="Los top-ups se agregan sobre prestamos activos y conservan su mismo ciclo." />
                    <InfoBullet text="Los prestamos por cuotas distribuyen capital e interes en un calendario fijo de pagos." />
                  </div>
                </section>
              </div>
            </div>

            <footer className="mt-12 text-center text-sm text-[#8ba0b9]">
              © 2024 Inversiones Fernandez. Sistema de Gestion de Prestamos v2.4.1
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

function StaticInfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e1e8f1] bg-[#fbfcfe] px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7f91a6]">{label}</p>
      <p className="mt-2 text-[1.02rem] font-semibold text-[#203754]">{value}</p>
    </div>
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

function formatLoanCode(loanId: string) {
  return `#PR-${loanId.slice(0, 4).toUpperCase()}`;
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
