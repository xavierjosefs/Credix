"use client";

export default function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  itemLabel,
  onPrevious,
  onNext,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel: string;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-[#e7edf5] bg-[#fbfcfe] px-5 py-4 text-sm text-[#7f91a6] sm:flex-row sm:items-center sm:justify-between">
      <p>
        Mostrando {startItem}-{endItem} de {totalItems} {itemLabel}
      </p>

      <div className="flex items-center gap-3">
        <span>
          Pagina {currentPage} de {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={currentPage === 1}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-[#d9e2ed] bg-white px-3 text-sm font-semibold text-[#60748d] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={currentPage === totalPages || totalItems === 0}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-[#d9e2ed] bg-white px-3 text-sm font-semibold text-[#60748d] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
