"use client";

import { clearSession } from "@/app/src/modules/auth/services/session.service";
import type { ClientLoanRecord } from "@/app/src/modules/client/types/client.types";
import AppSidebar from "@/app/src/modules/dashboard/components/AppSidebar";
import { getLoansService } from "@/app/src/modules/loan/services/loan.service";
import LoanStatusBadge from "@/app/src/modules/shared/components/LoanStatusBadge";
import TablePagination from "@/app/src/modules/shared/components/TablePagination";
import { usePagination } from "@/app/src/modules/shared/hooks/usePagination";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function LoansPageView() {
  const router = useRouter();
  const [loans, setLoans] = useState<ClientLoanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loansPagination = usePagination(loans, 10);

  useEffect(() => {
    let cancelled = false;

    const loadLoans = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getLoansService();

        if (!cancelled) {
          setLoans(data);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar los prestamos.";

        if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadLoans();

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const activeLoans = loans.filter((loan) => loan.status === "ACTIVE").length;
    const lateLoans = loans.filter((loan) => loan.status === "LATE").length;
    const paidLoans = loans.filter((loan) => loan.status === "PAID").length;
    const totalOutstanding = loans
      .filter((loan) => loan.status !== "PAID")
      .reduce((sum, loan) => sum + loan.remainingBalance, 0);
    const totalCurrentDue = loans
      .filter((loan) => loan.status !== "PAID")
      .reduce((sum, loan) => sum + loan.currentTotalDue, 0);
    const totalInterestDue = loans
      .filter((loan) => loan.status !== "PAID")
      .reduce((sum, loan) => sum + loan.currentAccruedInterest, 0);

    return {
      totalLoans: loans.length,
      activeLoans,
      lateLoans,
      paidLoans,
      totalOutstanding,
      totalCurrentDue,
      totalInterestDue,
    };
  }, [loans]);

  const handleExpiredSession = () => {
    clearSession();
    router.replace("/login");
  };

  return (
    <main className="bg-[#f4f7fb] text-[#213754] lg:h-screen lg:overflow-hidden">
      <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row">
        <AppSidebar />

        <section className="flex-1 lg:overflow-y-auto">
          <header className="flex flex-col gap-4 border-b border-[#dfe6ef] bg-white px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-[2rem] font-bold tracking-[-0.03em] text-[#102844]">
                Prestamos Registrados
              </h1>
              <p className="mt-1 text-sm text-[#74879c]">
                Resumen financiero global y listado completo de la cartera activa.
              </p>
            </div>

            <Link
              href="/loans/new"
              className="inline-flex h-11 items-center rounded-xl bg-[#63b649] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(99,182,73,0.24)] transition hover:bg-[#54a13c]"
            >
              <span className="mr-2 text-base">+</span>
              Nuevo Prestamo
            </Link>
          </header>

          <div className="space-y-6 px-5 py-8 sm:px-8">
            {error ? (
              <section className="rounded-2xl border border-[#f5caca] bg-[#fff5f5] px-5 py-4 text-sm text-[#c24141]">
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
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <MetricCard label="Prestamos Totales" value={formatInteger(summary.totalLoans)} />
              <MetricCard label="Activos" value={formatInteger(summary.activeLoans)} accent />
              <MetricCard label="En Mora" value={formatInteger(summary.lateLoans)} danger />
              <MetricCard label="Saldo Pendiente" value={formatCurrency(summary.totalOutstanding)} />
              <MetricCard
                label="Interes Pendiente"
                value={formatCurrency(summary.totalInterestDue)}
                warning
              />
              <MetricCard label="Total Adeudado" value={formatCurrency(summary.totalCurrentDue)} />
            </section>

            <section className="overflow-hidden rounded-[24px] border border-[#d8e2ee] bg-white shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
              <div className="flex items-center justify-between border-b border-[#e7edf5] px-6 py-5">
                <h2 className="text-[1.7rem] font-bold tracking-[-0.03em] text-[#102844]">
                  Listado General
                </h2>
                <p className="text-sm text-[#7f91a6]">Doble clic para ver el detalle</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-[#f7f9fc] text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a9aaf]">
                    <tr>
                      <th className="px-5 py-4">Prestamo</th>
                      <th className="px-5 py-4">Cliente</th>
                      <th className="px-5 py-4">Monto Inicial</th>
                      <th className="px-5 py-4">Saldo</th>
                      <th className="px-5 py-4">Proximo Vencimiento</th>
                      <th className="px-5 py-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-14 text-center text-sm text-[#7b8da2]">
                          Cargando prestamos...
                        </td>
                      </tr>
                    ) : loans.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-14 text-center text-sm text-[#7b8da2]">
                          Aun no hay prestamos registrados.
                        </td>
                      </tr>
                    ) : (
                      loansPagination.paginatedItems.map((loan) => (
                        <tr
                          key={loan.id}
                          onDoubleClick={() => router.push(`/loans/${loan.id}`)}
                          className="cursor-pointer border-t border-[#edf1f6] transition hover:bg-[#f8fbfe]"
                          title="Doble clic para ver el detalle"
                        >
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-semibold text-[#24384f]">{formatLoanCode(loan.id)}</p>
                              <p className="mt-1 text-sm text-[#7f91a6]">
                                {loan.frequency === "MONTHLY" ? "Mensual" : "Quincenal"} · {loan.interestRate}%
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-[#52657c]">
                            {(loan as ClientLoanRecord & { client?: { name?: string } }).client?.name ?? "Cliente"}
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-[#24384f]">
                            {formatCurrency(loan.principalAmount)}
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-[#24384f]">
                            {formatCurrency(loan.remainingBalance)}
                          </td>
                          <td className="px-5 py-4 text-sm text-[#52657c]">
                            {formatDate(loan.nextDueDate)}
                          </td>
                          <td className="px-5 py-4">
                            <LoanStatusBadge status={loan.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {!loading && loans.length > 0 ? (
                <TablePagination
                  currentPage={loansPagination.currentPage}
                  totalPages={loansPagination.totalPages}
                  totalItems={loansPagination.totalItems}
                  pageSize={loansPagination.pageSize}
                  itemLabel="prestamos"
                  onPrevious={loansPagination.goToPreviousPage}
                  onNext={loansPagination.goToNextPage}
                />
              ) : null}
            </section>
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
  danger,
  warning,
}: {
  label: string;
  value: string;
  accent?: boolean;
  danger?: boolean;
  warning?: boolean;
}) {
  const valueClassName = danger
    ? "text-[#ef4444]"
    : warning
      ? "text-[#c78611]"
      : accent
        ? "text-[#63b649]"
        : "text-[#24384f]";

  return (
    <div className="rounded-2xl border border-[#dfe6ef] bg-white px-5 py-5 shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a9aaf]">{label}</p>
      <p className={`mt-3 text-[1.95rem] font-bold tracking-[-0.04em] ${valueClassName}`}>{value}</p>
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

function formatInteger(value: number) {
  return new Intl.NumberFormat("es-DO").format(value);
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
