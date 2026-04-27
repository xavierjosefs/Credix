"use client";

import {
  clearSession,
  getStoredUser,
  getStoredUserServerSnapshot,
  subscribeStoredUser,
} from "@/app/src/modules/auth/services/session.service";
import { getCashMovementsService } from "@/app/src/modules/cash/services/cash.service";
import type { CashMovementRecord } from "@/app/src/modules/cash/types/cash.types";
import DocumentPageShell from "@/app/src/modules/shared/components/DocumentPageShell";
import {
  formatCashMethod,
  formatCashRefId,
  formatCurrentDateTime,
  formatDateTime,
  formatDopCurrency,
  formatLoanCode,
} from "@/app/src/modules/shared/utils/formatters";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

type CashReportParams = {
  mode?: string;
  day?: string;
  month?: string;
  year?: string;
  admin?: string;
  q?: string;
};

export default function CashReportPageView({
  initialParams,
}: {
  initialParams: CashReportParams;
}) {
  const router = useRouter();
  const user = useSyncExternalStore(
    subscribeStoredUser,
    getStoredUser,
    getStoredUserServerSnapshot
  );
  const [movements, setMovements] = useState<CashMovementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mode = normalizeMode(initialParams.mode);
  const selectedAdmin = initialParams.admin ?? "ALL";
  const query = initialParams.q?.trim().toLowerCase() ?? "";

  useEffect(() => {
    let cancelled = false;

    const loadReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCashMovementsService(
          mode === "day"
            ? { day: initialParams.day }
            : mode === "month"
              ? { month: initialParams.month }
              : { year: initialParams.year }
        );

        if (!cancelled) {
          setMovements(data);
        }
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "No se pudo cargar el reporte de caja.";

        if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadReport();

    return () => {
      cancelled = true;
    };
  }, [initialParams.day, initialParams.month, initialParams.year, mode]);

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
    if (!query) {
      return adminScopedMovements;
    }

    return adminScopedMovements.filter((movement) => {
      const refId = formatCashRefId(movement.id).toLowerCase();
      const customerName = movement.client?.name.toLowerCase() ?? "";
      const loanCode = movement.loanId ? formatLoanCode(movement.loanId).toLowerCase() : "";

      return refId.includes(query) || customerName.includes(query) || loanCode.includes(query);
    });
  }, [adminScopedMovements, query]);

  const summary = useMemo(() => {
    const totalIncome = filteredMovements
      .filter((movement) => movement.type === "INCOME")
      .reduce((sum, movement) => sum + movement.amount, 0);
    const totalExpense = filteredMovements
      .filter((movement) => movement.type === "EXPENSE")
      .reduce((sum, movement) => sum + movement.amount, 0);

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
    };
  }, [filteredMovements]);

  const reportTitle =
    mode === "day"
      ? "Reporte Diario de Caja"
      : mode === "month"
        ? "Reporte Mensual de Caja"
        : "Reporte Anual de Caja";

  const reportPeriodLabel =
    mode === "day"
      ? formatHumanDay(initialParams.day)
      : mode === "month"
        ? formatHumanMonth(initialParams.month)
        : initialParams.year ?? "Periodo no especificado";

  const handleExpiredSession = () => {
    clearSession();
    router.replace("/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f7fb] px-5 py-10 text-[#213754] sm:px-8">
        <section className="mx-auto max-w-[1120px] rounded-[28px] border border-[#d8e2ee] bg-white px-6 py-16 text-center text-sm text-[#7b8da2] shadow-[0_18px_40px_rgba(29,46,77,0.05)]">
          Generando reporte de caja...
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f4f7fb] px-5 py-10 text-[#213754] sm:px-8">
        <section className="mx-auto max-w-[1120px] rounded-[28px] border border-[#f5caca] bg-[#fff5f5] px-6 py-8 text-sm text-[#c24141] shadow-[0_18px_40px_rgba(29,46,77,0.05)]">
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
      </main>
    );
  }

  return (
    <DocumentPageShell
      subtitle={reportTitle}
      navItems={[{ href: "/cash", label: "Caja" }]}
      onPrint={() => window.print()}
    >
      <article className="mx-auto max-w-[920px] rounded-[26px] bg-white px-7 py-8 shadow-[0_24px_60px_rgba(29,46,77,0.12)] print:max-w-none print:break-inside-avoid print:rounded-none print:px-6 print:py-5 print:shadow-none">
        <div className="flex flex-col gap-5 print:flex-row print:items-start print:justify-between lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="relative h-[72px] w-[72px] overflow-hidden rounded-md border border-[#d8e2ee]">
              <Image
                src="/images/logo.png"
                alt="Inversiones Fernandez"
                fill
                className="object-contain p-2.5"
                unoptimized
              />
            </div>
            <div className="space-y-1 text-[13px] text-[#475b76]">
              <p className="font-semibold text-[#102844]">INVERSIONES FERNANDEZ S.R.L.</p>
              <p>Gestion operativa de caja</p>
              <p>Santo Domingo, Rep. Dom.</p>
            </div>
          </div>

          <div className="text-left print:text-right lg:text-right">
            <h1 className="text-[1.7rem] font-bold tracking-[-0.04em] text-[#102844]">
              {reportTitle.toUpperCase()}
            </h1>
            <p className="mt-2 text-[1.35rem] font-bold tracking-[-0.03em] text-[#167c22]">
              {reportPeriodLabel}
            </p>
            <div className="mt-2 space-y-1 text-[12px] tracking-[0.16em] text-[#334a67]">
              <p>GENERADO: {formatCurrentDateTime()}</p>
              <p>ADMIN: {resolveAdminLabel(selectedAdmin, filteredMovements, user?.name)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 print:grid-cols-3 print:gap-5 md:grid-cols-3">
          <SummaryTile title="Ingresos" value={formatDopCurrency(summary.totalIncome)} tone="green" />
          <SummaryTile title="Egresos" value={formatDopCurrency(summary.totalExpense)} tone="red" />
          <SummaryTile
            title="Balance neto"
            value={formatSignedDopCurrency(summary.netBalance)}
            tone="navy"
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-[20px] border border-[#e4eaf2] print:break-inside-avoid">
          <table className="min-w-full">
            <thead className="bg-[#f5f7fb] text-left text-[10px] font-bold uppercase tracking-[0.18em] text-[#51667f]">
              <tr>
                <th className="px-4 py-3">Ref ID</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Metodo</th>
                <th className="px-4 py-3">Administrador</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-right">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#7b8da2]">
                    No hay movimientos para este periodo.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement) => (
                  <tr key={movement.id} className="border-t border-[#edf1f6] text-[#213754]">
                    <td className="px-4 py-3 text-sm font-semibold text-[#24384f]">
                      {formatCashRefId(movement.id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#24384f]">
                      {movement.client?.name ?? "Sin cliente"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#24384f]">
                      {movement.type === "INCOME" ? "Pago" : "Nuevo prestamo"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#60748d]">
                      {formatCashMethod(movement.method)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#60748d]">
                      {movement.admin?.name ?? "Sin registro"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-[#223753]">
                      {movement.type === "INCOME"
                        ? formatDopCurrency(movement.amount)
                        : `- ${formatDopCurrency(movement.amount)}`}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-[#60748d]">
                      {formatDateTime(movement.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-end print:mt-6">
          <div className="w-full max-w-[360px] space-y-2 print:w-[360px] print:max-w-[360px]">
            <ResumeRow label="Total de ingresos" value={formatDopCurrency(summary.totalIncome)} />
            <ResumeRow label="Total de egresos" value={formatDopCurrency(summary.totalExpense)} />
            <div className="rounded-[18px] bg-[#167c22] px-5 py-4 text-white shadow-[0_16px_28px_rgba(22,124,34,0.22)]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[13px] font-bold uppercase tracking-[0.16em]">
                  Balance neto
                </span>
                <span className="whitespace-nowrap text-[1.85rem] font-bold tracking-[-0.05em]">
                  {formatSignedDopCurrency(summary.netBalance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#e6edf4] pt-5 text-center text-[10px] leading-5 text-[#6c8099] print:mt-6 print:pt-4">
          Reporte generado con movimientos reales registrados en caja para el periodo seleccionado.
          Conservar este documento para auditoria y control interno.
        </div>
      </article>
    </DocumentPageShell>
  );
}

function SummaryTile({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "green" | "red" | "navy";
}) {
  const classes =
    tone === "green"
      ? "border-[#d8ecd1] bg-[#f3fbf1] text-[#167c22]"
      : tone === "red"
        ? "border-[#f0d6d6] bg-[#fff5f5] text-[#c24141]"
        : "border-[#d8e2ee] bg-[#14314d] text-white";

      return (
    <div className={`rounded-[20px] border px-5 py-4 ${classes}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-80">{title}</p>
      <p className="mt-2 whitespace-nowrap text-[1.7rem] font-bold tracking-[-0.04em]">{value}</p>
    </div>
  );
}

function ResumeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[1.02rem]">
      <span className="font-semibold uppercase tracking-[0.12em] text-[#536981]">{label}</span>
      <span className="whitespace-nowrap font-bold text-[#334a67]">{value}</span>
    </div>
  );
}

function formatSignedDopCurrency(value: number) {
  return value < 0 ? `-${formatDopCurrency(Math.abs(value))}` : formatDopCurrency(value);
}

function normalizeMode(mode?: string) {
  return mode === "month" || mode === "year" ? mode : "day";
}

function resolveAdminLabel(
  selectedAdmin: string,
  movements: CashMovementRecord[],
  fallbackName?: string | null
) {
  if (selectedAdmin === "ALL") {
    return "Todos los movimientos";
  }

  if (selectedAdmin === "UNASSIGNED") {
    return "Sin registro";
  }

  return (
    movements.find((movement) => movement.admin?.id === selectedAdmin)?.admin?.name ??
    fallbackName ??
    "Administrador"
  );
}

function formatHumanDay(day?: string) {
  if (!day) return "Dia no especificado";

  const date = new Date(`${day}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Dia no especificado";
  }

  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatHumanMonth(month?: string) {
  if (!month) return "Mes no especificado";

  const [year, monthNumber] = month.split("-");
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);

  if (Number.isNaN(date.getTime())) {
    return "Mes no especificado";
  }

  return new Intl.DateTimeFormat("es-DO", {
    month: "long",
    year: "numeric",
  }).format(date);
}
