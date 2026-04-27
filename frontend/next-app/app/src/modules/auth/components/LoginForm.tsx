"use client";

import Image from "next/image";
import { useState } from "react";
import { useLogin } from "../hooks/useLogin";

export default function LoginForm() {
  const { login, loading } = useLogin();
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await login({ email, password: contrasena });
  };

  return (
    <section className="w-full max-w-[390px]">
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

      <div className="auth-panel rounded-[28px] border border-white/80 bg-white/95 px-9 py-10 shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
        <div>
          <h1 className="auth-title text-[2.2rem] font-bold leading-none tracking-[-0.04em] text-[#0d1c2f]">
            Bienvenido de nuevo
          </h1>
          <p className="auth-copy mt-3 max-w-[260px] text-sm leading-6 text-[#667085]">
            Inicia sesion para acceder a tu panel de administracion.
          </p>
        </div>

        <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="auth-label mb-2 block text-[11px] font-bold uppercase tracking-[0.26em] text-[#7f8898]">
              Usuario
            </span>
            <span className="auth-field flex h-14 items-center rounded-xl bg-[#f2f3f6] px-4 text-[#96a3b6] ring-1 ring-inset ring-[#e8ebf0] transition focus-within:bg-white focus-within:ring-[#cad2df]">
              <UserIcon />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ingresa tu usuario"
                autoComplete="email"
                className="auth-input w-full bg-transparent pl-3 text-sm text-[#122033] outline-none placeholder:text-[#b0bac8]"
              />
            </span>
          </label>

          <label className="block">
            <span className="auth-label mb-2 block text-[11px] font-bold uppercase tracking-[0.26em] text-[#7f8898]">
              Contrasena
            </span>
            <span className="auth-field flex h-14 items-center rounded-xl bg-[#f2f3f6] px-4 text-[#96a3b6] ring-1 ring-inset ring-[#e8ebf0] transition focus-within:bg-white focus-within:ring-[#cad2df]">
              <LockIcon />
              <input
                type={mostrarContrasena ? "text" : "password"}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="........"
                autoComplete="current-password"
                className="auth-input w-full bg-transparent px-3 text-sm text-[#122033] outline-none placeholder:text-[#b0bac8]"
              />
              <button
                type="button"
                onClick={() => setMostrarContrasena((valorActual) => !valorActual)}
                className="auth-ghost text-[#89a0bb] transition hover:text-[#5d7693]"
                aria-label={mostrarContrasena ? "Ocultar contrasena" : "Mostrar contrasena"}
              >
                <EyeIcon />
              </button>
            </span>
          </label>

          <div className="flex justify-end">
            <button
              type="button"
              className="auth-link text-sm font-semibold text-[#4e9a58] transition hover:text-[#3b8144]"
            >
              Olvidaste tu contrasena?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex h-14 w-full items-center justify-center rounded-xl bg-[#0a2238] px-6 text-sm font-bold uppercase tracking-[0.24em] text-white transition hover:bg-[#102d47] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span>{loading ? "Cargando..." : "Iniciar sesion"}</span>
            {!loading && <span className="ml-3 text-base">-&gt;</span>}
          </button>
        </form>

        <div className="auth-divider my-7 h-px bg-[#edf0f5]" />

        <div className="auth-meta flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#bcc5d2]">
          <ShieldIcon />
          <span>Encripcion Sovereign Ledger Activa</span>
        </div>
      </div>
    </section>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.33 0-6 1.79-6 4v1h12v-1c0-2.21-2.67-4-6-4Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
      <path d="M17 9h-1V7a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-6 0V7a2 2 0 1 1 4 0v2Z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
      <path d="M12 5c5.23 0 9.27 4.11 10 6.98-.73 2.88-4.77 7.02-10 7.02S2.73 14.86 2 11.98C2.73 9.11 6.77 5 12 5Zm0 2c-3.66 0-6.8 2.57-7.84 4.98C5.2 14.4 8.34 17 12 17s6.8-2.6 7.84-5.02C18.8 9.57 15.66 7 12 7Zm0 1.5a3.5 3.5 0 1 1-3.5 3.5A3.5 3.5 0 0 1 12 8.5Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[14px] w-[14px] fill-current">
      <path d="M12 2 5 5v6c0 4.53 2.98 8.74 7 10 4.02-1.26 7-5.47 7-10V5Zm0 9.75A1.75 1.75 0 1 1 13.75 10 1.75 1.75 0 0 1 12 11.75Z" />
    </svg>
  );
}
