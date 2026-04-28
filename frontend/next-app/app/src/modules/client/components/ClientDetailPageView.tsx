"use client";

import { clearSession } from "@/app/src/modules/auth/services/session.service";
import AppSidebar from "@/app/src/modules/dashboard/components/AppSidebar";
import {
  getClientByIdService,
  getClientLoansService,
  updateClientService,
} from "@/app/src/modules/client/services/client.service";
import Image from "next/image";
import LoanStatusBadge from "@/app/src/modules/shared/components/LoanStatusBadge";
import TablePagination from "@/app/src/modules/shared/components/TablePagination";
import { usePagination } from "@/app/src/modules/shared/hooks/usePagination";
import type {
  ClientBankAccountInput,
  ClientCredentialBank,
  ClientInstitution,
  ClientLoanRecord,
  ClientRecord,
  LoanStatus,
  UpdateClientPayload,
} from "@/app/src/modules/client/types/client.types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";

const bankOptions = [
  "Banreservas",
  "Banco Popular",
  "BHD",
  "Banco Caribe",
  "Scotiabank",
  "Asociacion Popular",
];
const accountTypeOptions = ["Ahorros", "Corriente"];
const phoneCompanyOptions = ["Claro", "Altice", "Viva", "Otra"];
const credentialBankOptions: Array<{ value: ClientCredentialBank; label: string }> = [
  { value: "BANRESERVAS", label: "Banreservas" },
  { value: "POPULAR", label: "Banco Popular" },
  { value: "BHD", label: "BHD" },
  { value: "CARIBE", label: "Banco Caribe" },
];
const inputClassName =
  "h-12 w-full rounded-2xl border border-[#d9e2ed] bg-white px-4 text-[1rem] text-[#25384f] outline-none transition placeholder:text-[#8f9db0] focus:border-[#bfd0e3] focus:ring-4 focus:ring-[#edf4fb]";

type BankAccountFormItem = ClientBankAccountInput & { id: string };

type ClientEditFormState = {
  name: string;
  cedula: string;
  address: string;
  birthDate: string;
  email: string;
  phone: string;
  phone2: string;
  phoneCompany: string;
  institution: ClientInstitution;
  credentialBank: ClientCredentialBank;
  username: string;
  password: string;
  bankAccounts: BankAccountFormItem[];
};

const institutionOptions: Array<{ value: ClientInstitution; label: string }> = [
  { value: "POLICIA", label: "Policia" },
  { value: "PENSIONADO", label: "Pensionado" },
  { value: "EDUCACION", label: "Educacion" },
  { value: "MEDICO", label: "Medico" },
  { value: "GUARDIA", label: "Guardia" },
  { value: "PARTICULAR", label: "Particular" },
];

