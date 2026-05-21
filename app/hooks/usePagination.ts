"use client"

import { useMemo, useState } from "react"

export function usePagination<T>(items: T[], initialPageSize = 10) {
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [currentPage, items, pageSize])

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    currentPage,
    paginatedItems,
    canGoPrevious: currentPage > 1,
    canGoNext: currentPage < totalPages,
    goPrevious: () => setPage((current) => Math.max(1, current - 1)),
    goNext: () => setPage((current) => Math.min(totalPages, current + 1)),
    resetPage: () => setPage(1),
  }
}
