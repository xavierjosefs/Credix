"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type DocumentNavItem = {
  href: string;
  label: string;
  active?: boolean;
};

export default function DocumentPageShell({
  subtitle,
  navItems,
  onPrint,
  children,
}: {
  subtitle: string;
  navItems: DocumentNavItem[];
  onPrint: () => void;
  children: ReactNode;
}) {
  return (
    <main className="theme-document min-h-screen bg-[#f4f7fb] text-[#213754] print:min-h-0">
      <header className="print:hidden border-b border-[#d7e3ef] bg-[#14314d] px-5 py-5 text-white sm:px-8">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-10 w-10 overflow-hidden rounded-md bg-white/10">
              <Image
                src="/images/logo.png"
                alt="Inversiones Fernandez"
                fill
                className="object-contain p-1.5"
                unoptimized
              />
            </div>
            <div>
              <p className="text-[1.2rem] font-semibold tracking-[-0.02em]">
                Inversiones Fernandez
              </p>
              <p className="text-sm text-white/70">{subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {navItems.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={
                  item.active
                    ? "rounded-xl border-b-2 border-[#63b649] px-4 py-2 text-sm font-semibold text-white"
                    : "rounded-xl px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/8 hover:text-white"
                }
              >
                {item.label}
              </Link>
            ))}

            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center rounded-xl bg-[#2f8e1f] px-5 py-2.5 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[0_12px_24px_rgba(47,142,31,0.24)] transition hover:bg-[#277a19]"
            >
              Imprimir
            </button>
          </div>
        </div>
      </header>

      <div className="px-5 py-8 sm:px-8 print:px-0 print:py-0">
        <section className="mx-auto max-w-[1120px]">{children}</section>
      </div>
    </main>
  );
}
