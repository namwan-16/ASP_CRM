import { PAGE_SIZE } from "../hooks/usePagination";

export default function Pagination({
  page,
  setPage,
  total,
  label = "Table pages",
  itemLabel = "items",
  disabled = false,
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const first = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(page * PAGE_SIZE, total);

  return (
    <nav className="crm-pagination" aria-label={label}>
      <span className="crm-pagination__summary" aria-live="polite">
        {total
          ? `Showing ${first}–${last} of ${total} ${itemLabel}`
          : `Showing 0 ${itemLabel}`}
      </span>

      <div className="crm-pagination__controls">
        <button
          type="button"
          aria-label="Go to previous page"
          disabled={disabled || page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>

        <span aria-current="page">
          Page {page} of {pages}
        </span>

        <button
          type="button"
          aria-label="Go to next page"
          disabled={disabled || page >= pages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
