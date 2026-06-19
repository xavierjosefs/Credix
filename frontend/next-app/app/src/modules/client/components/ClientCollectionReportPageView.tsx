"use client";

import { clearSession } from "@/app/src/modules/auth/services/session.service";
import {
  getClientCollectionReportService,
} from "@/app/src/modules/client/services/client.service";
import type {
  ClientCollectionMethod,
  ClientCollectionReportRow,
  ClientInstitution,
  LoanFrequency,
} from "@/app/src/modules/client/types/client.types";
import DocumentPageShell from "@/app/src/modules/shared/components/DocumentPageShell";
import { openPdfReport } from "@/app/src/modules/shared/services/report.service";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

type ReportParams = {
  frequency?: string;
  collectionMethod?: string;
  institution?: string;
};

type FilterState = {
  frequency: "ALL" | LoanFrequency;
  collectionMethod: "ALL" | ClientCollectionMethod;
  institution: "ALL" | ClientInstitution;
};

const frequencyOptions: Array<{ value: FilterState["frequency"]; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "BIWEEKLY", label: "Quincenal" },
  { value: "MONTHLY", label: "Mensual" },
];

const collectionMethodOptions: Array<{
  value: FilterState["collectionMethod"];
  label: string;
}> = [
  { value: "ALL", label: "Todos" },
  { value: "CAJERO", label: "Cajero" },
  { value: "DEPOSITO", label: "Depositos" },
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
];

const institutionOptions: Array<{ value: FilterState["institution"]; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "POLICIA", label: "Policia" },
  { value: "GUARDIA", label: "Guardia" },
  { value: "PENSIONADO", label: "Pensionado" },
  { value: "EDUCACION", label: "Profesores" },
  { value: "MEDICO", label: "Medico" },
  { value: "PARTICULAR", label: "Particular" },
];