export default function ClientDetailPageView({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [loans, setLoans] = useState<ClientLoanRecord[]>([]);
  const [loanFilter, setLoanFilter] = useState<"ALL" | "ACTIVE" | "PAID">("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ClientEditFormState | null>(null);
  const [editProfileImagePreview, setEditProfileImagePreview] = useState<string | null>(null);
  const [editProfileImageFile, setEditProfileImageFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadClientData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [clientData, loansData] = await Promise.all([
          getClientByIdService(clientId),
          getClientLoansService(clientId),
        ]);

        if (!cancelled) {
          setClient(clientData);
          setLoans(loansData);
          setEditForm(buildEditForm(clientData));
          setEditProfileImagePreview(clientData.profileImage ?? null);
          setEditProfileImageFile(null);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudo cargar el cliente.";

        if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadClientData();

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  useEffect(() => {
    return () => {
      if (editProfileImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(editProfileImagePreview);
      }
    };
  }, [editProfileImagePreview]);

  const loanSummary = useMemo(() => {
    const pendingLoans = loans.filter((loan) => loan.status !== "PAID");
    const lateLoans = loans.filter((loan) => loan.status === "LATE");

    return {
      totalLoans: loans.length,
      pendingLoans: pendingLoans.length,
      lateLoans: lateLoans.length,
      totalPendingBalance: pendingLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0),
      totalCurrentDue: pendingLoans.reduce((sum, loan) => sum + loan.currentTotalDue, 0),
    };
  }, [loans]);

  const filteredLoans = useMemo(() => {
    if (loanFilter === "ALL") return loans;
    if (loanFilter === "ACTIVE") {
      return loans.filter((loan) => loan.status === "ACTIVE" || loan.status === "LATE");
    }
    return loans.filter((loan) => loan.status === "PAID");
  }, [loanFilter, loans]);
  const loansPagination = usePagination(filteredLoans, 6);

  const handleExpiredSession = () => {
    clearSession();
    router.replace("/login");
  };

  const handleFormFieldChange = (
    field: Exclude<keyof ClientEditFormState, "bankAccounts">,
    value: string
  ) => {
    setError(null);
    setSuccessMessage(null);
    setEditForm((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleBankAccountChange = (
    index: number,
    field: keyof ClientBankAccountInput,
    value: string
  ) => {
    setError(null);
    setSuccessMessage(null);
    setEditForm((current) =>
      current
        ? {
            ...current,
            bankAccounts: current.bankAccounts.map((account, accountIndex) =>
              accountIndex === index ? { ...account, [field]: value } : account
            ),
          }
        : current
    );
  };

  const addBankAccount = () => {
    setEditForm((current) =>
      current
        ? { ...current, bankAccounts: [...current.bankAccounts, emptyBankAccount()] }
        : current
    );
  };

  const removeBankAccount = (index: number) => {
    setEditForm((current) =>
      current
        ? {
            ...current,
            bankAccounts:
              current.bankAccounts.length === 1
                ? current.bankAccounts
                : current.bankAccounts.filter((_, accountIndex) => accountIndex !== index),
          }
        : current
    );
  };

  const handleStartEditing = () => {
    if (!client) return;
    setEditForm(buildEditForm(client));
    setEditProfileImageFile(null);
    setEditProfileImagePreview(client.profileImage ?? null);
    setEditing(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancelEditing = () => {
    if (client) setEditForm(buildEditForm(client));
    setEditProfileImageFile(null);
    setEditProfileImagePreview(client?.profileImage ?? null);
    setEditing(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleEditProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setEditProfileImageFile(file);
    setEditProfileImagePreview((current) => {
      if (current?.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }

      return URL.createObjectURL(file);
    });
  };

  const handleSaveChanges = async () => {
    if (!client || !editForm) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      const updatedClient = await updateClientService(
        client.id,
        buildUpdatePayload(editForm, editProfileImagePreview, editProfileImageFile)
      );
      setClient(updatedClient);
      setEditForm(buildEditForm(updatedClient));
      setEditProfileImageFile(null);
      setEditProfileImagePreview(updatedClient.profileImage ?? null);
      setEditing(false);
      setSuccessMessage("Cliente actualizado correctamente.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo actualizar el cliente.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="bg-[#f4f7fb] text-[#213754] lg:h-screen lg:overflow-hidden">
        <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row">
          <AppSidebar />
          <section className="flex-1 px-5 py-8 sm:px-8">
            <section className="rounded-[24px] border border-[#d8e2ee] bg-white px-6 py-12 text-center text-sm text-[#7b8da2] shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
              Cargando detalle del cliente...
            </section>
          </section>
        </div>
      </main>
    );
  }

  if (error && !client) {
    return (
      <main className="bg-[#f4f7fb] text-[#213754] lg:h-screen lg:overflow-hidden">
        <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row">
          <AppSidebar />
          <section className="flex-1 px-5 py-8 sm:px-8">
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
          </section>
        </div>
      </main>
    );
  }

  if (!client || !editForm) {
    return null;
  }

  return (
    <main className="bg-[#f4f7fb] text-[#213754] lg:h-screen lg:overflow-hidden">
      <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row">
        <AppSidebar />
        <section className="flex-1 lg:overflow-y-auto">
          <header className="flex flex-col gap-4 border-b border-[#dfe6ef] bg-white px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#67b549]">
                Cliente
              </p>
              <h1 className="mt-1 text-[2rem] font-bold tracking-[-0.03em] text-[#102844]">
                Detalle del Cliente
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/clients"
                className="inline-flex h-11 items-center rounded-xl border border-[#d9e2ed] bg-white px-5 text-sm font-semibold text-[#60748d] transition hover:bg-[#f8fafc]"
              >
                Volver a Clientes
              </Link>
              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEditing}
                    className="inline-flex h-11 items-center rounded-xl border border-[#d9e2ed] bg-white px-5 text-sm font-semibold text-[#60748d] transition hover:bg-[#f8fafc]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="inline-flex h-11 items-center rounded-xl bg-[#63b649] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(99,182,73,0.24)] transition hover:bg-[#54a13c] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleStartEditing}
                    className="inline-flex h-11 items-center rounded-xl border border-[#d9e2ed] bg-white px-5 text-sm font-semibold text-[#60748d] transition hover:bg-[#f8fafc]"
                  >
                    Editar Cliente
                  </button>
                  <Link
                    href="/clients/new"
                    className="inline-flex h-11 items-center rounded-xl bg-[#63b649] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(99,182,73,0.24)] transition hover:bg-[#54a13c]"
                  >
                    Nuevo Cliente
                  </Link>
                </>
              )}
            </div>
          </header>

          <div className="space-y-6 px-5 py-8 sm:px-8">
            {error && (
              <section className="rounded-2xl border border-[#f5caca] bg-[#fff5f5] px-5 py-4 text-sm text-[#c24141]">
                {error}
              </section>
            )}
            {successMessage && (
              <section className="rounded-2xl border border-[#cce9c5] bg-[#f3fbf1] px-5 py-4 text-sm text-[#3d8b3d]">
                {successMessage}
              </section>
            )}

            <section className="rounded-[24px] border border-[#d8e2ee] bg-white p-6 shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col gap-5 md:flex-row md:items-center">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (!editing && client.profileImage) {
                          setIsImageOpen(true);
                        }
                      }}
                      className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#eef3f9_55%,_#dce6f1_100%)] text-3xl font-bold text-[#75889f] shadow-[inset_0_2px_10px_rgba(255,255,255,0.7),0_14px_28px_rgba(16,40,68,0.08)] ${
                        !editing && client.profileImage
                          ? "cursor-zoom-in transition hover:scale-[1.02]"
                          : ""
                      }`}
                    >
                      {editing && editProfileImagePreview ? (
                        <Image
                          src={editProfileImagePreview}
                          alt={client.name}
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : client.profileImage ? (
                        <Image
                          src={client.profileImage}
                          alt={client.name}
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        getInitials(client.name)
                      )}
                    </button>
                    {editing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="absolute -bottom-2 left-[4.1rem] inline-flex h-10 items-center justify-center rounded-full border-4 border-white bg-[#63b649] px-3 text-xs font-bold text-white shadow-[0_10px_18px_rgba(99,182,73,0.28)] transition hover:bg-[#54a13c]"
                        >
                          Cambiar
                        </button>
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/png,image/jpeg"
                          className="hidden"
                          onChange={handleEditProfileImageChange}
                        />
                      </>
                    ) : (
                      <div className="absolute -bottom-2 left-[4.35rem] flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-[#63b649] text-white shadow-[0_10px_18px_rgba(99,182,73,0.28)]">
                        <UserCardIconSmall />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-[2rem] font-bold tracking-[-0.03em] text-[#102844]">
                        {client.name}
                      </h2>
                      <span className="inline-flex rounded-full bg-[#eef8ed] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#4f9938]">
                        Cliente Activo
                      </span>
                      <span className="inline-flex rounded-full bg-[#edf4ff] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#2563eb]">
                        Verificado
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#6d8098]">
                      <p>ID: {client.cedula}</p>
                      <p>{client.email}</p>
                      <p>{formatInstitution(client.institution)}</p>
                      <p>{client.phoneCompany || "Compania no registrada"}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3 xl:min-w-[520px]">
                  <ModernInfoPill label="Cédula" value={client.cedula} />
                  <ModernInfoPill label="Teléfono" value={client.phone} />
                  <ModernInfoPill label="Cuentas" value={`${client.bankAccounts.length}`} accent />
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="Préstamos Registrados" value={`${loanSummary.totalLoans}`} />
              <SummaryCard
                label="Préstamos Pendientes"
                value={`${loanSummary.pendingLoans}`}
                accent={loanSummary.pendingLoans > 0}
              />
              <SummaryCard
                label="Saldo Pendiente"
                value={formatCurrency(loanSummary.totalPendingBalance)}
              />
              <SummaryCard
                label="Total Adeudado"
                value={formatCurrency(loanSummary.totalCurrentDue)}
                accent={loanSummary.lateLoans > 0}
              />
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="space-y-6">
                <DetailSection title="Información Personal">
                  {editing ? (
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label="Nombre Completo">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(event) => handleFormFieldChange("name", event.target.value)}
                          className={inputClassName}
                        />
                      </Field>
                      <Field label="Cédula">
                        <input
                          type="text"
                          value={editForm.cedula}
                          onChange={(event) =>
                            handleFormFieldChange("cedula", formatCedula(event.target.value))
                          }
                          className={inputClassName}
                        />
                      </Field>
                      <Field label="Correo Electrónico">
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(event) => handleFormFieldChange("email", event.target.value)}
                          className={inputClassName}
                        />
                      </Field>
                      <Field label="Institucion">
                        <select
                          value={editForm.institution}
                          onChange={(event) =>
                            handleFormFieldChange("institution", event.target.value)
                          }
                          className={inputClassName}
                        >
                          {institutionOptions.map((institution) => (
                            <option key={institution.value} value={institution.value}>
                              {institution.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Fecha de Nacimiento">
                        <input
                          type="date"
                          value={editForm.birthDate}
                          onChange={(event) =>
                            handleFormFieldChange("birthDate", event.target.value)
                          }
                          className={inputClassName}
                        />
                      </Field>
                      <Field label="Teléfono Principal">
                        <input
                          type="text"
                          value={editForm.phone}
                          onChange={(event) =>
                            handleFormFieldChange("phone", formatPhone(event.target.value))
                          }
                          className={inputClassName}
                        />
                      </Field>
                      <Field label="Teléfono Secundario">
                        <input
                          type="text"
                          value={editForm.phone2}
                          onChange={(event) =>
                            handleFormFieldChange("phone2", formatPhone(event.target.value))
                          }
                          className={inputClassName}
                          placeholder="809-000-0000"
                        />
                      </Field>
                      <Field label="Compania Telefonica">
                        <select
                          value={editForm.phoneCompany}
                          onChange={(event) =>
                            handleFormFieldChange("phoneCompany", event.target.value)
                          }
                          className={inputClassName}
                        >
                          <option value="">Seleccione compania...</option>
                          {phoneCompanyOptions.map((company) => (
                            <option key={company} value={company}>
                              {company}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  ) : (
                    <DetailGrid
                      items={[
                        { label: "Nombre completo", value: client.name },
                        { label: "Cédula", value: client.cedula },
                        { label: "Correo electrónico", value: client.email },
                        { label: "Institucion", value: formatInstitution(client.institution) },
                        { label: "Fecha de nacimiento", value: formatDate(client.birthDate) },
                        { label: "Teléfono principal", value: client.phone },
                        { label: "Compañía telefónica", value: client.phoneCompany || "No registrada" },
                        { label: "Teléfono secundario", value: client.phone2 || "No registrado" },
                      ]}
                    />
                  )}
                </DetailSection>

                <DetailSection title="Historial de Préstamos">
                  {loans.length === 0 ? (
                    <EmptyState
                      title="Sin préstamos registrados"
                      description="Este cliente todavía no tiene préstamos asociados."
                    />
                  ) : (
                    <div className="overflow-hidden rounded-[22px] border border-[#e4ebf3] bg-[#fbfcfe]">
                      <div className="flex flex-col gap-4 border-b border-[#e7edf5] px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#102844]">
                            Historial completo del cliente
                          </p>
                          <p className="mt-1 text-xs text-[#8193a8]">
                            Revisa préstamos activos, liquidados y cuentas en mora.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 rounded-2xl bg-white p-1 shadow-[0_8px_18px_rgba(29,46,77,0.06)]">
                          <LoanFilterButton
                            label="Todos"
                            active={loanFilter === "ALL"}
                            onClick={() => setLoanFilter("ALL")}
                          />
                          <LoanFilterButton
                            label="Activos"
                            active={loanFilter === "ACTIVE"}
                            onClick={() => setLoanFilter("ACTIVE")}
                          />
                          <LoanFilterButton
                            label="Liquidados"
                            active={loanFilter === "PAID"}
                            onClick={() => setLoanFilter("PAID")}
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
                              <th className="px-5 py-4 text-right">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {loansPagination.paginatedItems.map((loan) => (
                              <tr
                                key={loan.id}
                                className="border-t border-[#edf1f6] transition hover:bg-[#f8fbfe]"
                              >
                                <td className="px-5 py-4">
                                  <div>
                                    <p className="text-lg font-bold text-[#2d4766]">
                                      {formatLoanCode(loan.id)}
                                    </p>
                                    <p className="mt-1 text-xs text-[#94a3b8]">
                                      {formatLoanSubtitle(loan)}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-[1.05rem] font-bold text-[#4a5f7a]">
                                  {formatCurrency(loan.principalAmount)}
                                </td>
                                <td className="px-5 py-4 text-sm font-medium text-[#61748d]">
                                  {formatTableDate(loan.startDate)}
                                </td>
                                <td className="px-5 py-4">
                                  <LoanStatusBadge status={loan.status} />
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
                          Mostrando {filteredLoans.length} de {loans.length} registros
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
                        currentPage={loansPagination.currentPage}
                        totalPages={loansPagination.totalPages}
                        totalItems={loansPagination.totalItems}
                        pageSize={loansPagination.pageSize}
                        itemLabel="prestamos"
                        onPrevious={loansPagination.goToPreviousPage}
                        onNext={loansPagination.goToNextPage}
                      />
                    </div>
                  )}
                </DetailSection>

                <DetailSection
                  title="Residencia"
                >
                  {editing ? (
                    <Field label="Dirección Residencial">
                      <input
                        type="text"
                        value={editForm.address}
                        onChange={(event) =>
                          handleFormFieldChange("address", event.target.value)
                        }
                        className={inputClassName}
                      />
                    </Field>
                  ) : (
                    <p className="text-base leading-7 text-[#5d728c]">{client.address}</p>
                  )}
                </DetailSection>

                <DetailSection
                  title="Cuentas Bancarias"
                  action={
                    editing ? (
                      <button
                        type="button"
                        onClick={addBankAccount}
                        className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#63b649] transition hover:text-[#4f9938]"
                      >
                        <PlusCircleIcon />
                        Agregar Cuenta
                      </button>
                    ) : undefined
                  }
                >
                  {editing ? (
                    <div className="space-y-5">
                      {editForm.bankAccounts.map((account, index) => (
                        <div
                          key={account.id}
                          className="rounded-2xl border border-[#e5ebf3] bg-[#f9fbfd] p-5"
                        >
                          <div className="mb-4 flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeBankAccount(index)}
                              disabled={editForm.bankAccounts.length === 1}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#a6b3c3] ring-1 ring-inset ring-[#dbe4ef] transition hover:text-[#6b7e95] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <CloseIcon />
                            </button>
                          </div>

                          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                            <Field label="Banco">
                              <select
                                value={account.bankName}
                                onChange={(event) =>
                                  handleBankAccountChange(index, "bankName", event.target.value)
                                }
                                className={inputClassName}
                              >
                                <option value="">Seleccione banco...</option>
                                {bankOptions.map((bankName) => (
                                  <option key={bankName} value={bankName}>
                                    {bankName}
                                  </option>
                                ))}
                              </select>
                            </Field>

                            <Field label="Tipo de Cuenta">
                              <select
                                value={account.accountType}
                                onChange={(event) =>
                                  handleBankAccountChange(
                                    index,
                                    "accountType",
                                    event.target.value
                                  )
                                }
                                className={inputClassName}
                              >
                                {accountTypeOptions.map((accountType) => (
                                  <option key={accountType} value={accountType}>
                                    {accountType}
                                  </option>
                                ))}
                              </select>
                            </Field>
                          </div>

                          <div className="mt-4">
                            <Field label="Número de Cuenta">
                              <input
                                type="text"
                                value={account.accountNumber}
                                onChange={(event) =>
                                  handleBankAccountChange(
                                    index,
                                    "accountNumber",
                                    formatAccountNumber(event.target.value)
                                  )
                                }
                                placeholder="XXXXXXXXXX"
                                className={inputClassName}
                              />
                            </Field>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {client.bankAccounts.map((account) => (
                        <div
                          key={account.id}
                          className="rounded-2xl border border-[#e5ebf3] bg-[#f9fbfd] p-5"
                        >
                          <div className="grid gap-4 md:grid-cols-3">
                            <InfoBlock label="Banco" value={account.bankName} />
                            <InfoBlock label="Tipo de cuenta" value={account.accountType} />
                            <InfoBlock label="Número de cuenta" value={account.accountNumber} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </DetailSection>
              </div>

              <div className="space-y-6">
                <DetailSection title="Resumen Financiero">
                  <div className="space-y-4">
                    <InfoBlock
                      label="Préstamos pendientes"
                      value={`${loanSummary.pendingLoans}`}
                    />
                    <InfoBlock label="Préstamos atrasados" value={`${loanSummary.lateLoans}`} />
                    <InfoBlock
                      label="Saldo pendiente total"
                      value={formatCurrency(loanSummary.totalPendingBalance)}
                    />
                    <InfoBlock
                      label="Total adeudado"
                      value={formatCurrency(loanSummary.totalCurrentDue)}
                    />
                  </div>
                </DetailSection>

                <DetailSection title="Credenciales Netbanking">
                  <div className="flex flex-col gap-3 rounded-2xl border border-[#e4ebf5] bg-[#fbfdff] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#163658]">
                        {getCredentialBankLabel(
                          editing ? editForm.credentialBank : client.credentials?.bank ?? "BANRESERVAS"
                        )}
                      </p>
                      <p className="mt-1 text-sm text-[#6a7f97]">
                        Accede al login bancario para consultar o usar estas credenciales.
                      </p>
                    </div>
                    <a
                      href={getCredentialBankUrl(
                        editing ? editForm.credentialBank : client.credentials?.bank ?? "BANRESERVAS"
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-[#d7e3f4] bg-white px-4 text-sm font-semibold text-[#163658] transition hover:border-[#c7d8ef] hover:bg-[#f5f9ff]"
                    >
                      Abrir Netbanking
                    </a>
                  </div>

                  {editing ? (
                    <div className="mt-5 space-y-4">
                      <Field label="Banco del Portal">
                        <select
                          value={editForm.credentialBank}
                          onChange={(event) =>
                            handleFormFieldChange("credentialBank", event.target.value)
                          }
                          className={inputClassName}
                        >
                          {credentialBankOptions.map((bank) => (
                            <option key={bank.value} value={bank.value}>
                              {bank.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Usuario / ID">
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(event) =>
                            handleFormFieldChange("username", event.target.value)
                          }
                          className={inputClassName}
                        />
                      </Field>
                      <Field label="Contraseña">
                        <input
                          type="text"
                          value={editForm.password}
                          onChange={(event) =>
                            handleFormFieldChange("password", event.target.value)
                          }
                          className={inputClassName}
                        />
                      </Field>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      <InfoBlock
                        label="Banco del portal"
                        value={formatCredentialBank(client.credentials?.bank)}
                      />
                      <InfoBlock
                        label="Usuario / ID"
                        value={client.credentials?.username || "No registrado"}
                      />
                      <InfoBlock
                        label="Contraseña"
                        value={client.credentials?.password || "No registrada"}
                      />
                    </div>
                  )}
                </DetailSection>

                <DetailSection title="Meta del Registro">
                  <div className="space-y-4">
                    <InfoBlock label="Fecha de creación" value={formatDateTime(client.createdAt)} />
                    <InfoBlock label="ID interno" value={client.id} mono />
                  </div>
                </DetailSection>
              </div>
            </div>
          </div>
        </section>
      </div>

      {client.profileImage && isImageOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(7,18,31,0.78)] px-6 py-8 backdrop-blur-sm"
          onClick={() => setIsImageOpen(false)}
        >
          <div className="relative w-full max-w-[560px]" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsImageOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(12,39,60,0.75)] text-white transition hover:bg-[rgba(12,39,60,0.92)]"
              aria-label="Cerrar imagen"
            >
              <CloseIcon />
            </button>
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
              <div className="relative aspect-square w-full bg-[#eef3f9]">
                <Image
                  src={client.profileImage}
                  alt={client.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function buildEditForm(client: ClientRecord): ClientEditFormState {
  return {
    name: client.name,
    cedula: client.cedula,
    address: client.address,
    birthDate: toDateInputValue(client.birthDate),
    email: client.email,
    phone: client.phone,
    phone2: client.phone2 ?? "",
    phoneCompany: client.phoneCompany ?? "",
    institution: client.institution,
    credentialBank: client.credentials?.bank ?? "BANRESERVAS",
    username: client.credentials?.username ?? "",
    password: client.credentials?.password ?? "",
    bankAccounts:
      client.bankAccounts.length > 0
        ? client.bankAccounts.map((account) => ({
            id: account.id,
            bankName: account.bankName,
            accountType: account.accountType,
            accountNumber: account.accountNumber,
          }))
        : [emptyBankAccount()],
  };
}

function buildUpdatePayload(
  form: ClientEditFormState,
  profileImagePreview: string | null,
  profileImageFile: File | null
): UpdateClientPayload {
  return {
    name: form.name.trim(),
    cedula: form.cedula.trim(),
    address: form.address.trim(),
    birthDate: form.birthDate,
    email: form.email.trim(),
    phone: form.phone.trim(),
    institution: form.institution,
    ...(form.phoneCompany.trim() ? { phoneCompany: form.phoneCompany.trim() } : {}),
    ...(form.phone2.trim() ? { phone2: form.phone2.trim() } : {}),
    ...(!profileImageFile && profileImagePreview && !profileImagePreview.startsWith("blob:")
      ? { profileImage: profileImagePreview }
      : {}),
    ...(profileImageFile ? { profileImageFile } : {}),
    credentials: {
      bank: form.credentialBank,
      username: form.username.trim(),
      password: form.password,
    },
    bankAccounts: form.bankAccounts.map((account) => ({
      bankName: account.bankName.trim(),
      accountType: account.accountType.trim(),
      accountNumber: account.accountNumber.trim(),
    })),
  };
}

function emptyBankAccount(): BankAccountFormItem {
  return {
    id: crypto.randomUUID(),
    bankName: "",
    accountType: "Ahorros",
    accountNumber: "",
  };
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="summary-card rounded-2xl border border-[#e3eaf2] bg-[#fbfcfe] px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8597ad]">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${accent ? "text-[#63b649]" : "text-[#24384f]"}`}>
        {value}
      </p>
    </div>
  );
}

function ModernInfoPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`modern-info-pill rounded-[22px] border px-4 py-4 shadow-[0_10px_24px_rgba(16,40,68,0.05)] ${
        accent
          ? "modern-info-pill-accent border-[#d7ebd0] bg-[linear-gradient(135deg,_#f9fff6_0%,_#f2f9ee_100%)]"
          : "border-[#e5ebf3] bg-[linear-gradient(135deg,_#ffffff_0%,_#f7fafe_100%)]"
      }`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a9aaf]">{label}</p>
      <p className="mt-2 truncate text-base font-semibold text-[#24384f]">{value}</p>
    </div>
  );
}

function DetailSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="detail-section rounded-[24px] border border-[#d8e2ee] bg-white shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
      <div className="flex flex-col gap-3 border-b border-[#e7edf5] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[1.5rem] font-bold tracking-[-0.03em] text-[#102844]">{title}</h2>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function DetailGrid({
  items,
}: {
  items: Array<{
    label: string;
    value: string;
  }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <InfoBlock key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  );
}

function InfoBlock({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="info-block rounded-2xl border border-[#e7edf5] bg-[#fbfcfe] px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7f91a6]">{label}</p>
      <p
        className={`mt-2 break-words text-base text-[#24384f] ${
          mono ? "font-mono text-sm" : "font-semibold"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#617792]">
        {label}
      </span>
      {children}
    </label>
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

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatCedula(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
}

function formatAccountNumber(value: string) {
  return value.replace(/\D/g, "");
}

function toDateInputValue(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0] ?? "";
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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

function formatFrequency(frequency: ClientLoanRecord["frequency"]) {
  return frequency === "MONTHLY" ? "mensual" : "quincenal";
}

function formatInstitution(institution: ClientInstitution) {
  switch (institution) {
    case "POLICIA":
      return "Policia";
    case "PENSIONADO":
      return "Pensionado";
    case "EDUCACION":
      return "Educacion";
    case "MEDICO":
      return "Medico";
    case "GUARDIA":
      return "Guardia";
    default:
      return "Particular";
  }
}

function formatCredentialBank(bank?: ClientCredentialBank) {
  switch (bank) {
    case "POPULAR":
      return "Banco Popular";
    case "BHD":
      return "BHD";
    case "CARIBE":
      return "Banco Caribe";
    case "BANRESERVAS":
      return "Banreservas";
    default:
      return "No registrado";
  }
}

function getCredentialBankLabel(bank: ClientCredentialBank) {
  switch (bank) {
    case "POPULAR":
      return "Portal Banco Popular";
    case "BHD":
      return "Portal BHD";
    case "CARIBE":
      return "Portal Banco Caribe";
    default:
      return "Portal Netbanking Banreservas";
  }
}

function getCredentialBankUrl(bank: ClientCredentialBank) {
  switch (bank) {
    case "POPULAR":
      return "https://popularenlinea.com/plusval?utm_source=GADS&utm_medium=CPA&utm_campaign=BANCOPOPULAR&utm_term=CONV&utm_content=&gclsrc=aw.ds&gad_source=1&gad_campaignid=23748063100&gbraid=0AAAAApeXd05-g_wjr3VUdTjskum0Wv5uT&gclid=Cj0KCQjwkrzPBhCqARIsAJN460koLKZUOLV7FYbSEGRbKV7JQtqtpxMZJy6jy_DyUoP0X8hlRGDMYTEaAlJCEALw_wcB";
    case "BHD":
      return "https://ibp.bhd.com.do/#/login";
    case "CARIBE":
      return "https://www.bancocaribeenlinea.com.do/Web/Login.aspx";
    default:
      return "https://tubanco.banreservas.com/TuBancoBanreservas/#/administrationGeneral/login";
  }
}

function formatLoanCode(loanId: string) {
  return `#PR-${loanId.slice(0, 4).toUpperCase()}`;
}

function formatLoanSubtitle(loan: ClientLoanRecord) {
  const paymentCount = loan.payments.length;
  const duration = loan.frequency === "MONTHLY" ? "30 días" : "15 días";

  return `${formatFrequency(loan.frequency)} · ${duration} · ${paymentCount} pago${
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

function UserCardIconSmall() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.33 0-6 1.79-6 4v1h12v-1c0-2.21-2.67-4-6-4Z" />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="m18.3 5.71-1.41-1.42L12 9.17 7.11 4.29 5.7 5.71 10.59 10.6 5.7 15.49l1.41 1.42L12 12l4.89 4.91 1.41-1.42L13.41 10.6Z" />
    </svg>
  );
}
