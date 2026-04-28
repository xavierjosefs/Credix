"use client";

import { clearSession } from "@/app/src/modules/auth/services/session.service";
import AppSidebar from "@/app/src/modules/dashboard/components/AppSidebar";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { useCreateClient } from "../hooks/useCreateClient";
import type {
  ClientBankAccountInput,
  ClientCredentialBank,
  ClientInstitution,
  CreateClientPayload,
} from "../types/client.types";

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
const institutionOptions: Array<{ value: ClientInstitution; label: string }> = [
  { value: "POLICIA", label: "Policia" },
  { value: "PENSIONADO", label: "Pensionado" },
  { value: "EDUCACION", label: "Educacion" },
  { value: "MEDICO", label: "Medico" },
  { value: "GUARDIA", label: "Guardia" },
  { value: "PARTICULAR", label: "Particular" },
];

type BankAccountFormItem = ClientBankAccountInput & {
  id: string;
};

const emptyBankAccount = (): BankAccountFormItem => ({
  id: crypto.randomUUID(),
  bankName: "",
  accountType: "Ahorros",
  accountNumber: "",
});

const initialFormState = {
  name: "",
  cedula: "",
  address: "",
  birthDate: "",
  email: "",
  phone: "",
  phone2: "",
  phoneCompany: "",
  institution: "PARTICULAR" as ClientInstitution,
  credentialBank: "BANRESERVAS" as ClientCredentialBank,
  username: "",
  password: "",
  bankAccounts: [emptyBankAccount()],
};

const inputClassName =
  "h-14 w-full rounded-2xl border border-[#d9e2ed] bg-white px-4 text-[1.05rem] text-[#25384f] outline-none transition placeholder:text-[#8f9db0] focus:border-[#bfd0e3] focus:ring-4 focus:ring-[#edf4fb]";