export default function ClientCollectionReportPageView({
  initialParams,
}: {
  initialParams: ReportParams;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>(() => normalizeFilters(initialParams));
  const [rows, setRows] = useState<ClientCollectionReportRow[]>([]);
  const [summary, setSummary] = useState({
    clientsCount: 0,
    totalCapitalPending: 0,
    totalInterestPending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingPdf, setOpeningPdf] = useState(false);

  useEffect(() => {
    setFilters(normalizeFilters(initialParams));
  }, [initialParams]);

  useEffect(() => {
    let cancelled = false;

    const loadReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const payload = await getClientCollectionReportService({
          ...(filters.frequency !== "ALL" ? { frequency: filters.frequency } : {}),
          ...(filters.collectionMethod !== "ALL"
            ? { collectionMethod: filters.collectionMethod }
            : {}),
          ...(filters.institution !== "ALL" ? { institution: filters.institution } : {}),
        });

        if (!cancelled) {
          setRows(payload.data);
          setSummary(payload.summary);
        }
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "No se pudo cargar el reporte.";

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
  }, [filters]);

  const filterDescription = useMemo(() => {
    const parts = [
      `Frecuencia: ${formatFrequency(filters.frequency)}`,
      `Metodo: ${formatFilterCollectionMethod(filters.collectionMethod)}`,
      `Institucion: ${formatFilterInstitution(filters.institution)}`,
    ];

    return parts.join("  •  ");
  }, [filters]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const searchParams = new URLSearchParams();

    if (filters.frequency !== "ALL") {
      searchParams.set("frequency", filters.frequency);
    }

    if (filters.collectionMethod !== "ALL") {
      searchParams.set("collectionMethod", filters.collectionMethod);
    }

    if (filters.institution !== "ALL") {
      searchParams.set("institution", filters.institution);
    }

    router.replace(
      `/clients/report${searchParams.size > 0 ? `?${searchParams.toString()}` : ""}`
    );
  };

  const handleClear = () => {
    const nextFilters: FilterState = {
      frequency: "ALL",
      collectionMethod: "ALL",
      institution: "ALL",
    };

    setFilters(nextFilters);
    router.replace("/clients/report");
  };

  const handleExpiredSession = () => {
    clearSession();
    router.replace("/login");
  };

  const handleOpenPdf = async () => {
    try {
      setOpeningPdf(true);
      setError(null);

      const searchParams = new URLSearchParams();

      if (filters.frequency !== "ALL") {
        searchParams.set("frequency", filters.frequency);
      }

      if (filters.collectionMethod !== "ALL") {
        searchParams.set("collectionMethod", filters.collectionMethod);
      }

      if (filters.institution !== "ALL") {
        searchParams.set("institution", filters.institution);
      }

      await openPdfReport(
        `/client/report/pdf${searchParams.size > 0 ? `?${searchParams.toString()}` : ""}`
      );
    } catch (openError) {
      const message =
        openError instanceof Error ? openError.message : "No se pudo abrir el PDF del reporte.";
      setError(message);
    } finally {
      setOpeningPdf(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f7fb] px-5 py-10 text-[#213754] sm:px-8">
        <section className="mx-auto max-w-[1120px] rounded-[28px] border border-[#d8e2ee] bg-white px-6 py-16 text-center text-sm text-[#7b8da2] shadow-[0_18px_40px_rgba(29,46,77,0.05)]">
          Generando reporte de clientes...
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
      subtitle="Reporte de Clientes por Cobro"
      navItems={[{ href: "/clients", label: "Clientes" }]}
      onPrint={() => window.print()}
    >
      <div className="mx-auto max-w-[1120px] space-y-6 print:max-w-none">
        <section className="print:hidden rounded-[24px] border border-[#d8e2ee] bg-white p-6 shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-[2rem] font-bold tracking-[-0.03em] text-[#102844]">
                Reporte de Clientes
              </h1>
              <p className="mt-1 text-sm text-[#74879c]">
                Filtra la cartera por frecuencia, metodo de cobro e institucion.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-3 lg:min-w-[720px]">
              <SelectField
                label="Frecuencia"
                value={filters.frequency}
                onChange={(value) =>
                  setFilters((current) => ({ ...current, frequency: value as FilterState["frequency"] }))
                }
                options={frequencyOptions}
              />
              <SelectField
                label="Metodo de Cobro"
                value={filters.collectionMethod}
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    collectionMethod: value as FilterState["collectionMethod"],
                  }))
                }
                options={collectionMethodOptions}
              />
              <SelectField
                label="Institucion"
                value={filters.institution}
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    institution: value as FilterState["institution"],
                  }))
                }
                options={institutionOptions}
              />

              <div className="md:col-span-3 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => void handleOpenPdf()}
                  disabled={openingPdf}
                  className="inline-flex h-11 items-center rounded-xl border border-[#d9e2ed] bg-white px-5 text-sm font-semibold text-[#24384f] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {openingPdf ? "Generando PDF..." : "Generar PDF"}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex h-11 items-center rounded-xl border border-[#d9e2ed] bg-white px-5 text-sm font-semibold text-[#60748d] transition hover:bg-[#f8fafc]"
                >
                  Limpiar
                </button>
                <button
                  type="submit"
                  className="inline-flex h-11 items-center rounded-xl bg-[#63b649] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(99,182,73,0.24)] transition hover:bg-[#54a13c]"
                >
                  Actualizar Reporte
                </button>
              </div>
            </form>
          </div>
        </section>

        <article className="rounded-[26px] bg-white px-7 py-8 shadow-[0_24px_60px_rgba(29,46,77,0.12)] print:rounded-none print:px-6 print:py-5 print:shadow-none">
          <div className="flex flex-col gap-3 border-b border-[#e6edf4] pb-5 print:gap-2 print:pb-4">
            <h2 className="text-[1.8rem] font-bold tracking-[-0.04em] text-[#102844]">
              REPORTE TABULAR DE CLIENTES
            </h2>
            <p className="text-[12px] uppercase tracking-[0.18em] text-[#4f6680]">
              {filterDescription}
            </p>
            <p className="text-sm text-[#6c8099]">
              Generado el {formatCurrentDate()}
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3 print:grid-cols-3">
            <SummaryTile title="Clientes" value={`${summary.clientsCount}`} />
            <SummaryTile
              title="Capital Total Adeudado"
              value={formatCurrency(summary.totalCapitalPending)}
            />
            <SummaryTile
              title="Interes a Pagar"
              value={formatCurrency(summary.totalInterestPending)}
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-[20px] border border-[#e4eaf2] print:break-inside-avoid">
            <table className="min-w-full">
              <thead className="bg-[#f5f7fb] text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#51667f]">
                <tr>
                  <th className="px-4 py-3">Numero de Cliente</th>
                  <th className="px-4 py-3">Nombre del Cliente</th>
                  <th className="px-4 py-3 text-right">Capital Total Adeudado</th>
                  <th className="px-4 py-3 text-right">Interes a Pagar</th>
                  <th className="px-4 py-3">&nbsp;</th>
                  <th className="px-4 py-3">&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#7b8da2]">
                      No hay clientes que coincidan con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.clientId} className="border-t border-[#edf1f6] text-[#213754]">
                      <td className="px-3 py-3 text-[12px] font-semibold text-[#24384f]">
                        {row.clientNumber}
                      </td>
                      <td className="px-3 py-3 text-[12px] text-[#24384f]">
                        <div>
                          <p className="font-semibold">{row.clientName}</p>
                          <p className="mt-1 text-xs text-[#7b8da2]">
                            {formatInstitution(row.institution)} · {formatCollectionMethod(row.collectionMethod)}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right text-[12px] font-bold text-[#223753]">
                        {formatCurrency(row.capitalPending)}
                      </td>
                      <td className="px-3 py-3 text-right text-[12px] font-bold text-[#a86d00]">
                        {formatCurrency(row.interestPending)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-10 rounded-xl border border-dashed border-[#d7e2ee] bg-[#fcfdff]" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-10 rounded-xl border border-dashed border-[#d7e2ee] bg-[#fcfdff]" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-end print:mt-6">
            <div className="w-full max-w-[360px] space-y-2 print:w-[360px] print:max-w-[360px]">
              <ResumeRow
                label="Capital total"
                value={formatCurrency(summary.totalCapitalPending)}
              />
              <ResumeRow
                label="Interes total"
                value={formatCurrency(summary.totalInterestPending)}
              />
              <div className="rounded-[18px] bg-[#14314d] px-5 py-4 text-white shadow-[0_16px_28px_rgba(20,49,77,0.18)]">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[13px] font-bold uppercase tracking-[0.16em]">
                    Total general
                  </span>
                  <span className="whitespace-nowrap text-[1.85rem] font-bold tracking-[-0.05em]">
                    {formatCurrency(summary.totalCapitalPending + summary.totalInterestPending)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[#e6edf4] pt-5 text-center text-[10px] leading-5 text-[#6c8099] print:mt-6 print:pt-4">
            Documento operativo para seguimiento de cobros. Los espacios finales quedan libres
            para anotaciones manuales del equipo.
          </div>
        </article>
      </div>
    </DocumentPageShell>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#617792]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-[#d9e2ed] bg-white px-4 text-sm text-[#25384f] outline-none transition focus:border-[#bfd0e3] focus:ring-4 focus:ring-[#edf4fb]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryTile({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[#d8e2ee] bg-[#fbfcfe] px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5b7189]">{title}</p>
      <p className="mt-2 whitespace-nowrap text-[1.7rem] font-bold tracking-[-0.04em] text-[#102844]">
        {value}
      </p>
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

function normalizeFilters(initialParams: ReportParams): FilterState {
  return {
    frequency:
      initialParams.frequency === "MONTHLY" || initialParams.frequency === "BIWEEKLY"
        ? initialParams.frequency
        : "ALL",
    collectionMethod:
      initialParams.collectionMethod === "CAJERO" ||
      initialParams.collectionMethod === "DEPOSITO" ||
      initialParams.collectionMethod === "EFECTIVO" ||
      initialParams.collectionMethod === "TRANSFERENCIA"
        ? initialParams.collectionMethod
        : "ALL",
    institution:
      initialParams.institution === "POLICIA" ||
      initialParams.institution === "PENSIONADO" ||
      initialParams.institution === "EDUCACION" ||
      initialParams.institution === "MEDICO" ||
      initialParams.institution === "GUARDIA" ||
      initialParams.institution === "PARTICULAR"
        ? initialParams.institution
        : "ALL",
  };
}

function formatFrequency(value: FilterState["frequency"]) {
  if (value === "MONTHLY") {
    return "Mensual";
  }

  if (value === "BIWEEKLY") {
    return "Quincenal";
  }

  return "Todos";
}

function formatCollectionMethod(value: FilterState["collectionMethod"] | ClientCollectionMethod | null) {
  switch (value) {
    case "CAJERO":
      return "Cajero";
    case "DEPOSITO":
      return "Depositos";
    case "EFECTIVO":
      return "Efectivo";
    case "TRANSFERENCIA":
      return "Transferencia";
    default:
      return "No registrado";
  }
}

function formatInstitution(value: FilterState["institution"] | ClientInstitution | null) {
  switch (value) {
    case "POLICIA":
      return "Policia";
    case "GUARDIA":
      return "Guardia";
    case "PENSIONADO":
      return "Pensionado";
    case "EDUCACION":
      return "Profesores";
    case "MEDICO":
      return "Medico";
    case "PARTICULAR":
      return "Particular";
    default:
      return "No registrado";
  }
}

function formatFilterCollectionMethod(value: FilterState["collectionMethod"]) {
  return value === "ALL" ? "Todos" : formatCollectionMethod(value);
}

function formatFilterInstitution(value: FilterState["institution"]) {
  return value === "ALL" ? "Todos" : formatInstitution(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatCurrentDate() {
  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

