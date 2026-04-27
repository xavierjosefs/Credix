"use client";

import { clearSession } from "@/app/src/modules/auth/services/session.service";
import type { CashMovementRecord } from "@/app/src/modules/cash/types/cash.types";
import { getCashMovementsService } from "@/app/src/modules/cash/services/cash.service";
import AppSidebar from "@/app/src/modules/dashboard/components/AppSidebar";
import TablePagination from "@/app/src/modules/shared/components/TablePagination";
import { usePagination } from "@/app/src/modules/shared/hooks/usePagination";
import {
  formatCashMethod,
  formatCashRefId,
  formatDopCurrency,
  formatInteger,
  formatLoanCode,
  formatTime,
} from "@/app/src/modules/shared/utils/formatters";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function CashPageView() {
  const router = useRouter();
  const [filterMode, setFilterMode] = useState<"day" | "month" | "year">("day");
  const [selectedDay, setSelectedDay] = useState(getTodayDateInput());
  const [selectedMonth, setSelectedMonth] = useState(getTodayMonthInput());
  const [selectedYear, setSelectedYear] = useState(getTodayYearInput());
  const [selectedAdmin, setSelectedAdmin] = useState("ALL");
  const [query, setQuery] = useState("");
  const [movements, setMovements] = useState<CashMovementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingReport, setOpeningReport] = useState(false);
  const [openingReceiptId, setOpeningReceiptId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCashMovements = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCashMovementsService(
          filterMode === "day"
            ? { day: selectedDay }
            : filterMode === "month"
              ? { month: selectedMonth }
              : { year: selectedYear }
        );

        if (!cancelled) {
          setMovements(data);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar los movimientos de caja.";

        if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadCashMovements();

    return () => {
      cancelled = true;
    };
  }, [filterMode, selectedDay, selectedMonth, selectedYear]);

  const adminOptions = useMemo(() => {
    const adminMap = new Map<string, string>();

    for (const movement of movements) {
      if (movement.admin?.id && movement.admin.name) {
        adminMap.set(movement.admin.id, movement.admin.name);
      }
    }

    return Array.from(adminMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((firstAdmin, secondAdmin) => firstAdmin.name.localeCompare(secondAdmin.name, "es"));
  }, [movements]);

  const adminScopedMovements = useMemo(() => {
    if (selectedAdmin === "ALL") {
      return movements;
    }

    if (selectedAdmin === "UNASSIGNED") {
      return movements.filter((movement) => !movement.admin?.id);
    }

    return movements.filter((movement) => movement.admin?.id === selectedAdmin);
  }, [movements, selectedAdmin]);

  const filteredMovements = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) {
      return adminScopedMovements;
    }

    return adminScopedMovements.filter((movement) => {
      const refId = formatCashRefId(movement.id).toLowerCase();
      const customerName = movement.client?.name.toLowerCase() ?? "";
      const loanCode = movement.loanId ? formatLoanCode(movement.loanId).toLowerCase() : "";

      return (
        refId.includes(trimmedQuery) ||
        customerName.includes(trimmedQuery) ||
        loanCode.includes(trimmedQuery)
      );
    });
  }, [adminScopedMovements, query]);

  const summary = useMemo(() => {
    const totalIncome = adminScopedMovements
      .filter((movement) => movement.type === "INCOME")
      .reduce((sum, movement) => sum + movement.amount, 0);
    const totalExpense = adminScopedMovements
      .filter((movement) => movement.type === "EXPENSE")
      .reduce((sum, movement) => sum + movement.amount, 0);

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
    };
  }, [adminScopedMovements]);
  const movementsPagination = usePagination(filteredMovements, 10);

  const handleExpiredSession = () => {
    clearSession();
    router.replace("/login");
  };

  const handleOpenCashReport = () => {
    setOpeningReport(true);
    router.push(
      `/cash/report?${new URLSearchParams({
        mode: filterMode,
        ...(filterMode === "day" ? { day: selectedDay } : {}),
        ...(filterMode === "month" ? { month: selectedMonth } : {}),
        ...(filterMode === "year" ? { year: selectedYear } : {}),
        ...(selectedAdmin !== "ALL" ? { admin: selectedAdmin } : {}),
        ...(query.trim() ? { q: query.trim() } : {}),
      }).toString()}`
    );
  };

  const handleOpenMovementReport = (movement: CashMovementRecord) => {
    if (!movement.loanId) {
      return;
    }

    setOpeningReceiptId(movement.id);

    if (movement.type === "INCOME" && movement.paymentId) {
      router.push(
        `/loans/${movement.loanId}/payments/${movement.paymentId}/receipt?${new URLSearchParams({
          method: movement.method,
        }).toString()}`
      );

      return;
    }

    if (movement.type === "EXPENSE") {
      const mode =
        movement.description === "Monto agregado a préstamo existente" ? "TOPUP" : "NEW";

      router.push(
        `/loans/${movement.loanId}/disbursement?${new URLSearchParams({
          amount: String(movement.amount),
          issuedAt: movement.createdAt,
          method: movement.method,
          mode,
        }).toString()}`
      );
    }
  };

  return (
    <main className="bg-[#f4f7fb] text-[#1f3552] lg:h-screen lg:overflow-hidden">
      <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row">
        <AppSidebar />

        <section className="flex-1 lg:overflow-y-auto">
          <header className="border-b border-[#dfe6ef] bg-white px-5 py-5 sm:px-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h1 className="text-[2.2rem] font-bold tracking-[-0.03em] text-[#102844]">
                  Conciliacion Diaria de Caja
                </h1>
                <p className="mt-1 text-sm text-[#74879c]">
                  Consulta todos los ingresos y egresos registrados, o filtra por una fecha especifica.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenCashReport}
                  disabled={openingReport}
                  className="inline-flex h-11 items-center rounded-xl border border-[#d9e2ed] bg-white px-5 text-sm font-semibold text-[#24384f] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {openingReport ? <SpinnerIcon /> : <PrintIcon />}
                  <span className="ml-2">{openingReport ? "Abriendo reporte..." : "Imprimir Reporte"}</span>
                </button>
              </div>
            </div>
          </header>

          <div className="space-y-6 px-5 py-8 sm:px-8">
            <section className="flex flex-col gap-4 rounded-[24px] border border-[#d8e2ee] bg-white px-5 py-5 shadow-[0_12px_34px_rgba(29,46,77,0.05)] xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <div className="inline-flex rounded-2xl border border-[#dde7f1] bg-[#eef3f8] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <TabButton
                    label="Dia"
                    active={filterMode === "day"}
                    onClick={() => setFilterMode("day")}
                  />
                  <TabButton
                    label="Mes"
                    active={filterMode === "month"}
                    onClick={() => setFilterMode("month")}
                  />
                  <TabButton
                    label="Año"
                    active={filterMode === "year"}
                    onClick={() => setFilterMode("year")}
                  />
                </div>
                <label className="flex items-center gap-3 text-[1.05rem] text-[#60748d]">
                  <span className="font-medium">
                    {filterMode === "day" ? "Fecha:" : filterMode === "month" ? "Mes:" : "Año:"}
                  </span>
                  {filterMode === "day" ? (
                    <input
                      type="date"
                      value={selectedDay}
                      onChange={(event) => setSelectedDay(event.target.value)}
                      className="rounded-xl border border-[#d9e2ed] bg-white px-4 py-2 text-[#24384f] outline-none transition focus:border-[#bfd0e3]"
                    />
                  ) : filterMode === "month" ? (
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(event) => setSelectedMonth(event.target.value)}
                      className="rounded-xl border border-[#d9e2ed] bg-white px-4 py-2 text-[#24384f] outline-none transition focus:border-[#bfd0e3]"
                    />
                  ) : (
                    <input
                      type="number"
                      min="2000"
                      max="9999"
                      value={selectedYear}
                      onChange={(event) => setSelectedYear(event.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                      className="w-32 rounded-xl border border-[#d9e2ed] bg-white px-4 py-2 text-[#24384f] outline-none transition focus:border-[#bfd0e3]"
                    />
                  )}
                </label>
              </div>
            </section>

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

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(320px,0.9fr)]">
              <SummaryCard
                title="Total Ingresos (Pagos)"
                value={formatDopCurrency(summary.totalIncome)}
                tone="income"
                icon={<IncomeIcon />}
              />
              <SummaryCard
                title="Total Egresos (Nuevos Prestamos)"
                value={formatDopCurrency(summary.totalExpense)}
                tone="expense"
                icon={<ExpenseIcon />}
              />
              <SummaryCard
                title="Balance Neto de Caja"
                value={formatDopCurrency(summary.netBalance)}
                tone="balance"
                icon={<WalletIcon />}
                dark
              />
            </section>

            <section className="overflow-hidden rounded-[24px] border border-[#d8e2ee] bg-white shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
              <div className="flex flex-col gap-4 border-b border-[#e7edf5] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-[#32b23c]">
                    <TableIcon />
                  </div>
                  <h2 className="text-[1.9rem] font-bold tracking-[-0.03em] text-[#102844]">
                    Transacciones Diarias Detalladas
                  </h2>
                </div>

                <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
                  <select
                    value={selectedAdmin}
                    onChange={(event) => setSelectedAdmin(event.target.value)}
                    className="h-12 min-w-[220px] rounded-2xl border border-[#d9e2ed] bg-[#f8fafc] px-4 text-sm text-[#24384f] outline-none transition focus:border-[#bfd0e3] focus:bg-white"
                  >
                    <option value="ALL">Todos los movimientos</option>
                    {adminOptions.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name}
                      </option>
                    ))}
                    <option value="UNASSIGNED">Sin registro</option>
                  </select>

                  <div className="relative w-full lg:w-[320px]">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aacbf]">
                      <SearchIcon />
                    </span>
                    <input
                      type="text"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Buscar cliente o ID..."
                      className="h-12 w-full rounded-2xl border border-[#d9e2ed] bg-[#f8fafc] pl-11 pr-4 text-sm text-[#24384f] outline-none transition placeholder:text-[#8f9db0] focus:border-[#bfd0e3] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-[#f7f9fc] text-[11px] font-bold uppercase tracking-[0.16em] text-[#778aa1]">
                    <tr>
                      <th className="px-5 py-4">Ref ID</th>
                      <th className="px-5 py-4">Cliente</th>
                      <th className="px-5 py-4">Tipo de Transaccion</th>
                      <th className="px-5 py-4">Metodo</th>
                      <th className="px-5 py-4 text-right">Monto</th>
                      <th className="px-5 py-4">Estado</th>
                      <th className="px-5 py-4">Accion</th>
                      {filterMode === "day" ? <th className="px-5 py-4">Hora</th> : null}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={filterMode === "day" ? 8 : 7}
                          className="px-5 py-16 text-center text-sm text-[#7b8da2]"
                        >
                          Cargando movimientos...
                        </td>
                      </tr>
                    ) : filteredMovements.length === 0 ? (
                      <tr>
                        <td
                          colSpan={filterMode === "day" ? 8 : 7}
                          className="px-5 py-16 text-center text-sm text-[#7b8da2]"
                        >
                          {getEmptyStateMessage(filterMode)}
                        </td>
                      </tr>
                    ) : (
                      movementsPagination.paginatedItems.map((movement) => (
                        <tr key={movement.id} className="border-t border-[#edf1f6]">
                          <td className="px-5 py-5 font-semibold text-[#24384f]">
                            {formatCashRefId(movement.id)}
                          </td>
                          <td className="px-5 py-5 text-[#24384f]">
                            {movement.client?.name ?? "Sin cliente"}
                          </td>
                          <td className="px-5 py-5">
                            <div
                              className={`inline-flex items-center gap-2 text-sm font-medium ${
                                movement.type === "INCOME" ? "text-[#22a33a]" : "text-[#ef4444]"
                              }`}
                            >
                              {movement.type === "INCOME" ? <PlusIcon /> : <MinusIcon />}
                              <span>{movement.type === "INCOME" ? "Pago" : "Nuevo Prestamo"}</span>
                            </div>
                          </td>
                          <td className="px-5 py-5 text-[#60748d]">
                            {formatCashMethod(movement.method)}
                          </td>
                          <td
                            className={`px-5 py-5 text-right text-[1.05rem] font-bold ${
                              movement.type === "INCOME" ? "text-[#223753]" : "text-[#223753]"
                            }`}
                          >
                            {movement.type === "INCOME"
                              ? formatDopCurrency(movement.amount)
                              : `- ${formatDopCurrency(movement.amount)}`}
                          </td>
                          <td className="px-5 py-5">
                            <span className="inline-flex rounded-full bg-[#daf7e4] px-3 py-1 text-xs font-semibold text-[#179c44]">
                              Registrado
                            </span>
                          </td>
                          <td className="px-5 py-5">
                            {movement.loanId &&
                            ((movement.type === "INCOME" && movement.paymentId) ||
                              movement.type === "EXPENSE") ? (
                              <button
                                type="button"
                                onClick={() => handleOpenMovementReport(movement)}
                                disabled={openingReceiptId === movement.id}
                                className="inline-flex rounded-xl border border-[#d9e2ed] bg-white px-3 py-2 text-xs font-semibold text-[#24384f] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                {openingReceiptId === movement.id ? "Abriendo..." : "Ver reporte"}
                              </button>
                            ) : (
                              <span className="text-sm text-[#8ea0b5]">--</span>
                            )}
                          </td>
                          {filterMode === "day" ? (
                            <td className="px-5 py-5 text-[#60748d]">
                              {formatTime(movement.createdAt)}
                            </td>
                          ) : null}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {!loading && filteredMovements.length > 0 ? (
                <TablePagination
                  currentPage={movementsPagination.currentPage}
                  totalPages={movementsPagination.totalPages}
                  totalItems={movementsPagination.totalItems}
                  pageSize={movementsPagination.pageSize}
                  itemLabel="movimientos"
                  onPrevious={movementsPagination.goToPreviousPage}
                  onNext={movementsPagination.goToNextPage}
                />
              ) : null}

              <div className="flex flex-col gap-3 border-t border-[#e7edf5] bg-[#fbfcfe] px-6 py-5 text-sm text-[#74879c] lg:flex-row lg:items-center lg:justify-between">
                <div className="font-semibold uppercase tracking-[0.16em] text-[#778aa1]">
                  Totales del Dia
                </div>
                <div className="text-[2rem] font-bold tracking-[-0.04em] text-[#102844]">
                  {formatDopCurrency(summary.netBalance)}
                </div>
                <div>Todas las transacciones listadas son movimientos reales registrados en caja.</div>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <NoticeCard
                title="Aviso de Auditoria"
                description="Cada transaccion mostrada fue registrada desde los modulos de prestamos. El cierre diario definitivo puede anadirse mas adelante."
                tone="info"
              />
              <NoticeCard
                title="Nota Operativa"
                description={
                  filterMode === "day"
                    ? `Se encontraron ${formatInteger(filteredMovements.length)} movimientos para el dia seleccionado.`
                    : filterMode === "month"
                      ? `Se encontraron ${formatInteger(filteredMovements.length)} movimientos para el mes seleccionado.`
                      : `Se encontraron ${formatInteger(filteredMovements.length)} movimientos para el año seleccionado.`
                }
                tone="warning"
              />
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  tone,
  dark,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  tone: "income" | "expense" | "balance";
  dark?: boolean;
}) {
  const iconWrapperClassName =
    tone === "income"
      ? "bg-[#eef9f1] text-[#39a048]"
      : tone === "expense"
        ? "bg-[#fff0f0] text-[#e53935]"
        : "bg-white/10 text-white";

  return (
    <article
      className={`rounded-[24px] border px-6 py-6 shadow-[0_12px_34px_rgba(29,46,77,0.05)] ${
        dark
          ? "border-[#14314d] bg-[linear-gradient(180deg,_#173755_0%,_#18354d_100%)] text-white"
          : "border-[#d8e2ee] bg-white text-[#102844]"
      }`}
    >
      <div className="flex items-center gap-5">
        <div className={`flex h-18 w-18 items-center justify-center rounded-[20px] ${iconWrapperClassName}`}>
          {icon}
        </div>
        <div>
          <p className={`text-[1rem] ${dark ? "text-[#c7d8e8]" : "text-[#5f748d]"}`}>{title}</p>
          <p className="mt-2 text-[3rem] font-bold leading-none tracking-[-0.05em]">{value}</p>
        </div>
      </div>
    </article>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[16px] px-6 py-3 text-[1.05rem] font-medium transition ${
        active
          ? "border border-[#c9d9ea] bg-white text-[#102844] shadow-[0_10px_18px_rgba(16,40,68,0.10)]"
          : "border border-transparent text-[#60748d] hover:bg-white/70 hover:text-[#314861]"
      }`}
    >
      {label}
    </button>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 animate-spin fill-current">
      <path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8Z" />
    </svg>
  );
}

function NoticeCard({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: "info" | "warning";
}) {
  const className =
    tone === "info"
      ? "border-[#c7dbff] bg-[#eef5ff] text-[#1f4fbf]"
      : "border-[#ffe1a6] bg-[#fff8e8] text-[#a55211]";

  return (
    <section className={`rounded-[22px] border px-6 py-5 ${className}`}>
      <h3 className="text-[1.4rem] font-bold tracking-[-0.03em]">{title}</h3>
      <p className="mt-3 text-[1.02rem] leading-8">{description}</p>
    </section>
  );
}

function getTodayDateInput() {
  return new Date().toISOString().split("T")[0] ?? "";
}

function getTodayMonthInput() {
  return new Date().toISOString().slice(0, 7);
}

function getTodayYearInput() {
  return String(new Date().getFullYear());
}

function getEmptyStateMessage(filterMode: "day" | "month" | "year") {
  if (filterMode === "day") {
    return "No hay movimientos registrados para esta fecha.";
  }

  if (filterMode === "month") {
    return "No hay movimientos registrados para este mes.";
  }

  return "No hay movimientos registrados para este año.";
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M10 2a8 8 0 1 0 5 14.24l4.38 4.38 1.42-1.42-4.38-4.38A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1-6 6 6 6 0 0 1 6-6Z" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M7 3h10v4H7Zm10 6h1a3 3 0 0 1 3 3v5h-4v4H7v-4H3v-5a3 3 0 0 1 3-3h1v2h10Zm-2 10v-5H9v5Z" />
    </svg>
  );
}

function IncomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current">
      <path d="m14 3 1.41 1.41-2.58 2.59H21v2h-8.17l2.58 2.59L14 13l-5-5ZM5 5h5v2H7v10h10v-3h2v5H5Z" />
    </svg>
  );
}

function ExpenseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current">
      <path d="m10 3 1.41 1.41L8.83 7H17v2H8.83l2.58 2.59L10 13l-5-5Zm9 6h-2v8H7v-3H5v5h14Z" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current">
      <path d="M4 7a3 3 0 0 1 3-3h11v2H7a1 1 0 0 0 0 2h13v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7Zm13 6a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 17 13Z" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
      <path d="M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 4v12h16V7ZM6 9h4v3H6Zm0 5h4v3H6Zm6-5h6v3h-6Zm0 5h6v3h-6Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4Z" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm5 11H7v-2h10Z" />
    </svg>
  );
}
