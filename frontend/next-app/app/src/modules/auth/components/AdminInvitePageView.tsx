"use client";

import { clearSession } from "@/app/src/modules/auth/services/session.service";
import { inviteAdminService } from "@/app/src/modules/auth/services/auth.service";
import AppSidebar from "@/app/src/modules/dashboard/components/AppSidebar";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminInvitePageView() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [cedula, setCedula] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExpiredSession = () => {
    clearSession();
    router.replace("/login");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await inviteAdminService({
        name: name.trim(),
        cedula,
        email: email.trim(),
      });

      setSuccess("Invitacion enviada correctamente. El nuevo admin recibira un correo para completar su registro.");
      setName("");
      setCedula("");
      setEmail("");
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "No se pudo registrar la invitacion del administrador.";

      if (message === "Tu sesion expiro. Inicia sesion nuevamente.") {
        setError(message);
        return;
      }

      setError(translateInviteError(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-[#f4f7fb] text-[#1f3552] lg:h-screen lg:overflow-hidden">
      <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row">
        <AppSidebar />

        <section className="flex-1 lg:overflow-y-auto">
          <header className="border-b border-[#dfe6ef] bg-white px-5 py-5 sm:px-8">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#67b549]">
                Configuracion
              </p>
              <div>
                <h1 className="text-[2.1rem] font-bold tracking-[-0.03em] text-[#102844]">
                  Registrar Nuevo Administrador
                </h1>
                <p className="mt-2 text-sm text-[#74879c]">
                  Crea una invitacion para que un nuevo administrador complete su registro desde el correo.
                </p>
              </div>
            </div>
          </header>

          <div className="space-y-6 px-5 py-8 sm:px-8">
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
              <article className="rounded-[24px] border border-[#d8e2ee] bg-white shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
                <div className="border-b border-[#e7edf5] px-6 py-5">
                  <h2 className="text-[1.5rem] font-bold tracking-[-0.03em] text-[#102844]">
                    Datos del Administrador
                  </h2>
                </div>

                <form className="space-y-5 p-6" onSubmit={handleSubmit}>
                  <FieldLabel label="Nombre completo">
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Ej. Maria Rodriguez"
                      className="h-14 w-full rounded-2xl border border-[#d9e2ed] bg-[#fbfcfe] px-4 text-[#24384f] outline-none transition placeholder:text-[#8f9db0] focus:border-[#bfd0e3] focus:bg-white"
                      required
                    />
                  </FieldLabel>

                  <div className="grid gap-5 md:grid-cols-2">
                    <FieldLabel label="Cedula">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cedula}
                        onChange={(event) => setCedula(formatCedula(event.target.value))}
                        placeholder="000-0000000-0"
                        className="h-14 w-full rounded-2xl border border-[#d9e2ed] bg-[#fbfcfe] px-4 text-[#24384f] outline-none transition placeholder:text-[#8f9db0] focus:border-[#bfd0e3] focus:bg-white"
                        required
                      />
                    </FieldLabel>

                    <FieldLabel label="Correo electronico">
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="admin@correo.com"
                        className="h-14 w-full rounded-2xl border border-[#d9e2ed] bg-[#fbfcfe] px-4 text-[#24384f] outline-none transition placeholder:text-[#8f9db0] focus:border-[#bfd0e3] focus:bg-white"
                        required
                      />
                    </FieldLabel>
                  </div>

                  {error ? (
                    <div className="rounded-2xl border border-[#f5caca] bg-[#fff5f5] px-4 py-3 text-sm text-[#c24141]">
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
                  ) : null}

                  {success ? (
                    <div className="rounded-2xl border border-[#cce9c5] bg-[#f3fbf1] px-4 py-3 text-sm text-[#3d8b3d]">
                      {success}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setName("");
                        setCedula("");
                        setEmail("");
                        setError(null);
                        setSuccess(null);
                      }}
                      className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#d9e2ed] bg-white px-6 text-sm font-semibold text-[#60748d] transition hover:bg-[#f8fafc]"
                    >
                      Limpiar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#63b649] px-6 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(99,182,73,0.24)] transition hover:bg-[#54a13c] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? "Enviando invitacion..." : "Invitar administrador"}
                    </button>
                  </div>
                </form>
              </article>

              <div className="space-y-6">
                <InfoCard
                  title="Como funciona"
                  items={[
                    "Se registra un pre-usuario con nombre, cedula y correo.",
                    "El sistema envia un enlace al correo del administrador invitado.",
                    "El nuevo admin define su contrasena desde ese enlace.",
                  ]}
                />

                <InfoCard
                  title="Recomendaciones"
                  items={[
                    "Verifica que la cedula sea valida antes de enviar la invitacion.",
                    "Asegurate de que el correo tenga acceso para recibir el enlace.",
                    "Si el admin ya existe o fue pre-registrado, el backend lo notificara.",
                  ]}
                  tone="soft"
                />
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#7f91a6]">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoCard({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "soft";
}) {
  return (
    <article
      className={`rounded-[24px] border px-6 py-6 shadow-[0_12px_34px_rgba(29,46,77,0.05)] ${
        tone === "soft"
          ? "border-[#d8e9d2] bg-[#f7fbf5]"
          : "border-[#d8e2ee] bg-white"
      }`}
    >
      <h3 className="text-[1.35rem] font-bold tracking-[-0.03em] text-[#102844]">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-3 text-sm leading-6 text-[#5f748d]">
            <span className="mt-2 h-2 w-2 rounded-full bg-[#63b649]" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function formatCedula(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
}

function translateInviteError(message: string) {
  switch (message) {
    case "Invalid cedula format":
      return "La cedula no tiene un formato valido.";
    case "There is already a pending invitation for this cedula":
      return "Ya existe una invitacion pendiente con esa cedula.";
    case "There is already a pending invitation for this email":
      return "Ya existe una invitacion pendiente con ese correo.";
    case "There is already a registered administrator with this cedula":
      return "Ya existe un administrador registrado con esa cedula.";
    case "There is already a registered administrator with this email":
      return "Ya existe un administrador registrado con ese correo.";
    default:
      return message;
  }
}
