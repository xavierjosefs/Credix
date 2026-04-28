"use client";

import { clearSession } from "@/app/src/modules/auth/services/session.service";
import type { ClientLoanRecord } from "@/app/src/modules/client/types/client.types";
import { getLoanByIdService } from "@/app/src/modules/loan/services/loan.service";
import DocumentPageShell from "@/app/src/modules/shared/components/DocumentPageShell";
import {
  formatDateTime,
  formatDopCurrency,
  formatLoanCode,
  formatLoanStatus,
  formatPaymentMethod,
  formatReceiptDate,
} from "@/app/src/modules/shared/utils/formatters";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type LoanDisbursementMode = "NEW" | "TOPUP";

export default function LoanDisbursementReceiptPageView({
  loanId,
  mode,
  amount,
  method,
  issuedAt,
  previousBalance,
  newBalance,
}: {
  loanId: string;
  mode?: string;
  amount?: string;
  method?: string;
  issuedAt?: string;
  previousBalance?: string;
  newBalance?: string;
}) {
  const router = useRouter();
  const [loan, setLoan] = useState<ClientLoanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "No se pudo cargar el comprobante.";

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

  const normalizedMode: LoanDisbursementMode = mode === "TOPUP" ? "TOPUP" : "NEW";
  const deliveredAmount = parseMoneyValue(amount) ?? 0;
  const issuedAtValue = issuedAt ?? loan?.createdAt ?? new Date().toISOString();
  const previousBalanceValue = parseMoneyValue(previousBalance);
  const newBalanceValue = parseMoneyValue(newBalance);
  const methodLabel = formatPaymentMethod(method);

  const resolvedPreviousBalance = useMemo(() => {
    if (previousBalanceValue !== null) {
      return previousBalanceValue;
    }

    if (normalizedMode === "NEW") {
      return 0;
    }

    if (!loan) {
      return 0;
    }

    return Math.max(roundMoney(loan.remainingBalance - deliveredAmount), 0);
  }, [deliveredAmount, loan, normalizedMode, previousBalanceValue]);

  const resolvedNewBalance = useMemo(() => {
    if (newBalanceValue !== null) {
      return newBalanceValue;
    }

    return loan?.remainingBalance ?? 0;
  }, [loan, newBalanceValue]);

  const loanConcepts = useMemo(() => {
    const mainLabel =
      normalizedMode === "TOPUP" ? "Monto agregado al prestamo" : "Capital desembolsado";

    return [
      { label: mainLabel, amount: deliveredAmount },
    ];
  }, [deliveredAmount, normalizedMode]);

  const receiptCode = buildDisbursementCode(loanId, issuedAtValue);
  const hasHistoricalBalanceContext = previousBalanceValue !== null || newBalanceValue !== null;

  const handleExpiredSession = () => {
    clearSession();
    router.replace("/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f7fb] px-5 py-10 text-[#213754] sm:px-8">
        <section className="mx-auto max-w-[1120px] rounded-[28px] border border-[#d8e2ee] bg-white px-6 py-16 text-center text-sm text-[#7b8da2] shadow-[0_18px_40px_rgba(29,46,77,0.05)]">
          Generando comprobante de desembolso...
        </section>
      </main>
    );
  }

  if (error || !loan) {
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
            error ?? "No se pudo generar el comprobante solicitado."
          )}
        </section>
      </main>
    );
  }

  return (
    <DocumentPageShell
      subtitle="Comprobante de desembolso"
      navItems={[
        { href: "/home", label: "Dashboard" },
        { href: `/loans/${loanId}`, label: "Prestamo" },
        { href: `/loans/${loanId}/disbursement`, label: "Comprobante", active: true },
      ]}
      onPrint={() => window.print()}
    >
      <article className="mx-auto max-w-[790px] rounded-[26px] bg-white px-7 py-8 shadow-[0_24px_60px_rgba(29,46,77,0.12)] print:max-w-none print:break-inside-avoid print:rounded-none print:px-6 print:py-5 print:shadow-none">
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
              <p>Sistema de gestion de prestamos</p>
              <p>Santo Domingo, Rep. Dom.</p>
            </div>
          </div>

          <div className="text-left print:text-right lg:text-right">
            <h1 className="text-[1.7rem] font-bold tracking-[-0.04em] text-[#102844]">
              COMPROBANTE DE DESEMBOLSO
            </h1>
            <p className="mt-2 text-[1.55rem] font-bold tracking-[-0.03em] text-[#167c22]">
              {receiptCode}
            </p>
            <div className="mt-2 space-y-1 text-[12px] tracking-[0.16em] text-[#334a67]">
              <p>FECHA: {formatReceiptDate(issuedAtValue)}</p>
              <p>METODO: {methodLabel}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 print:mt-5 print:grid-cols-2 print:gap-5 md:grid-cols-2">
          <InfoPanel title="Informacion del cliente">
            <p className="text-[1.05rem] font-semibold text-[#111f32]">
              {loan.client?.name ?? "Cliente no disponible"}
            </p>
            <p className="mt-2 text-[13px] text-[#4d627c]">
              ID: {loan.client?.cedula ?? "No registrada"}
            </p>
            <p className="mt-1 text-[13px] text-[#4d627c]">
              {loan.client?.address ?? "Direccion no registrada"}
            </p>
            <p className="mt-1 text-[13px] text-[#4d627c]">
              {loan.client?.email ?? "Correo no registrado"}
            </p>
          </InfoPanel>

          <InfoPanel title="Detalles del prestamo">
            <ReceiptRow label="Referencia" value={formatLoanCode(loan.id)} />
            <ReceiptRow
              label="Operacion"
              value={normalizedMode === "TOPUP" ? "Aumento de saldo" : "Prestamo nuevo"}
            />
            <ReceiptRow
              label="Tipo"
              value={loan.frequency === "MONTHLY" ? "Prestamo mensual" : "Prestamo quincenal"}
            />
            <ReceiptRow
              label="Estado"
              value={formatLoanStatus(loan.status)}
              valueClassName="text-[#167c22]"
            />
            <ReceiptRow label="Fecha de registro" value={formatDateTime(issuedAtValue)} />
          </InfoPanel>
        </div>

        <div className="mt-6 overflow-hidden rounded-[20px] border border-[#e4eaf2] print:mt-5 print:break-inside-avoid">
          <table className="min-w-full">
            <thead className="bg-[#f5f7fb] text-left text-[10px] font-bold uppercase tracking-[0.18em] text-[#51667f]">
              <tr>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3 text-right">Monto parcial</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {loanConcepts.map((item) => (
                <tr key={item.label} className="border-t border-[#edf1f6] text-[#213754]">
                  <td className="px-4 py-3 text-[0.96rem]">{item.label}</td>
                  <td className="px-4 py-3 text-right text-[0.95rem] text-[#3f556f]">
                    {formatDopCurrency(item.amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-[0.98rem] font-bold text-[#102844]">
                    {formatDopCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end print:mt-4 print:justify-end">
          <div className="w-full max-w-[340px] space-y-2 print:w-[340px] print:max-w-[340px]">
            {hasHistoricalBalanceContext ? (
              <>
                <ResumeRow
                  label="Saldo anterior"
                  value={formatDopCurrency(resolvedPreviousBalance)}
                />
                <ResumeRow
                  label="Nuevo saldo"
                  value={formatDopCurrency(resolvedNewBalance)}
                  strong
                />
              </>
            ) : (
              <ResumeRow
                label="Saldo actual del prestamo"
                value={formatDopCurrency(loan.remainingBalance)}
                strong
              />
            )}
            <div className="rounded-[18px] bg-[#167c22] px-5 py-4 text-white shadow-[0_16px_28px_rgba(22,124,34,0.22)]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[13px] font-bold uppercase tracking-[0.16em]">
                  Total desembolsado
                </span>
                <span className="text-[1.85rem] font-bold tracking-[-0.05em]">
                  {formatDopCurrency(deliveredAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#e6edf4] pt-5 text-center text-[10px] leading-5 text-[#6c8099] print:mt-6 print:pt-4">
          Este documento respalda la salida de fondos registrada para este prestamo.
          Conservar este comprobante para cualquier consulta posterior sobre el desembolso realizado.
        </div>
      </article>

      <footer className="print:hidden mx-auto mt-8 flex max-w-[790px] flex-wrap items-center justify-center gap-8 border-t border-[#d8e2ee] px-4 py-5 text-sm text-[#71839b]">
        <span>TERMINOS LEGALES</span>
        <span>SOPORTE AL CLIENTE</span>
        <span className="basis-full text-center">
          © 2024 INVERSIONES FERNANDEZ | COMPROBANTE ELECTRONICO
        </span>
      </footer>
    </DocumentPageShell>
  );
}

function InfoPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="border-b border-[#e7edf5] pb-3 text-[13px] font-bold uppercase tracking-[0.18em] text-[#233852]">
        {title}
      </h2>
      <div className="pt-4">{children}</div>
    </section>
  );
}

function ReceiptRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-[#4f647d]">{label}:</span>
      <span className={`text-right font-semibold text-[#111f32] ${valueClassName ?? ""}`}>
        {value}
      </span>
    </div>
  );
}

function ResumeRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-[1.02rem]">
      <span className="font-semibold uppercase tracking-[0.12em] text-[#536981]">{label}</span>
      <span className={`font-bold ${strong ? "text-[#102844]" : "text-[#334a67]"}`}>{value}</span>
    </div>
  );
}

function parseMoneyValue(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function buildDisbursementCode(loanId: string, issuedAt: string) {
  const year = new Date(issuedAt).getFullYear();
  return `DES-${loanId.slice(0, 6).toUpperCase()}-${year}`;
}
