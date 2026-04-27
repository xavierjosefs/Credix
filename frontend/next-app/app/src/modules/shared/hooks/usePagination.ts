"use client";

import { useMemo, useState } from "react";

export function usePagination<T>(items: T[], pageSize: number) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, pageSize, safeCurrentPage]);

  return {
    currentPage: safeCurrentPage,
    totalPages,
    pageSize,
    totalItems: items.length,
    paginatedItems,
    setCurrentPage,
    goToPreviousPage: () => setCurrentPage((page) => Math.max(1, page - 1)),
    goToNextPage: () => setCurrentPage((page) => Math.min(totalPages, page + 1)),
  };
}
