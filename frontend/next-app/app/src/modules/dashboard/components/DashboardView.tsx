"use client";

import {
  clearSession,
  getStoredUser,
  getStoredUserServerSnapshot,
  subscribeStoredUser,
} from "@/app/src/modules/auth/services/session.service";
import { getClientsService, getClientLoansService } from "@/app/src/modules/client/services/client.service";
import type {
  ClientLoanRecord,
  ClientRecord,
  LoanPaymentRecord,
} from "@/app/src/modules/client/types/client.types";
import AppSidebar from "@/app/src/modules/dashboard/components/AppSidebar";
import TablePagination from "@/app/src/modules/shared/components/TablePagination";
import { usePagination } from "@/app/src/modules/shared/hooks/usePagination";
import ThemeToggle from "@/app/src/modules/theme/components/ThemeToggle";
import type { AuthUser } from "@/app/src/modules/types/auth.types";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

type DashboardPaymentRow = LoanPaymentRecord & {
  clientName: string;
  clientInitials: string;
  clientProfileImage?: string | null;
  loanCode: string;
  loanStatus: ClientLoanRecord["status"];
};

export default function DashboardView() {
  const router = useRouter();
  const user = useSyncExternalStore(
    subscribeStoredUser,
    getStoredUser,
    getStoredUserServerSnapshot
  ) as AuthUser | null;
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loans, setLoans] = useState<ClientLoanRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const clientsResponse = await getClientsService();
        const clientList = clientsResponse.data;

        const loanLists = await Promise.all(
          clientList.map((client) => getClientLoansService(client.id))
        );

        if (!cancelled) {
          setClients(clientList);
          setLoans(loanLists.flat());
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudo cargar el dashboard.";

        if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleExpiredSession = () => {
    clearSession();
    router.replace("/login");
  };

  const dashboardMetrics = useMemo(() => {
    const activeLoans = loans.filter((loan) => loan.status === "ACTIVE").length;
    const lateLoans = loans.filter((loan) => loan.status === "LATE").length;
    const totalAccruedInterest = loans
      .filter((loan) => loan.status !== "PAID")
      .reduce((sum, loan) => sum + loan.currentAccruedInterest, 0);
    const todayCollections = loans
      .flatMap((loan) => loan.payments)
      .filter((payment) => isToday(payment.paymentDate))
      .reduce((sum, payment) => sum + payment.amount, 0);

    return {
      activeLoans,
      todayCollections,
      lateLoans,
      totalAccruedInterest,
      totalClients: clients.length,
      totalPendingBalance: loans
        .filter((loan) => loan.status !== "PAID")
        .reduce((sum, loan) => sum + loan.remainingBalance, 0),
    };
  }, [clients.length, loans]);

  const recentPayments = useMemo<DashboardPaymentRow[]>(() => {
    const clientMap = new Map(clients.map((client) => [client.id, client]));

    return loans
      .flatMap((loan) =>
        loan.payments.map((payment) => {
          const client = clientMap.get(loan.clientId);
          return {
            ...payment,
            clientName: client?.name ?? "Cliente",
            clientInitials: getInitials(client?.name ?? "Cliente"),
            clientProfileImage: client?.profileImage ?? null,
            loanCode: formatLoanCode(loan.id),
            loanStatus: loan.status,
          };
        })
      )
      .sort(
        (left, right) =>
          new Date(right.paymentDate).getTime() - new Date(left.paymentDate).getTime()
      )
      .slice(0, 20);
  }, [clients, loans]);

  const liveActions = useMemo(
    () => [
      {
        title: "Prestamos en mora",
        description: `${dashboardMetrics.lateLoans} requieren seguimiento inmediato.`,
        tone: "danger" as const,
        icon: AlertIcon,
      },
      {
        title: "Clientes registrados",
        description: `${dashboardMetrics.totalClients} clientes activos en la cartera.`,
        tone: "blue" as const,
        icon: UserGroupIcon,
      },
      {
        title: "Saldo pendiente",
        description: `${formatCurrency(
          dashboardMetrics.totalPendingBalance
        )} pendientes por recuperar.`,
        tone: "green" as const,
        icon: WalletIcon,
      },
    ],
    [dashboardMetrics]
  );
  const paymentsPagination = usePagination(recentPayments, 5);

  const userName = user?.name ?? "Usuario";
  const userEmail = user?.email ?? "Sin correo";

  const handleDashboardSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      router.push("/clients");
      return;
    }

    router.push(`/clients?${new URLSearchParams({ search: trimmedQuery }).toString()}`);
  };

  return (
    <main className="bg-[#f4f7fb] text-[#1f3552] lg:h-screen lg:overflow-hidden">
      <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row">
        <AppSidebar />

        <section className="flex-1 lg:overflow-y-auto">
          <header className="flex flex-col gap-3 border-b border-[#dfe6ef] bg-white px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
            <form onSubmit={handleDashboardSearch} className="w-full max-w-[478px]">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#92a1b5]">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar clientes por nombre, cedula o correo..."
                  className="h-12 w-full rounded-lg border border-[#dde5ef] bg-[#f8fafc] pl-11 pr-4 text-sm text-[#213650] outline-none transition placeholder:text-[#8f9fb1] focus:border-[#bfd0e3] focus:bg-white"
                />
              </div>
            </form>

            <div className="flex items-center justify-between gap-3 xl:justify-end">
              <div className="flex items-center gap-2 text-[#304863]">
                <ThemeToggle iconOnly />
                <button className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[#f1f5f9]">
                  <BellIcon />
                  {dashboardMetrics.lateLoans > 0 && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ef4444]" />
                  )}
                </button>
              </div>

              <Link
                href="/clients/new"
                className="inline-flex h-10 items-center rounded-lg bg-[#6ab74a] px-4 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(106,183,74,0.18)] transition hover:bg-[#5da63f]"
              >
                <span className="mr-2 text-base">+</span>
                Nuevo Cliente
              </Link>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6">
            <div className="mb-7">
              <h1 className="text-[2rem] font-bold tracking-[-0.03em] text-[#203754]">
                Resumen Operativo
              </h1>
              <p className="mt-1 text-lg text-[#73859b]">
                Bienvenido, {userName}. Sesion iniciada con {userEmail}.
              </p>
            </div>

            {error ? (
              <section className="mb-6 rounded-2xl border border-[#f5caca] bg-[#fff5f5] px-5 py-4 text-sm text-[#c24141]">
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

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_228px]">
              <div className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    title="Prestamos Activos"
                    value={loading ? "..." : formatInteger(dashboardMetrics.activeLoans)}
                    hint={loading ? "Cargando" : `${dashboardMetrics.totalClients} clientes`}
                    hintTone="positive"
                    iconTone="blue"
                  />
                  <MetricCard
                    title="Cobros de Hoy"
                    value={loading ? "..." : formatCurrency(dashboardMetrics.todayCollections)}
                    hint="Hoy"
                    hintTone="neutral"
                    iconTone="green"
                  />
                  <MetricCard
                    title="Prestamos en Mora"
                    value={loading ? "..." : formatInteger(dashboardMetrics.lateLoans)}
                    hint={dashboardMetrics.lateLoans > 0 ? "Pendientes" : "Al dia"}
                    hintTone={dashboardMetrics.lateLoans > 0 ? "danger" : "positive"}
                    iconTone="orange"
                  />
                  <MetricCard
                    title="Intereses por Cobrar"
                    value={loading ? "..." : formatCurrency(dashboardMetrics.totalAccruedInterest)}
                    hint="Ganancia acumulada"
                    hintTone="positive"
                    iconTone="green"
                  />
                </div>

                <section className="overflow-hidden rounded-2xl border border-[#dfe6ef] bg-white shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
                  <div className="flex items-center justify-between border-b border-[#e8edf4] px-6 py-5">
                    <h2 className="text-[2rem] font-bold tracking-[-0.04em] text-[#213754]">
                      Pagos Recientes
                    </h2>
                    <Link
                      href="/clients"
                      className="text-sm font-semibold text-[#65b442] transition hover:text-[#549635]"
                    >
                      Ver clientes
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead className="bg-[#f7f9fc] text-[12px] font-bold uppercase tracking-[0.16em] text-[#8a9aaf]">
                        <tr>
                          <th className="px-5 py-4">Cliente</th>
                          <th className="px-5 py-4">Prestamo ID</th>
                          <th className="px-5 py-4">Monto</th>
                          <th className="px-5 py-4">Fecha/Hora</th>
                          <th className="px-5 py-4">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="px-5 py-14 text-center text-sm text-[#7b8da2]">
                              Cargando pagos...
                            </td>
                          </tr>
                        ) : recentPayments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-5 py-14 text-center text-sm text-[#7b8da2]">
                              Aun no hay pagos registrados.
                            </td>
                          </tr>
                        ) : (
                          paymentsPagination.paginatedItems.map((payment) => (
                            <tr key={payment.id} className="border-t border-[#edf1f6]">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  {payment.clientProfileImage ? (
                                    <div className="relative h-9 w-9 overflow-hidden rounded-full bg-[#eef2f7]">
                                      <Image
                                        src={payment.clientProfileImage}
                                        alt={payment.clientName}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef2f7] text-xs font-bold text-[#7c8fa5]">
                                      {payment.clientInitials}
                                    </div>
                                  )}
                                  <span className="text-[1.05rem] font-semibold leading-6 text-[#344a65]">
                                    {payment.clientName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-[1.05rem] text-[#647791]">
                                {payment.loanCode}
                              </td>
                              <td className="px-5 py-4 text-[1.1rem] font-semibold text-[#283b53]">
                                {formatCurrency(payment.amount)}
                              </td>
                              <td className="px-5 py-4 text-[1.05rem] text-[#72839a]">
                                {formatPaymentDateTime(payment.paymentDate)}
                              </td>
                              <td className="px-5 py-4">
                                <StatusPill tone={payment.loanStatus === "LATE" ? "warning" : "success"}>
                                  {payment.loanStatus === "PAID" ? "Liquidado" : "Registrado"}
                                </StatusPill>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {!loading && recentPayments.length > 0 ? (
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
                </section>
              </div>

              <aside className="rounded-2xl border border-[#dfe6ef] bg-white p-6 shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
                <h2 className="text-[2rem] font-bold tracking-[-0.04em] text-[#213754]">
                  Estado Actual
                </h2>

                <div className="mt-7 space-y-8">
                  {liveActions.map((action) => (
                    <div key={action.title} className="flex gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${quickIconTone(action.tone)}`}
                      >
                        <action.icon />
                      </div>
                      <div>
                        <h3 className="text-[1.1rem] font-semibold text-[#2a3e58]">
                          {action.title}
                        </h3>
                        <p className="mt-1 text-sm leading-5 text-[#7b8a9e]">
                          {loading ? "Cargando..." : action.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 border-t border-[#ebeff5] pt-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8c9cb1]">
                    Estado del Servidor
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-[#5f738d]">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          error ? "bg-[#ef4444]" : "bg-[#22c55e]"
                        }`}
                      />
                      <span>{error ? "Con incidencias" : "Conectado"}</span>
                    </div>
                    <span className="text-sm text-[#97a6b8]">
                      {loading ? "sincronizando" : `${loans.length} prestamos`}
                    </span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
  hint,
  hintTone,
  iconTone,
}: {
  title: string;
  value: string;
  hint: string;
  hintTone: "positive" | "neutral" | "danger";
  iconTone: "blue" | "green" | "orange";
}) {
  return (
    <article className="rounded-2xl border border-[#dfe6ef] bg-white p-5 shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
      <div className="flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${metricIconTone(iconTone)}`}>
          {iconTone === "blue" && <DocumentIcon />}
          {iconTone === "green" && <CashIcon />}
          {iconTone === "orange" && <ClipboardIcon />}
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${metricHintTone(hintTone)}`}>
          {hint}
        </span>
      </div>

      <p className="mt-6 text-lg font-medium text-[#7a8aa0]">{title}</p>
      <p className="mt-2 text-[2.2rem] font-bold leading-none tracking-[-0.04em] text-[#223753]">
        {value}
      </p>
    </article>
  );
}

function StatusPill({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "success" | "warning";
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        tone === "success"
          ? "bg-[#e8f8eb] text-[#4aae63]"
          : "bg-[#fff2e6] text-[#f08a34]"
      }`}
    >
      {children}
    </span>
  );
}

function metricIconTone(tone: "blue" | "green" | "orange") {
  if (tone === "blue") return "bg-[#e6efff] text-[#3b82f6]";
  if (tone === "green") return "bg-[#ecf8ec] text-[#62b24d]";
  return "bg-[#fff2e6] text-[#ea6a14]";
}

function metricHintTone(tone: "positive" | "neutral" | "danger") {
  if (tone === "positive") return "bg-[#e9f8ea] text-[#4cb663]";
  if (tone === "danger") return "bg-[#fff1ef] text-[#ef4444]";
  return "bg-transparent text-[#a0aec0]";
}

function quickIconTone(tone: "danger" | "blue" | "green") {
  if (tone === "danger") return "bg-[#fff0f0] text-[#ef4444]";
  if (tone === "blue") return "bg-[#edf4ff] text-[#3b82f6]";
  return "bg-[#eef8ed] text-[#65b24c]";
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

function formatLoanCode(loanId: string) {
  return `#PR-${loanId.slice(0, 4).toUpperCase()}`;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function isToday(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function formatPaymentDateTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M10 2a8 8 0 1 0 5 14.24l4.38 4.38 1.42-1.42-4.38-4.38A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1-6 6 6 6 0 0 1 6-6Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5L3 18v1h18v-1Z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M6 2h8l4 4v16H6Zm8 1.5V7h3.5ZM8 11h8v2H8Zm0 4h8v2H8Z" />
    </svg>
  );
}

function CashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M3 6h18v12H3Zm2 2v8h14V8Zm7 1.5A2.5 2.5 0 1 1 9.5 12 2.5 2.5 0 0 1 12 9.5Z" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M9 3h6l1 2h3v16H5V5h3Zm3 4a1.5 1.5 0 1 0-1.5-1.5A1.5 1.5 0 0 0 12 7Zm-3 4h6v2H9Zm0 4h6v2H9Z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 3 2 21h20Zm1 14h-2v-2h2Zm0-4h-2v-4h2Z" />
    </svg>
  );
}

function UserGroupIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 1a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4ZM8 14c-.29 0-.62.02-.97.05C5.4 14.29 2 15.09 2 18v2h4v-2c0-1.16.58-2.18 1.57-3A8.5 8.5 0 0 1 8 14Z" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M4 7a3 3 0 0 1 3-3h11v2H7a1 1 0 0 0 0 2h13v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7Zm13 6a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 17 13Z" />
    </svg>
  );
}
