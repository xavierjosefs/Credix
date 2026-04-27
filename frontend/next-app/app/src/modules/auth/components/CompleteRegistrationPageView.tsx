"use client";

import { completeRegistrationService } from "@/app/src/modules/auth/services/auth.service";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function CompleteRegistrationPageView({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasToken = useMemo(() => token.trim().length > 0, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasToken) {
      setError("El enlace de registro no contiene un token valido.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Debes completar ambos campos de contrasena.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await completeRegistrationService({ token, password });

      setPassword("");
      setConfirmPassword("");
      router.replace("/login");
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "No se pudo completar el registro.";
      setError(translateRegistrationError(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f9fb]">
      <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] -skew-x-[7deg] bg-[#eef1f5] md:block" />

      <div className="relative z-10 flex min-h-screen flex-col px-6 py-8 sm:px-8 lg:px-10">
        <div className="flex flex-1 items-center justify-center">
          <section className="w-full max-w-[420px]">
            <div className="mb-12 flex justify-center">
              <Image
                src="/images/logo.png"
                alt="Inversiones Fernandez"
                width={164}
                height={58}
                className="h-auto w-[164px]"
                priority
              />
            </div>

            <div className="rounded-[28px] border border-white/80 bg-white/95 px-9 py-10 shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
              <div>
                <h1 className="text-[2.1rem] font-bold leading-none tracking-[-0.04em] text-[#0d1c2f]">
                  Completar Registro
                </h1>
                <p className="mt-3 text-sm leading-6 text-[#667085]">
                  Define tu contrasena para activar tu cuenta de administrador.
                </p>
              </div>

              <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
                <Field label="Nueva contrasena">
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Ingresa tu contrasena"
                    className="h-14 w-full rounded-xl bg-[#f2f3f6] px-4 text-sm text-[#122033] outline-none ring-1 ring-inset ring-[#e8ebf0] transition placeholder:text-[#b0bac8] focus:bg-white focus:ring-[#cad2df]"
                  />
                </Field>

                <Field label="Confirmar contrasena">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repite tu contrasena"
                    className="h-14 w-full rounded-xl bg-[#f2f3f6] px-4 text-sm text-[#122033] outline-none ring-1 ring-inset ring-[#e8ebf0] transition placeholder:text-[#b0bac8] focus:bg-white focus:ring-[#cad2df]"
                  />
                </Field>

                {error ? (
                  <div className="rounded-2xl border border-[#f5caca] bg-[#fff5f5] px-4 py-3 text-sm text-[#c24141]">
                    {error}
                  </div>
                ) : null}

                {success ? (
                  <div className="rounded-2xl border border-[#cce9c5] bg-[#f3fbf1] px-4 py-3 text-sm text-[#3d8b3d]">
                    {success}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading || !hasToken}
                  className="flex h-14 w-full items-center justify-center rounded-xl bg-[#0a2238] px-6 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#102d47] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Guardando..." : "Activar cuenta"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-[#6b7e95]">
                <Link href="/login" className="font-semibold text-[#4e9a58] transition hover:text-[#3b8144]">
                  Volver al inicio de sesion
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.26em] text-[#7f8898]">
        {label}
      </span>
      {children}
    </label>
  );
}

function translateRegistrationError(message: string) {
  switch (message) {
    case "Token and password are required":
      return "Debes proporcionar el token y la contrasena.";
    case "Invalid token":
      return "El enlace de registro no es valido.";
    case "Token has expired":
      return "El enlace de registro ya expiro.";
    default:
      return message;
  }
}
