import { useState } from "react";

export const PAGE_SIZE = 5;

export default function usePagination(rows, resetKey = "") {
  const [state, setState] = useState({ page: 1, key: resetKey });
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = state.key === resetKey ? Math.min(state.page, pages) : 1;
  function setPage(value) {
    const next = typeof value === "function" ? value(page) : value;
    setState({ page: Math.max(1, Math.min(next, pages)), key: resetKey });
  }
  return { rows: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), page, setPage, total: rows.length };
}
