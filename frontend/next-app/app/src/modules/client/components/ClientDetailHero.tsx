"use client";

import Image from "next/image";
import type { ChangeEvent, RefObject } from "react";
import type { ClientRecord } from "@/app/src/modules/client/types/client.types";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function UserCardIconSmall() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.33 0-6 1.79-6 4v1h12v-1c0-2.21-2.67-4-6-4Z" />
    </svg>
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
      className={`rounded-[22px] border px-4 py-4 shadow-[0_10px_24px_rgba(16,40,68,0.05)] ${
        accent
          ? "border-[#d7ebd0] bg-[linear-gradient(135deg,_#f9fff6_0%,_#f2f9ee_100%)]"
          : "border-[#e5ebf3] bg-[linear-gradient(135deg,_#ffffff_0%,_#f7fafe_100%)]"
      }`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a9aaf]">{label}</p>
      <p className="mt-2 truncate text-base font-semibold text-[#24384f]">{value}</p>
    </div>
  );
}

export default function ClientDetailHero({
  client,
  editing,
  editProfileImagePreview,
  imageInputRef,
  onOpenImage,
  onTriggerImagePicker,
  onEditProfileImageChange,
}: {
  client: ClientRecord;
  editing: boolean;
  editProfileImagePreview: string | null;
  imageInputRef: RefObject<HTMLInputElement | null>;
  onOpenImage: () => void;
  onTriggerImagePicker: () => void;
  onEditProfileImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <section className="rounded-[24px] border border-[#d8e2ee] bg-white p-6 shadow-[0_12px_34px_rgba(29,46,77,0.05)]">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (!editing && client.profileImage) {
                  onOpenImage();
                }
              }}
              className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#eef3f9_55%,_#dce6f1_100%)] text-3xl font-bold text-[#75889f] shadow-[inset_0_2px_10px_rgba(255,255,255,0.7),0_14px_28px_rgba(16,40,68,0.08)] ${
                !editing && client.profileImage ? "cursor-zoom-in transition hover:scale-[1.02]" : ""
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
                  onClick={onTriggerImagePicker}
                  className="absolute -bottom-2 left-[4.1rem] inline-flex h-10 items-center justify-center rounded-full border-4 border-white bg-[#63b649] px-3 text-xs font-bold text-white shadow-[0_10px_18px_rgba(99,182,73,0.28)] transition hover:bg-[#54a13c]"
                >
                  Cambiar
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={onEditProfileImageChange}
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
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:min-w-[520px]">
          <ModernInfoPill label="Cedula" value={client.cedula} />
          <ModernInfoPill label="Telefono" value={client.phone} />
          <ModernInfoPill label="Cuentas" value={`${client.bankAccounts.length}`} accent />
        </div>
      </div>
    </section>
  );
}
