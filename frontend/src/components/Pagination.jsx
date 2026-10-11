import { PAGE_SIZE } from "../hooks/usePagination";

export default function Pagination({ page, setPage, total, label = "Table pages", disabled = false }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const first = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  return (
    <nav className="crm-pagination" aria-label={label}>
      <span className="crm-pagination__summary" aria-live="polite">
        Showing {first}–{Math.min(page * PAGE_SIZE, total)} of {total}
      </span>
      <div className="crm-pagination__controls">
        <button type="button" disabled={disabled || page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span>Page {page} of {pages}</span>
        <button type="button" disabled={disabled || page >= pages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </nav>
  );
}
