"use client";

import type { AuthUser } from "@/app/src/modules/types/auth.types";
import {
  clearSession,
  getStoredUser,
  getStoredUserServerSnapshot,
  subscribeStoredUser,
} from "@/app/src/modules/auth/services/session.service";
import ThemeToggle from "@/app/src/modules/theme/components/ThemeToggle";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType } from "react";
import { useSyncExternalStore } from "react";

const primaryItems = [
  { label: "Dashboard", href: "/home", icon: GridIcon, match: ["/home"] },
  { label: "Clientes", href: "/clients", icon: UsersIcon, match: ["/clients"] },
  { label: "Prestamos", href: "/loans", icon: WalletIcon, match: ["/loans"] },
  { label: "Caja", href: "/cash", icon: CardIcon, match: ["/cash"] },
];

const secondaryItems = [
  { label: "Configuracion", href: "/settings", icon: CogIcon, match: ["/settings"] },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSyncExternalStore(
    subscribeStoredUser,
    getStoredUser,
    getStoredUserServerSnapshot
  ) as AuthUser | null;

  const handleLogout = () => {
    clearSession();
    router.replace("/login");
  };

  const userName = user?.name ?? "Usuario";
  const userRole = user?.role ?? "Sin rol";
  const userEmail = user?.email ?? "Sin correo";
  const userInitials = getInitials(userName, userEmail);

  return (
    <aside className="flex w-full shrink-0 flex-col bg-[#0f304b] text-white lg:h-screen lg:w-[212px] lg:overflow-hidden">
      <div className="flex items-center justify-center px-6 py-8 lg:py-5">
        <div className="flex h-32 w-32 items-center justify-center rounded-sm bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] lg:h-[156px] lg:w-[156px]">
          <Image
            src="/images/logo.png"
            alt="Inversiones Fernandez"
            width={112}
            height={112}
            className="h-auto w-28"
            priority
          />il
        </div>
      </div>

      <nav className="px-3 pb-4">
        <div className="space-y-1">
          {primaryItems.map((item) => (
            <SidebarItem
              key={item.label}
              label={item.label}
              icon={item.icon}
              href={item.href}
              active={item.match.some((prefix) => pathname.startsWith(prefix))}
            />
          ))}
        </div>

        <div className="px-4 pb-4 pt-10 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f879d]">
          Sistema
        </div>

        <div className="space-y-1">
          {secondaryItems.map((item) => (
            <SidebarItem
              key={item.label}
              label={item.label}
              icon={item.icon}
              href={item.href}
              active={item.match.some((prefix) => pathname.startsWith(prefix))}
            />
          ))}
        </div>
      </nav>

      <div className="mt-auto space-y-4 border-t border-white/6 bg-[#0c273c] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#77c252] font-bold text-white">
            {userInitials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{userName}</p>
            <p className="truncate text-xs text-[#8fa4b8]">{userRole}</p>
          </div>
        </div>

        <ThemeToggle />

        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-[#dfe9f3] transition hover:bg-white/5"
        >
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({
  label,
  href,
  active,
  icon: Icon,
}: {
  label: string;
  href?: string;
  active: boolean;
  icon: ComponentType;
}) {
  const className = `flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-[1.1rem] font-medium transition ${
    active
      ? "bg-[#1d4f3a] text-[#7cc847] shadow-[inset_3px_0_0_0_#7cc847]"
      : "text-[#d0d9e4] hover:bg-white/5"
  }`;

  if (!href) {
    return (
      <div className={className}>
        <Icon />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <Link href={href} className={className}>
      <Icon />
      <span>{label}</span>
    </Link>
  );
}

function getInitials(name: string, email: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (words.length > 0) {
    return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
  }

  return email.slice(0, 2).toUpperCase();
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M4 4h7v7H4Zm9 0h7v7h-7ZM4 13h7v7H4Zm9 0h7v7h-7Z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M16 11a3 3 0 1 0-2.99-3A3 3 0 0 0 16 11Zm-8 0A3 3 0 1 0 5 8a3 3 0 0 0 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0a8.3 8.3 0 0 0-1.29.1A4.86 4.86 0 0 1 17 16.5V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M19 7H5a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V10a3 3 0 0 0-3-3Zm0 10H5v-7h14Zm-3-4a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 16 13Zm3-9H6a3 3 0 0 0-3 3h16Z" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M20 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2ZM4 9V7h16v2Zm0 8v-5h16v5Z" />
    </svg>
  );
}

function CogIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="m19.14 12.94.86-1.49-1.72-2.98-1.69.34a5.9 5.9 0 0 0-1.28-.74L14.7 6h-3.4l-.61 2.07a5.9 5.9 0 0 0-1.28.74l-1.69-.34L6 11.45l.86 1.49a6.42 6.42 0 0 0 0 1.12L6 15.55l1.72 2.98 1.69-.34c.39.29.82.53 1.28.74l.61 2.07h3.4l.61-2.07c.46-.21.89-.45 1.28-.74l1.69.34L20 15.55l-.86-1.49a6.42 6.42 0 0 0 0-1.12ZM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5Z" />
    </svg>
  );
}
