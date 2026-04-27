"use client";

import { clearSession } from "@/app/src/modules/auth/services/session.service";
import type { ClientLoanRecord } from "@/app/src/modules/client/types/client.types";
import AppSidebar from "@/app/src/modules/dashboard/components/AppSidebar";
import {
  getLoanByIdService,
  registerLoanPaymentService,
} from "@/app/src/modules/loan/services/loan.service";
import TablePagination from "@/app/src/modules/shared/components/TablePagination";
import { usePagination } from "@/app/src/modules/shared/hooks/usePagination";
import type { PaymentMethod } from "@/app/src/modules/loan/types/loan.types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function LoanDetailPageView({ loanId }: { loanId: string }) {
  const router = useRouter();
  const [loan, setLoan] = useState<ClientLoanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [customAmount, setCustomAmount] = useState("");
  const [customInterestDays, setCustomInterestDays] = useState("");
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<
    "FULL" | "INTEREST" | "CUSTOM"
  >("FULL");
  const [selectedInterestMode, setSelectedInterestMode] = useState<
    "REAL" | "FULL_PERIOD" | "CUSTOM"
  >("REAL");

  useEffect(() => {
    let cancelled = false;

    const loadLoan = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getLoanByIdService(loanId);

        if (!cancelled) {
          setLoan(data);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudo cargar el prestamo.";

        if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadLoan();

    return () => {
      cancelled = true;
    };
  }, [loanId]);

  const paymentSummary = useMemo(() => {
    if (!loan) {
      return {
        totalPaid: 0,
        interestPaid: 0,
        principalPaid: 0,
      };
    }

    return loan.payments.reduce(
      (summary, payment) => ({
        totalPaid: summary.totalPaid + payment.amount,
        interestPaid: summary.interestPaid + payment.interestPaid,
        principalPaid: summary.principalPaid + payment.principalPaid,
      }),
      {
        totalPaid: 0,
        interestPaid: 0,
        principalPaid: 0,
      }
    );
  }, [loan]);
  const paymentsPagination = usePagination(loan?.payments ?? [], 8);

  const periodDays = loan ? getPeriodDays(loan.frequency) : 0;
  const realInterestDays = loan ? diffInDays(loan.lastPaymentDate, new Date().toISOString()) : 0;
  const customInterestDaysValue = Number.parseInt(customInterestDays || "0", 10) || 0;
  const chargedInterestDays = loan
    ? selectedInterestMode === "FULL_PERIOD"
      ? periodDays
      : selectedInterestMode === "CUSTOM"
        ? customInterestDaysValue
        : realInterestDays
    : 0;
  const interestToCharge = loan
    ? selectedInterestMode === "REAL"
      ? calculateLoanInterestPreview(loan)
      : calculateLoanInterestPreview(loan, chargedInterestDays)
    : 0;

  const currentPaymentAmount = loan
    ? selectedPaymentMode === "FULL"
      ? roundMoney(loan.remainingBalance + interestToCharge)
      : selectedPaymentMode === "INTEREST"
        ? interestToCharge
        : Number.parseFloat(customAmount || "0") || 0
    : 0;

  const handleExpiredSession = () => {
    clearSession();
    router.replace("/login");
  };

  const handleRegisterPayment = async () => {
    if (!loan || loan.status === "PAID") {
      return;
    }

    if (!Number.isFinite(currentPaymentAmount) || currentPaymentAmount <= 0) {
      setPaymentSuccess(null);
      setPaymentError("Debes indicar un monto de pago valido.");
      return;
    }

    if (selectedInterestMode === "CUSTOM") {
      if (!Number.isInteger(customInterestDaysValue) || customInterestDaysValue <= 0) {
        setPaymentSuccess(null);
        setPaymentError("Debes indicar una cantidad valida de dias de interes.");
        return;
      }

      if (loan && customInterestDaysValue > periodDays) {
        setPaymentSuccess(null);
        setPaymentError(
          `Los dias de interes no pueden ser mayores a ${periodDays} para este prestamo.`
        );
        return;
      }
    }

    try {
      setPaying(true);
      setPaymentError(null);
      setPaymentSuccess(null);

      const paymentResponse = await registerLoanPaymentService(loan.id, {
        amount: currentPaymentAmount,
        method: paymentMethod,
        ...(selectedInterestMode === "REAL" ? {} : { interestDays: chargedInterestDays }),
      });

      const updatedLoan = await getLoanByIdService(loan.id);
      setLoan(updatedLoan);
      setCustomAmount("");
      setCustomInterestDays("");
      setSelectedInterestMode("REAL");
      setPaymentSuccess("Pago registrado correctamente.");
      router.push(
        `/loans/${loan.id}/payments/${paymentResponse.data.payment.id}/receipt?${new URLSearchParams(
          {
            method: paymentMethod,
          }
        ).toString()}`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo registrar el pago.";
      setPaymentError(message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <main className="bg-[#f4f7fb] text-[#213754] lg:h-screen lg:overflow-hidden">
      <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row">
        <AppSidebar />

        <section className="flex-1 lg:overflow-y-auto">
          <header className="flex flex-col gap-4 border-b border-[#dfe6ef] bg-white px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#67b549]">
                Prestamo
              </p>
              <h1 className="mt-1 text-[2rem] font-bold tracking-[-0.03em] text-[#102844]">
                Detalle del Prestamo
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/loans"
                className="inline-flex h-11 items-center rounded-xl border border-[#d9e2ed] bg-white px-5 text-sm font-semibold text-[#60748d] transition hover:bg-[#f8fafc]"
              >
                Volver a Prestamos
              </Link>
              <Link
                href="/loans/new"
                className="inline-flex h-11 items-center rounded-xl bg-[#63b649] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(99,182,73,0.24)] transition hover:bg-[#54a13c]"
              >
                Nuevo Prestamo
              </Link>
            </div>
          </header>

          <div className="space-y-6 px-5 py-8 sm:px-8">
            {loading ? (
              <section className="rounded-[24px] border border-[#d8e2ee] bg-white px-6 py-12 text-center text-sm text-[#7b8da2] shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
                Cargando detalle del prestamo...
              </section>
            ) : error ? (
              <section className="rounded-[24px] border border-[#f5caca] bg-[#fff5f5] px-6 py-5 text-sm text-[#c24141]">
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
              </section>
            ) : loan ? (
              <>
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <MetricCard label="Referencia" value={formatLoanCode(loan.id)} />
                  <MetricCard label="Monto Inicial" value={formatCurrency(loan.principalAmount)} />
                  <MetricCard
                    label="Saldo Pendiente"
                    value={formatCurrency(loan.remainingBalance)}
                    accent
                  />
                  <MetricCard
                    label="Interes Acumulado"
                    value={formatCurrency(loan.currentAccruedInterest)}
                    warning
                  />
                  <MetricCard label="Total Adeudado" value={formatCurrency(loan.currentTotalDue)} />
                </section>

                <DetailCard title="Registrar Pago" featured>
                  {loan.status === "PAID" ? (
                    <div className="rounded-2xl border border-[#cce9c5] bg-[#f3fbf1] px-5 py-4 text-sm text-[#3d8b3d]">
                      Este prestamo ya fue liquidado y no admite nuevos pagos.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <div className="grid gap-3 lg:grid-cols-3">
                          <PaymentOption
                            title="Saldar completo"
                            description={`Paga todo lo adeudado segun el interes seleccionado: ${formatCurrency(roundMoney(loan.remainingBalance + interestToCharge))}`}
                            active={selectedPaymentMode === "FULL"}
                            onClick={() => setSelectedPaymentMode("FULL")}
                          />
                          <PaymentOption
                            title="Pagar intereses"
                            description={`Cubre solo el interes a cobrar: ${formatCurrency(interestToCharge)}`}
                            active={selectedPaymentMode === "INTEREST"}
                            onClick={() => setSelectedPaymentMode("INTEREST")}
                          />
                          <PaymentOption
                            title="Pago personalizado"
                            description="Ingresa un monto manual para aplicarlo al prestamo."
                            active={selectedPaymentMode === "CUSTOM"}
                            onClick={() => setSelectedPaymentMode("CUSTOM")}
                          />
                        </div>

                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_220px_minmax(0,1fr)]">
                          <div className="rounded-2xl border border-[#e1e8f1] bg-[#fbfcfe] px-4 py-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7f91a6]">
                              Dias de interes
                            </p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                              <InterestModeButton
                                label={`Reales (${realInterestDays})`}
                                active={selectedInterestMode === "REAL"}
                                onClick={() => setSelectedInterestMode("REAL")}
                              />
                              <InterestModeButton
                                label={`Periodo completo (${periodDays})`}
                                active={selectedInterestMode === "FULL_PERIOD"}
                                onClick={() => setSelectedInterestMode("FULL_PERIOD")}
                              />
                              <InterestModeButton
                                label="Personalizado"
                                active={selectedInterestMode === "CUSTOM"}
                                onClick={() => setSelectedInterestMode("CUSTOM")}
                              />
                            </div>

                            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <p className="text-sm text-[#6b7e95]">
                                Se cobraran <span className="font-semibold text-[#24384f]">{chargedInterestDays}</span>{" "}
                                dias de interes en esta operacion.
                              </p>

                              {selectedInterestMode === "CUSTOM" ? (
                                <div className="w-full md:w-[150px]">
                                  <input
                                    type="text"
                                    value={customInterestDays}
                                    onChange={(event) =>
                                      setCustomInterestDays(
                                        event.target.value.replace(/[^\d]/g, "").slice(0, 2)
                                      )
                                    }
                                    placeholder="Dias"
                                    className="h-11 w-full rounded-2xl border border-[#d9e2ed] bg-white px-4 text-sm text-[#25384f] outline-none transition placeholder:text-[#8f9db0] focus:border-[#bfd0e3] focus:ring-4 focus:ring-[#edf4fb]"
                                  />
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="rounded-2xl bg-[#eef3f8] p-1">
                            <p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7f91a6]">
                              Metodo
                            </p>
                            <div className="flex flex-wrap gap-1">
                              <MethodButton
                                label="Efectivo"
                                active={paymentMethod === "CASH"}
                                onClick={() => setPaymentMethod("CASH")}
                              />
                              <MethodButton
                                label="Transferencia"
                                active={paymentMethod === "TRANSFER"}
                                onClick={() => setPaymentMethod("TRANSFER")}
                              />
                            </div>
                          </div>

                          <div className="rounded-2xl border border-[#e1e8f1] bg-[#fbfcfe] px-4 py-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7f91a6]">
                                  Monto a pagar
                                </p>
                                <p className="mt-2 text-[1.7rem] font-bold tracking-[-0.04em] text-[#102844]">
                                  {formatCurrency(currentPaymentAmount)}
                                </p>
                              </div>

                              {selectedPaymentMode === "CUSTOM" ? (
                                <div className="w-full max-w-[280px]">
                                  <input
                                    type="text"
                                    value={customAmount}
                                    onChange={(event) =>
                                      setCustomAmount(formatMoneyInput(event.target.value))
                                    }
                                    placeholder="0.00"
                                    className="h-12 w-full rounded-2xl border border-[#d9e2ed] bg-white px-4 text-[1rem] text-[#25384f] outline-none transition placeholder:text-[#8f9db0] focus:border-[#bfd0e3] focus:ring-4 focus:ring-[#edf4fb]"
                                  />
                                </div>
                              ) : (
                                <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-[inset_0_0_0_1px_#e5ebf3]">
                                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a9aaf]">
                                    Tipo
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-[#24384f]">
                                    {selectedPaymentMode === "FULL"
                                      ? "Liquidacion total"
                                      : "Solo intereses"}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {paymentError ? (
                          <div className="rounded-2xl border border-[#f5caca] bg-[#fff5f5] px-4 py-3 text-sm text-[#c24141]">
                            {paymentError}
                          </div>
                        ) : null}

                        {paymentSuccess ? (
                          <div className="rounded-2xl border border-[#cce9c5] bg-[#f3fbf1] px-4 py-3 text-sm text-[#3d8b3d]">
                            {paymentSuccess}
                          </div>
                          ) : null}
                      </div>

                      <div className="grid gap-4 rounded-[22px] border border-[#d8e2ee] bg-[linear-gradient(180deg,_#173755_0%,_#18354d_100%)] p-5 text-white shadow-[0_16px_34px_rgba(16,40,68,0.18)] lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] lg:items-center">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8fb2d6]">
                            Resumen del pago
                          </p>
                          <p className="mt-2 text-[2.35rem] font-bold leading-none tracking-[-0.05em]">
                            {formatCurrency(currentPaymentAmount)}
                          </p>
                        </div>

                        <div className="mx-auto w-full max-w-[760px] rounded-2xl bg-white/6 px-5 py-4">
                          <div className="grid gap-4 sm:grid-cols-3">
                          <SummaryLine
                            label="Saldo pendiente"
                            value={formatCurrency(loan.remainingBalance)}
                          />
                          <SummaryLine
                            label="Interes a cobrar"
                            value={formatCurrency(interestToCharge)}
                          />
                          <SummaryLine
                            label="Metodo"
                            value={paymentMethod === "CASH" ? "Efectivo" : "Transferencia"}
                          />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleRegisterPayment}
                          disabled={paying || currentPaymentAmount <= 0}
                          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#63b649] px-6 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(99,182,73,0.24)] transition hover:bg-[#54a13c] disabled:cursor-not-allowed disabled:opacity-70 lg:w-auto"
                        >
                          {paying ? "Registrando pago..." : "Hacer pago"}
                        </button>
                      </div>
                    </div>
                  )}
                </DetailCard>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                  <div className="space-y-6">
                    <DetailCard title="Informacion General">
                      <div className="grid gap-4 md:grid-cols-2">
                        <InfoBlock
                          label="Frecuencia"
                          value={loan.frequency === "MONTHLY" ? "Mensual" : "Quincenal"}
                        />
                        <InfoBlock
                          label="Estado"
                          value={
                            loan.status === "PAID"
                              ? "Liquidado"
                              : loan.status === "LATE"
                                ? "En Mora"
                                : "Activo"
                          }
                        />
                        <InfoBlock label="Tasa de interes" value={`${loan.interestRate}%`} />
                        <InfoBlock label="Fecha de inicio" value={formatDate(loan.startDate)} />
                        <InfoBlock label="Ultimo pago" value={formatDate(loan.lastPaymentDate)} />
                        <InfoBlock
                          label="Proximo vencimiento"
                          value={formatDate(loan.nextDueDate)}
                        />
                      </div>
                    </DetailCard>

                    <DetailCard title="Historial de Pagos">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left">
                          <thead className="bg-[#f7f9fc] text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a9aaf]">
                            <tr>
                              <th className="px-4 py-4">Fecha</th>
                              <th className="px-4 py-4">Monto</th>
                              <th className="px-4 py-4">Interes</th>
                              <th className="px-4 py-4">Capital</th>
                              <th className="px-4 py-4">Saldo</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {loan.payments.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="px-4 py-12 text-center text-sm text-[#7b8da2]"
                                >
                                  Este prestamo aun no tiene pagos registrados.
                                </td>
                              </tr>
                            ) : (
                              paymentsPagination.paginatedItems.map((payment) => (
                                <tr key={payment.id} className="border-t border-[#edf1f6]">
                                  <td className="px-4 py-4 text-sm text-[#52657c]">
                                    {formatDate(payment.paymentDate)}
                                  </td>
                                  <td className="px-4 py-4 text-sm font-semibold text-[#24384f]">
                                    {formatCurrency(payment.amount)}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-[#52657c]">
                                    {formatCurrency(payment.interestPaid)}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-[#52657c]">
                                    {formatCurrency(payment.principalPaid)}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-[#52657c]">
                                    {formatCurrency(payment.remainingBalance)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {loan.payments.length > 0 ? (
                        <TablePagination
                          currentPage={paymentsPagination.currentPage}
                          totalPages={paymentsPagination.totalPages}
                          totalItems={paymentsPagination.totalItems}
                          pageSize={paymentsPagination.pageSize}
                          itemLabel="pagos"
                          onPrevious={paymentsPagination.goToPreviousPage}
                          onNext={paymentsPagination.goToNextPage}
                        />
                      ) : null}
                    </DetailCard>
                  </div>

                  <div className="space-y-6">
                    <DetailCard title="Resumen Financiero">
                      <div className="space-y-4">
                        <InfoBlock
                          label="Interes acumulado actual"
                          value={formatCurrency(loan.currentAccruedInterest)}
                        />
                        <InfoBlock
                          label="Total pagado"
                          value={formatCurrency(paymentSummary.totalPaid)}
                        />
                        <InfoBlock
                          label="Pagado a interes"
                          value={formatCurrency(paymentSummary.interestPaid)}
                        />
                        <InfoBlock
                          label="Pagado a capital"
                          value={formatCurrency(paymentSummary.principalPaid)}
                        />
                      </div>
                    </DetailCard>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  accent,
  warning,
}: {
  label: string;
  value: string;
  accent?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe6ef] bg-white px-5 py-5 shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a9aaf]">{label}</p>
      <p
        className={`mt-3 text-[1.95rem] font-bold tracking-[-0.04em] ${
          warning ? "text-[#c78611]" : accent ? "text-[#63b649]" : "text-[#24384f]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function DetailCard({
  title,
  featured,
  children,
}: {
  title: string;
  featured?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-[24px] border bg-white shadow-[0_12px_34px_rgba(29,46,77,0.05)] ${
        featured ? "border-[#cfe3c8] shadow-[0_18px_40px_rgba(99,182,73,0.10)]" : "border-[#d8e2ee]"
      }`}
    >
      <div className="border-b border-[#e7edf5] px-6 py-5">
        <h2 className="text-[1.5rem] font-bold tracking-[-0.03em] text-[#102844]">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e7edf5] bg-[#fbfcfe] px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7f91a6]">{label}</p>
      <p className="mt-2 break-words text-base font-semibold text-[#24384f]">{value}</p>
    </div>
  );
}

function PaymentOption({
  title,
  description,
  active,
  onClick,
}: {
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`payment-option w-full rounded-2xl border px-4 py-4 text-left transition ${
        active
          ? "payment-option-active border-[#b8d6ae] bg-[#f4fbf1] shadow-[0_10px_22px_rgba(99,182,73,0.12)]"
          : "border-[#e7edf5] bg-[#fbfcfe] hover:bg-white"
      }`}
    >
      <p className="payment-option-title font-semibold text-[#24384f]">{title}</p>
      <p className="payment-option-description mt-1 text-sm leading-6 text-[#6b7e95]">{description}</p>
    </button>
  );
}

function MethodButton({
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
      className={`payment-method-button rounded-[14px] px-4 py-2 text-sm font-semibold transition ${
        active
          ? "payment-method-button-active bg-white text-[#102844] shadow-[0_8px_16px_rgba(16,40,68,0.08)]"
          : "text-[#5d728c] hover:text-[#314861]"
      }`}
    >
      {label}
    </button>
  );
}

function InterestModeButton({
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
      className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
        active
          ? "border-[#b8d6ae] bg-[#f4fbf1] text-[#24411f] shadow-[0_10px_22px_rgba(99,182,73,0.10)]"
          : "border-[#e7edf5] bg-white text-[#5d728c] hover:bg-[#f8fbfe] hover:text-[#314861]"
      }`}
    >
      {label}
    </button>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center sm:text-left">
      <p className="text-xs text-[#c8d8e8]">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatLoanCode(loanId: string) {
  return `#PR-${loanId.slice(0, 4).toUpperCase()}`;
}

function formatMoneyInput(value: string) {
  const normalized = value.replace(/[^\d.]/g, "");
  const [integerPart = "", decimalPart = ""] = normalized.split(".");
  return decimalPart.length > 0
    ? `${integerPart}.${decimalPart.slice(0, 2)}`
    : integerPart;
}

function getPeriodDays(frequency: ClientLoanRecord["frequency"]) {
  return frequency === "MONTHLY" ? 30 : 15;
}

function diffInDays(startDateString: string, endDateString: string) {
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }

  const diffMs = endDate.getTime() - startDate.getTime();

  if (diffMs <= 0) {
    return 0;
  }

  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function calculateLoanInterestPreview(
  loan: ClientLoanRecord,
  interestDaysOverride?: number
) {
  const segments = getInterestSegments(loan);

  if (segments.length === 0) {
    return calculateAccruedInterest(
      loan.remainingBalance,
      loan.interestRate,
      loan.frequency,
      interestDaysOverride ?? diffInDays(loan.lastPaymentDate, new Date().toISOString())
    );
  }

  return roundMoney(
    segments.reduce((sum, segment) => {
      const accrualStart =
        new Date(segment.startDate) > new Date(loan.lastPaymentDate)
          ? segment.startDate
          : loan.lastPaymentDate;

      return (
        sum +
        calculateAccruedInterest(
          segment.amount,
          loan.interestRate,
          loan.frequency,
          interestDaysOverride ?? diffInDays(accrualStart, new Date().toISOString())
        )
      );
    }, 0)
  );
}

function calculateAccruedInterest(
  remainingBalance: number,
  interestRate: number,
  frequency: ClientLoanRecord["frequency"],
  daysElapsed: number
) {
  if (remainingBalance <= 0 || interestRate <= 0 || daysElapsed <= 0) {
    return 0;
  }

  const periodInterest = remainingBalance * (interestRate / 100);
  const dailyInterest = periodInterest / getPeriodDays(frequency);

  return roundMoney(dailyInterest * daysElapsed);
}

function getInterestSegments(loan: ClientLoanRecord) {
  const persistedSegments = (loan.segments ?? []).map((segment) => ({
    id: segment.id,
    amount: segment.amount,
    startDate: segment.startDate,
  }));

  const persistedTotal = roundMoney(
    persistedSegments.reduce((sum, segment) => sum + segment.amount, 0)
  );
  const missingBalance = roundMoney(Math.max(loan.remainingBalance - persistedTotal, 0));

  if (missingBalance > 0) {
    persistedSegments.unshift({
      id: "fallback",
      amount: missingBalance,
      startDate: loan.startDate,
    });
  }

  if (persistedSegments.length > 0) {
    return persistedSegments;
  }

  if (loan.remainingBalance <= 0) {
    return [];
  }

  return [
    {
      id: "fallback",
      amount: loan.remainingBalance,
      startDate: loan.startDate,
    },
  ];
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}
