import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import "./Reports.css";
import api from "../api/client";
import { download, errorMessage } from "../api/crm";
import useRecords from "../hooks/useRecords";
import RequestState from "../components/RequestState";
import Pagination from "../components/Pagination";
import { notify } from "../utils/notifications";

const TABS = [
  { key: "attendance", label: "Attendance" },
  { key: "late-arrivals", label: "Late arrivals" },
  { key: "enrolment", label: "Enrolment" },
  { key: "progress-notes", label: "Progress notes" },
];

const EMPTY = {
  results: [],
  columns: [],
  stats: [],
  count: 0,
};

export default function Reports() {
  const courses = useRecords("/courses/");

  const [kind, setKind] = useState("attendance");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [course, setCourse] = useState("");
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [report, setReport] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const dateRangeInvalid = Boolean(from && to && from > to);
  const hasFilters = Boolean(from || to || course);

  const query = new URLSearchParams({ kind });
  if (from) query.set("date_from", from);
  if (to) query.set("date_to", to);
  if (course) query.set("course", course);

  const queryString = query.toString();
  const courseRecords = Array.isArray(courses.data) ? courses.data : [];
  const requestError = error || courses.error;
  const requestsLoading = loading || courses.loading;

  useEffect(() => {
    const controller = new AbortController();

    setError("");

    if (dateRangeInvalid) {
      setReport(EMPTY);
      setLoading(false);
      return () => controller.abort();
    }

    setLoading(true);
    setReport(EMPTY);

    api
      .get(`/reports/summary/?${queryString}&page=${page}&page_size=5`, {
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (!controller.signal.aborted) {
          setReport({
            results: Array.isArray(data?.results) ? data.results : [],
            columns: Array.isArray(data?.columns) ? data.columns : [],
            stats: Array.isArray(data?.stats) ? data.stats : [],
            count: Number.isFinite(Number(data?.count))
              ? Number(data.count)
              : 0,
          });
        }
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(errorMessage(requestError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [queryString, page, version, dateRangeInvalid]);

  function filter(setter, value) {
    setter(value);
    setPage(1);
  }

  function clearFilters() {
    setFrom("");
    setTo("");
    setCourse("");
    setPage(1);
  }

  async function exportReport() {
    if (dateRangeInvalid) {
      notify.warning("Choose a valid date range before exporting.");
      return;
    }

    setExporting(true);

    try {
      // Keep the active filters, but omit page/page_size so the API can export
      // every row matching those filters.
      await download(
        `/reports/summary/?${queryString}&export=csv`,
        `${kind}-report.csv`,
      );
      notify.success("Report CSV downloaded.");
    } catch (requestError) {
      notify.error(errorMessage(requestError));
    } finally {
      setExporting(false);
    }
  }

  const canShowReport = !requestsLoading && !requestError && !dateRangeInvalid;

  return (
    <main className="rp-page">
      <header className="rp-top">
        <div>
          <h1>Reports</h1>
          <p>
            Generate attendance, late arrival, enrolment and progress reports.
          </p>
        </div>

        <button
          className="rp-btn"
          type="button"
          disabled={
            requestsLoading || exporting || !report.count || dateRangeInvalid
          }
          onClick={exportReport}
        >
          <Download size={16} aria-hidden="true" />
          {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </header>

      <div className="rp-tabs" role="tablist" aria-label="Report type">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={kind === tab.key}
            className={`rp-tab${kind === tab.key ? " is-active" : ""}`}
            onClick={() => filter(setKind, tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rp-filters">
        <label>
          From
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => filter(setFrom, event.target.value)}
          />
        </label>

        <label>
          To
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => filter(setTo, event.target.value)}
          />
        </label>

        <label>
          Subject
          <select
            value={course}
            onChange={(event) => filter(setCourse, event.target.value)}
          >
            <option value="">All subjects</option>
            {courseRecords.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <div className="rp-filters__actions">
          <button
            className="rp-clear-btn"
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters || requestsLoading}
          >
            Clear filters
          </button>
        </div>
      </div>

      {dateRangeInvalid && (
        <p className="rp-message rp-message--warning" role="alert">
          The start date must be on or before the end date.
        </p>
      )}

      <RequestState
        loading={requestsLoading}
        error={requestError}
        onRetry={() => {
          setVersion((value) => value + 1);
          courses.refresh();
        }}
      />

      {canShowReport && (
        <>
          <div className="rp-stats">
            {report.stats.map((stat) => (
              <div className="rp-stat" key={stat.label}>
                <strong>{stat.value ?? "—"}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>

          {kind === "attendance" && (
            <p className="rp-definition">
              Present includes late arrivals. The percentage uses recorded
              marks; unmarked students are shown separately. Cancelled sessions
              are excluded. Archived history is included.
            </p>
          )}

          <div className="rp-table" role="table" aria-label={`${kind} report`}>
            {report.columns.length > 0 && (
              <div
                className="rp-tr rp-th"
                role="row"
                style={{
                  gridTemplateColumns: `repeat(${report.columns.length}, minmax(0, 1fr))`,
                }}
              >
                {report.columns.map((column) => (
                  <span role="columnheader" key={column.key}>
                    {column.label}
                  </span>
                ))}
              </div>
            )}

            {report.results.map((row, index) => (
              <div
                className="rp-tr"
                role="row"
                key={
                  row.id ??
                  row.session_id ??
                  row.student_id ??
                  `${page}-${index}`
                }
                style={{
                  gridTemplateColumns: `repeat(${report.columns.length}, minmax(0, 1fr))`,
                }}
              >
                {report.columns.map((column) => (
                  <span role="cell" key={column.key}>
                    {column.bar ? (
                      <>
                        {row[column.key] == null ? "—" : `${row[column.key]}%`}
                        {row[column.key] != null && (
                          <i className="rp-bar">
                            <b
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(0, Number(row[column.key]) || 0),
                                )}%`,
                              }}
                            />
                          </i>
                        )}
                      </>
                    ) : (
                      (row[column.key] ?? "—")
                    )}
                  </span>
                ))}
              </div>
            ))}

            {!report.results.length && (
              <p className="rp-empty">No results for these filters.</p>
            )}
          </div>

          {report.count > 0 && (
            <div className="rp-pagination">
              <Pagination
                page={page}
                setPage={setPage}
                total={report.count}
                label="Report pages"
                itemLabel="report rows"
                disabled={loading}
              />
            </div>
          )}
        </>
      )}
    </main>
  );
}
