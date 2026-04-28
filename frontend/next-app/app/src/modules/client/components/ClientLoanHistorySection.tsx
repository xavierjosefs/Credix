"use client";

import TablePagination from "@/app/src/modules/shared/components/TablePagination";
import type { ClientLoanRecord, LoanStatus } from "@/app/src/modules/client/types/client.types";

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="detail-section rounded-[24px] border border-[#d8e2ee] bg-white shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
      <div className="flex flex-col gap-3 border-b border-[#e7edf5] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[1.5rem] font-bold tracking-[-0.03em] text-[#102844]">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function StatusBadge({ status }: { status: LoanStatus }) {
  const styles =
    status === "PAID"
      ? "border border-[#dbe8d3] bg-[#f2f7ef] text-[#547848] dark:border-[#345a2e] dark:bg-[#162917] dark:text-[#8fe06f]"
      : status === "LATE"
        ? "border border-[#f0ddd3] bg-[#fcf5f1] text-[#b46036] dark:border-[#6c2c2c] dark:bg-[#33181a] dark:text-[#ff8a8a]"
        : "border border-[#d8e3f2] bg-[#f2f6fb] text-[#42648b] dark:border-[#234f84] dark:bg-[#0f2742] dark:text-[#7bb0ff]";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>
      {status === "PAID" ? "Liquidado" : status === "LATE" ? "En Mora" : "Activo"}
    </span>
  );
}

function LoanFilterButton({
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
      className={`loan-filter-button rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active
          ? "loan-filter-button-active bg-[#f3f7fb] text-[#24384f] shadow-[0_6px_14px_rgba(29,46,77,0.08)]"
          : "text-[#8a9aaf] hover:text-[#60748d]"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d7e2ee] bg-[#fbfcfe] px-5 py-10 text-center">
      <p className="text-lg font-semibold text-[#24384f]">{title}</p>
      <p className="mt-2 text-sm text-[#7b8da2]">{description}</p>
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

function formatTableDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatLoanCode(loanId: string) {
  return `#PR-${loanId.slice(0, 4).toUpperCase()}`;
}

function formatLoanSubtitle(loan: ClientLoanRecord) {
  const paymentCount = loan.payments.length;
  const duration = loan.frequency === "MONTHLY" ? "30 dias" : "15 dias";

  return `${loan.frequency === "MONTHLY" ? "mensual" : "quincenal"} · ${duration} · ${paymentCount} pago${
    paymentCount === 1 ? "" : "s"
  }`;
}

function getLoanActionLabel(status: LoanStatus) {
  if (status === "PAID") {
    return "Ver Recibo";
  }

  if (status === "LATE") {
    return "Gestionar Cobro";
  }

  return "Ver Detalle";
}

export default function ClientLoanHistorySection({
  loans,
  loanFilter,
  onLoanFilterChange,
  paginatedLoans,
  pagination,
  loanSummary,
}: {
  loans: ClientLoanRecord[];
  loanFilter: "ALL" | "ACTIVE" | "PAID";
  onLoanFilterChange: (value: "ALL" | "ACTIVE" | "PAID") => void;
  paginatedLoans: ClientLoanRecord[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    goToPreviousPage: () => void;
    goToNextPage: () => void;
  };
  loanSummary: {
    totalLoans: number;
    pendingLoans: number;
    lateLoans: number;
  };
}) {
  return (
    <DetailSection title="Historial de Prestamos">
      {loans.length === 0 ? (
        <EmptyState
          title="Sin prestamos registrados"
          description="Este cliente todavia no tiene prestamos asociados."
        />
      ) : (
        <div className="overflow-hidden rounded-[22px] border border-[#e4ebf3] bg-[#fbfcfe]">
          <div className="flex flex-col gap-4 border-b border-[#e7edf5] px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#102844]">Historial completo del cliente</p>
              <p className="mt-1 text-xs text-[#8193a8]">
                Revisa prestamos activos, liquidados y cuentas en mora.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white p-1 shadow-[0_8px_18px_rgba(29,46,77,0.06)]">
              <LoanFilterButton
                label="Todos"
                active={loanFilter === "ALL"}
                onClick={() => onLoanFilterChange("ALL")}
              />
              <LoanFilterButton
                label="Activos"
                active={loanFilter === "ACTIVE"}
                onClick={() => onLoanFilterChange("ACTIVE")}
              />
              <LoanFilterButton
                label="Liquidados"
                active={loanFilter === "PAID"}
                onClick={() => onLoanFilterChange("PAID")}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-[#f7f9fc] text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a9aaf]">
                <tr>
                  <th className="px-5 py-4">Referencia</th>
                  <th className="px-5 py-4">Monto</th>
                  <th className="px-5 py-4">Fecha Inicio</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Accion</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {paginatedLoans.map((loan) => (
                  <tr
                    key={loan.id}
                    className="border-t border-[#edf1f6] transition hover:bg-[#f8fbfe]"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-lg font-bold text-[#2d4766]">{formatLoanCode(loan.id)}</p>
                        <p className="mt-1 text-xs text-[#94a3b8]">{formatLoanSubtitle(loan)}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[1.05rem] font-bold text-[#4a5f7a]">
                      {formatCurrency(loan.principalAmount)}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-[#61748d]">
                      {formatTableDate(loan.startDate)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={loan.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        className={`text-sm font-semibold transition ${
                          loan.status === "LATE"
                            ? "text-[#ef4444] hover:text-[#dc2626]"
                            : "text-[#63b649] hover:text-[#549e3d]"
                        }`}
                      >
                        {getLoanActionLabel(loan.status)}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#e7edf5] px-5 py-4 text-sm text-[#8a9aaf] md:flex-row md:items-center md:justify-between">
            <p>
              Mostrando {pagination.totalItems} de {loanSummary.totalLoans} registros
            </p>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#eef8ed] px-3 py-1 text-xs font-semibold text-[#4f9938]">
                {loanSummary.pendingLoans} pendientes
              </span>
              <span className="rounded-full bg-[#fff3ea] px-3 py-1 text-xs font-semibold text-[#dd6b20]">
                {loanSummary.lateLoans} en mora
              </span>
            </div>
          </div>

          <TablePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            itemLabel="prestamos"
            onPrevious={pagination.goToPreviousPage}
            onNext={pagination.goToNextPage}
          />
        </div>
      )}
    </DetailSection>
  );
}