export default function NewClientPageView() {
  const router = useRouter();
  const { createClient, loading, error, successMessage, clearMessages } = useCreateClient();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFieldChange = (field: keyof typeof initialFormState, value: string) => {
    clearMessages();
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleAccountChange = (
    index: number,
    field: keyof ClientBankAccountInput,
    value: string
  ) => {
    clearMessages();
    setForm((current) => ({
      ...current,
      bankAccounts: current.bankAccounts.map((account, accountIndex) =>
        accountIndex === index ? { ...account, [field]: value } : account
      ),
    }));
  };

  const addBankAccount = () => {
    clearMessages();
    setForm((current) => ({
      ...current,
      bankAccounts: [...current.bankAccounts, emptyBankAccount()],
    }));
  };

  const removeBankAccount = (index: number) => {
    clearMessages();
    setForm((current) => ({
      ...current,
      bankAccounts:
        current.bankAccounts.length === 1
          ? current.bankAccounts
          : current.bankAccounts.filter((_, accountIndex) => accountIndex !== index),
    }));
  };

  const resetForm = () => {
    setForm(initialFormState);
    setShowPassword(false);
    setProfileImageFile(null);
    setProfileImagePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createClient(buildPayload(form, profileImageFile));
    resetForm();
  };

  const handleCancel = () => {
    router.push("/home");
  };

  const handleExpiredSession = () => {
    clearSession();
    router.replace("/login");
  };

  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    clearMessages();

    if (!file) {
      setProfileImageFile(null);
      setProfileImagePreview(null);
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      event.target.value = "";
      return;
    }

    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  return (
    <main className="bg-[#f4f7fb] text-[#213754] lg:h-screen lg:overflow-hidden">
      <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row">
        <AppSidebar />

        <section className="flex-1 lg:overflow-y-auto">
          <header className="flex items-center justify-between border-b border-[#dfe6ef] bg-white px-5 py-5 sm:px-8">
            <h1 className="text-[2rem] font-bold tracking-[-0.03em] text-[#102844]">
              Registro de Nuevo Cliente
            </h1>

            <div className="flex items-center gap-5 text-[#60748d]">
              <button className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[#f2f6fb]">
                <BellIcon />
              </button>
              <div className="hidden h-8 w-px bg-[#dce4ee] sm:block" />
              <button className="inline-flex items-center gap-2 text-lg font-medium text-[#344b66] transition hover:text-[#1c314a]">
                <span>Ayuda</span>
                <HelpIcon />
              </button>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="px-5 py-8 sm:px-8">
            <div className="space-y-6">
              <section className="rounded-[24px] border border-[#d8e2ee] bg-white p-6 shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
                <div className="grid gap-8 lg:grid-cols-[168px_minmax(0,1fr)] lg:items-center">
                  <div className="flex justify-center lg:justify-start">
                    <div className="relative">
                      <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-[#eef3f9] text-[#c0cad8]">
                        {profileImagePreview ? (
                          <Image
                            src={profileImagePreview}
                            alt="Vista previa del cliente"
                            width={144}
                            height={144}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <ProfileIcon />
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={handleProfileImageChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={handleProfileImageClick}
                        className="absolute bottom-1 right-0 flex h-12 w-12 items-center justify-center rounded-full bg-[#63b649] text-white shadow-[0_12px_26px_rgba(99,182,73,0.28)] transition hover:bg-[#54a13c]"
                      >
                        <CameraIcon />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Nombre Completo">
                      <input
                        type="text"
                        value={form.name}
                        onChange={(event) => handleFieldChange("name", event.target.value)}
                        placeholder="Ej: Juan Perez"
                        className={inputClassName}
                        required
                      />
                    </Field>

                    <Field label="Cedula de Identidad">
                      <input
                        type="text"
                        value={form.cedula}
                        onChange={(event) =>
                          handleFieldChange("cedula", formatCedula(event.target.value))
                        }
                        placeholder="000-0000000-0"
                        className={inputClassName}
                        required
                      />
                    </Field>

                    <Field label="Institucion">
                      <select
                        value={form.institution}
                        onChange={(event) => handleFieldChange("institution", event.target.value)}
                        className={inputClassName}
                        required
                      >
                        {institutionOptions.map((institution) => (
                          <option key={institution.value} value={institution.value}>
                            {institution.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>
              </section>

              <SectionCard icon={<ContactIcon />} title="Informacion de Contacto y Residencia">
                <div className="grid gap-5">
                  <Field label="Direccion Residencial">
                    <input
                      type="text"
                      value={form.address}
                      onChange={(event) => handleFieldChange("address", event.target.value)}
                      placeholder="Calle, Numero, Sector, Ciudad"
                      className={inputClassName}
                      required
                    />
                  </Field>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Fecha de Nacimiento">
                      <input
                        type="date"
                        value={form.birthDate}
                        onChange={(event) => handleFieldChange("birthDate", event.target.value)}
                        className={inputClassName}
                        required
                      />
                    </Field>

                    <Field label="Correo Electronico">
                      <input
                        type="email"
                        value={form.email}
                        onChange={(event) => handleFieldChange("email", event.target.value)}
                        placeholder="ejemplo@correo.com"
                        className={inputClassName}
                        required
                      />
                    </Field>

                    <Field label="Telefono Principal">
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(event) =>
                          handleFieldChange("phone", formatPhone(event.target.value))
                        }
                        placeholder="809-000-0000"
                        className={inputClassName}
                        required
                      />
                    </Field>

                    <Field label="Compania Telefonica">
                      <select
                        value={form.phoneCompany}
                        onChange={(event) => handleFieldChange("phoneCompany", event.target.value)}
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

                    <Field label="Telefono Secundario (Opcional)">
                      <input
                        type="text"
                        value={form.phone2}
                        onChange={(event) =>
                          handleFieldChange("phone2", formatPhone(event.target.value))
                        }
                        placeholder="809-000-0000"
                        className={inputClassName}
                      />
                    </Field>
                  </div>
                </div>
              </SectionCard>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.92fr)]">
                <SectionCard
                  icon={<BankIcon />}
                  title="Cuentas Bancarias"
                  action={
                    <button
                      type="button"
                      onClick={addBankAccount}
                      className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#63b649] transition hover:text-[#4f9938]"
                    >
                      <PlusCircleIcon />
                      Agregar Cuenta
                    </button>
                  }
                >
                  <div className="space-y-5">
                    {form.bankAccounts.map((account, index) => (
                      <div key={account.id} className="rounded-2xl border border-[#e5ebf3] bg-[#f9fbfd] p-5">
                        <div className="mb-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeBankAccount(index)}
                            disabled={form.bankAccounts.length === 1}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#a6b3c3] ring-1 ring-inset ring-[#dbe4ef] transition hover:text-[#6b7e95] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <CloseIcon />
                          </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_230px]">
                          <Field label="Banco">
                            <select
                              value={account.bankName}
                              onChange={(event) =>
                                handleAccountChange(index, "bankName", event.target.value)
                              }
                              className={inputClassName}
                              required
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
                                handleAccountChange(index, "accountType", event.target.value)
                              }
                              className={inputClassName}
                              required
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
                          <Field label="Numero de Cuenta">
                            <input
                              type="text"
                              value={account.accountNumber}
                              onChange={(event) =>
                                handleAccountChange(
                                  index,
                                  "accountNumber",
                                  formatAccountNumber(event.target.value)
                                )
                              }
                              placeholder="XXXXXXXXXX"
                              className={inputClassName}
                              required
                            />
                          </Field>
                        </div>
                      </div>
                    ))}

                    <div className="rounded-2xl border border-dashed border-[#dce6f0] px-5 py-6 text-center text-sm text-[#8ea0b5]">
                      Haga clic en agregar para registrar multiples cuentas.
                    </div>
                  </div>
                </SectionCard>

                <SectionCard icon={<KeyIcon />} title="Credenciales Netbanking">
                  <div className="space-y-6">
                    <div className="flex flex-col gap-3 rounded-2xl border border-[#e4ebf5] bg-[#fbfdff] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#163658]">
                          {getCredentialBankLabel(form.credentialBank)}
                        </p>
                        <p className="mt-1 text-sm text-[#6a7f97]">
                          Accede al login bancario para validar estas credenciales.
                        </p>
                      </div>
                      <a
                        href={getCredentialBankUrl(form.credentialBank)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-[#d7e3f4] bg-white px-4 text-sm font-semibold text-[#163658] transition hover:border-[#c7d8ef] hover:bg-[#f5f9ff]"
                      >
                        Abrir Netbanking
                      </a>
                    </div>

                    <Field label="Banco del Portal">
                      <select
                        value={form.credentialBank}
                        onChange={(event) =>
                          handleFieldChange("credentialBank", event.target.value)
                        }
                        className={inputClassName}
                        required
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
                        value={form.username}
                        onChange={(event) => handleFieldChange("username", event.target.value)}
                        placeholder="Usuario de banca en linea"
                        className={inputClassName}
                        required
                      />
                    </Field>

                    <Field label="Contrasena">
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(event) => handleFieldChange("password", event.target.value)}
                          placeholder="........"
                          className={`${inputClassName} pr-12`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#91a1b5] transition hover:text-[#62768f]"
                        >
                          <EyeIcon />
                        </button>
                      </div>
                    </Field>
                  </div>
                </SectionCard>
              </div>

              {error && (
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
              )}

              {successMessage && (
                <div className="rounded-2xl border border-[#cce9c5] bg-[#f3fbf1] px-5 py-4 text-sm text-[#3d8b3d]">
                  {successMessage}
                </div>
              )}

              <div className="flex flex-col-reverse gap-4 border-t border-[#dfe6ef] pt-8 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#61758e] transition hover:text-[#364a63]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#63b649] px-8 py-4 text-lg font-bold uppercase tracking-[0.18em] text-white shadow-[0_16px_30px_rgba(99,182,73,0.24)] transition hover:bg-[#55a13d] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Guardando..." : "Guardar Cliente"}
                </button>
              </div>
            </div>

            <footer className="mt-10 flex flex-col gap-3 text-sm text-[#8ba0b9] sm:flex-row sm:items-center sm:justify-between">
              <p>© 2024 Inversiones Fernandez. Sistema de Control Interno.</p>
              <div className="flex gap-5">
                <span>Politicas de Privacidad</span>
                <span>Soporte TI</span>
              </div>
            </footer>
          </form>
        </section>
      </div>
    </main>
  );
}

function buildPayload(
  form: typeof initialFormState,
  profileImageFile: File | null
): CreateClientPayload {
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
    profileImageFile,
  };
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

function SectionCard({
  icon,
  title,
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-[#d8e2ee] bg-white shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
      <div className="flex flex-col gap-3 border-b border-[#e7edf5] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="text-[#63b649]">{icon}</div>
          <h2 className="text-[2rem] font-bold tracking-[-0.04em] text-[#102844]">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5L3 18v1h18v-1Z" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 15h-1.5v-1.5H12Zm1.56-6.19-.67.69A2.55 2.55 0 0 0 12 13h-1.5v-.38a2.92 2.92 0 0 1 .86-2.06l.92-.94a1.45 1.45 0 1 0-2.48-1L9.7 9.7a2.95 2.95 0 1 1 4.86 1.11Z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-16 w-16 fill-current">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.33 0-6 1.79-6 4v1h12v-1c0-2.21-2.67-4-6-4Z" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M9 4 7.5 6H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2.5L15 4Zm3 12a3.5 3.5 0 1 1 3.5-3.5A3.5 3.5 0 0 1 12 16Z" />
    </svg>
  );
}

function ContactIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
      <path d="M19 3H5a2 2 0 0 0-2 2v14h18V5a2 2 0 0 0-2-2Zm-7 3a3 3 0 1 1-3 3 3 3 0 0 1 3-3Zm-5 9c0-2 2.67-3 5-3s5 1 5 3Z" />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
      <path d="M12 3 2 8v2h20V8Zm-7 9h2v6H5Zm4 0h2v6H9Zm4 0h2v6h-2Zm4 0h2v6h-2ZM2 20h20v2H2Z" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
      <path d="M7 14a5 5 0 1 1 4.9-6h9.6v3h-2v2h-2v2h-3.6A5 5 0 0 1 7 14Zm0-3a2 2 0 1 0-2-2 2 2 0 0 0 2 2Z" />
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

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 5c5.23 0 9.27 4.11 10 6.98-.73 2.88-4.77 7.02-10 7.02S2.73 14.86 2 11.98C2.73 9.11 6.77 5 12 5Zm0 2c-3.66 0-6.8 2.57-7.84 4.98C5.2 14.4 8.34 17 12 17s6.8-2.6 7.84-5.02C18.8 9.57 15.66 7 12 7Zm0 1.5a3.5 3.5 0 1 1-3.5 3.5A3.5 3.5 0 0 1 12 8.5Z" />
    </svg>
  );
}
