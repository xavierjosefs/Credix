"use client";

import { clearSession } from "@/app/src/modules/auth/services/session.service";
import type { ClientRecord } from "@/app/src/modules/client/types/client.types";
import AppSidebar from "@/app/src/modules/dashboard/components/AppSidebar";
import TablePagination from "@/app/src/modules/shared/components/TablePagination";
import { usePagination } from "@/app/src/modules/shared/hooks/usePagination";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useClients } from "../hooks/useClients";

export default function ClientsPageView({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const { clients, loading, searching, error, activeQuery, searchClients, reloadClients } =
    useClients();
  const [query, setQuery] = useState(initialQuery);
  const clientsPagination = usePagination(clients, 10);

  useEffect(() => {
    const trimmedQuery = initialQuery.trim();

    if (trimmedQuery) {
      void searchClients(trimmedQuery);
      return;
    }

    void reloadClients();
  }, [initialQuery, reloadClients, searchClients]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await searchClients(query);
  };

  const handleClear = async () => {
    setQuery("");
    await reloadClients();
  };

  const handleExpiredSession = () => {
    clearSession();
    router.replace("/login");
  };

  return (
    <main className="bg-[#f4f7fb] text-[#213754] lg:h-screen lg:overflow-hidden">
      <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row">
        <AppSidebar />

        <section className="flex-1 lg:overflow-y-auto">
          <header className="flex flex-col gap-4 border-b border-[#dfe6ef] bg-white px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-[2rem] font-bold tracking-[-0.03em] text-[#102844]">
                Clientes Registrados
              </h1>
              <p className="mt-1 text-sm text-[#74879c]">
                Consulta, busca y revisa la informacion principal de tus clientes.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/clients/new"
                className="inline-flex h-11 items-center rounded-xl bg-[#63b649] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(99,182,73,0.24)] transition hover:bg-[#54a13c]"
              >
                <span className="mr-2 text-base">+</span>
                Nuevo Cliente
              </Link>
            </div>
          </header>

          <div className="px-5 py-8 sm:px-8">
            <section className="rounded-[24px] border border-[#d8e2ee] bg-white p-6 shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#102844]">
                    Listado de Clientes
                  </h2>
                  <p className="mt-1 text-sm text-[#778aa1]">
                    Busca por cédula, correo electrónico o nombre.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex w-full max-w-[720px] flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#92a1b5]">
                      <SearchIcon />
                    </span>
                    <input
                      type="text"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Buscar por cédula, correo o nombre"
                      className="h-12 w-full rounded-xl border border-[#d9e2ed] bg-[#fbfcfe] pl-11 pr-4 text-sm text-[#25384f] outline-none transition placeholder:text-[#8f9db0] focus:border-[#bfd0e3] focus:bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searching}
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-[#102844] px-5 text-sm font-semibold text-white transition hover:bg-[#183757] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {searching ? "Buscando..." : "Buscar"}
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={searching}
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-[#d9e2ed] bg-white px-5 text-sm font-semibold text-[#60748d] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Limpiar
                  </button>
                </form>
              </div>

              {activeQuery && !error && (
                <div className="mt-5 rounded-2xl border border-[#d8e7f5] bg-[#f6fafe] px-4 py-3 text-sm text-[#5f748d]">
                  Mostrando resultado para: <span className="font-semibold text-[#1f3552]">{activeQuery}</span>
                </div>
              )}

              {error && (
                <div className="mt-5 rounded-2xl border border-[#f5caca] bg-[#fff5f5] px-4 py-3 text-sm text-[#c24141]">
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

              <div className="mt-6 overflow-hidden rounded-[20px] border border-[#e3eaf2]">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="bg-[#f7f9fc] text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a9aaf]">
                      <tr>
                        <th className="px-5 py-4">Cliente</th>
                        <th className="px-5 py-4">Cédula</th>
                        <th className="px-5 py-4">Correo</th>
                        <th className="px-5 py-4">Teléfono</th>
                        <th className="px-5 py-4">Cuentas</th>
                        <th className="px-5 py-4">Registro</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-14 text-center text-sm text-[#7b8da2]">
                            Cargando clientes...
                          </td>
                        </tr>
                      ) : clients.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-14 text-center text-sm text-[#7b8da2]">
                            No hay clientes para mostrar.
                          </td>
                        </tr>
                      ) : (
                        clientsPagination.paginatedItems.map((client) => (
                          <ClientRow
                            key={client.id}
                            client={client}
                            onOpen={() => router.push(`/clients/${client.id}`)}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {!loading && clients.length > 0 ? (
                <TablePagination
                  currentPage={clientsPagination.currentPage}
                  totalPages={clientsPagination.totalPages}
                  totalItems={clientsPagination.totalItems}
                  pageSize={clientsPagination.pageSize}
                  itemLabel="clientes"
                  onPrevious={clientsPagination.goToPreviousPage}
                  onNext={clientsPagination.goToNextPage}
                />
              ) : null}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function ClientRow({
  client,
  onOpen,
}: {
  client: ClientRecord;
  onOpen: () => void;
}) {
  return (
    <tr
      onDoubleClick={onOpen}
      className="cursor-pointer border-t border-[#edf1f6] transition hover:bg-[#f8fbfe]"
      title="Doble clic para ver el detalle"
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#eef3f9] text-sm font-bold text-[#74889f]">
            {client.profileImage ? (
              <Image
                src={client.profileImage}
                alt={client.name}
                width={40}
                height={40}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              getInitials(client.name)
            )}
          </div>
          <div>
            <p className="font-semibold text-[#24384f]">{client.name}</p>
            <p className="text-sm text-[#7f91a6]">{client.address}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-sm text-[#52657c]">{client.cedula}</td>
      <td className="px-5 py-4 text-sm text-[#52657c]">{client.email}</td>
      <td className="px-5 py-4 text-sm text-[#52657c]">{client.phone}</td>
      <td className="px-5 py-4">
        <span className="inline-flex rounded-full bg-[#eef8ed] px-3 py-1 text-xs font-semibold text-[#4f9938]">
          {client.bankAccounts.length} cuenta{client.bankAccounts.length === 1 ? "" : "s"}
        </span>
      </td>
      <td className="px-5 py-4 text-sm text-[#7f91a6]">{formatDate(client.createdAt)}</td>
    </tr>
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

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M10 2a8 8 0 1 0 5 14.24l4.38 4.38 1.42-1.42-4.38-4.38A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1-6 6 6 6 0 0 1 6-6Z" />
    </svg>
  );
}
