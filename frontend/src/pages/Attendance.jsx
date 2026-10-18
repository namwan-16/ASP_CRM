import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/client";
import { errorMessage } from "../api/crm";
import useRecords from "../hooks/useRecords";
import RequestState from "../components/RequestState";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { notify } from "../utils/notifications";
import "./Attendance.css";

function getStudentName(student) {
  return (
    student.name ||
    `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
    `Student ${student.id}`
  );
}

function getRowSnapshot(row) {
  return {
    status: row.status || "",
    notes: row.notes || "",
  };
}

export default function Attendance() {
  const sessions = useRecords("/sessions/");
  const [params] = useSearchParams();

  const [session, setSession] = useState(params.get("session") || "");
  const [sessionDetails, setSessionDetails] = useState(null);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const [dirty, setDirty] = useState(false);
  const initialValues = useRef(new Map());

  const sessionList = Array.isArray(sessions.data) ? sessions.data : [];

  useEffect(() => {
    const controller = new AbortController();

    setRows([]);
    setSessionDetails(null);
    setError("");
    setQuery("");
    setDirty(false);
    initialValues.current = new Map();

    if (!session) {
      setLoading(false);
      return () => controller.abort();
    }

    setLoading(true);

    api
      .get(`/sessions/${session}/roster/`, {
        signal: controller.signal,
      })
      .then((response) => {
        if (controller.signal.aborted) return;

        const students = Array.isArray(response.data?.students)
          ? response.data.students
          : [];

        setRows(students);
        setSessionDetails(response.data?.session || null);
        initialValues.current = new Map(
          students.map((student) => [student.id, getRowSnapshot(student)]),
        );
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
  }, [session, version]);

  const hasUnsavedChanges = useMemo(
    () =>
      rows.some((row) => {
        const initial = initialValues.current.get(row.id) || {
          status: "",
          notes: "",
        };
        const current = getRowSnapshot(row);

        return (
          current.status !== initial.status || current.notes !== initial.notes
        );
      }),
    [rows],
  );

  const attendanceCounts = useMemo(() => {
    const counts = {
      total: rows.length,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      unmarked: 0,
    };

    rows.forEach((row) => {
      if (row.status && Object.hasOwn(counts, row.status)) {
        counts[row.status] += 1;
      } else {
        counts.unmarked += 1;
      }
    });

    return counts;
  }, [rows]);

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) return rows;

    return rows.filter((row) => {
      const name = getStudentName(row).toLowerCase();
      const id = String(row.id).toLowerCase();
      const year = String(row.year_level || "").toLowerCase();

      return (
        name.includes(search) || id.includes(search) || year.includes(search)
      );
    });
  }, [rows, query]);

  const pagination = usePagination(
    filteredRows,
    `${session}:${query.trim().toLowerCase()}`,
  );

  const readOnly = sessionDetails?.status !== "scheduled";

  function update(id, field, value) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
    setDirty(true);
  }

  async function save(event) {
    event.preventDefault();

    const records = rows
      .filter((row) => row.status)
      .map((row) => ({
        student: row.id,
        status: row.status,
        notes: row.notes || "",
      }));

    if (!records.length) {
      notify.warning("Choose at least one attendance status.");
      return;
    }

    if (
      attendanceCounts.unmarked > 0 &&
      !window.confirm(
        `${attendanceCounts.unmarked} student${
          attendanceCounts.unmarked === 1 ? " is" : "s are"
        } still unmarked. Save the marked attendance and leave the remaining students unmarked?`,
      )
    ) {
      return;
    }

    setSaving(true);

    try {
      const response = await api.post(`/sessions/${session}/attendance/`, {
        records,
      });

      setRows((current) =>
        current.map((row) => {
          if (!row.status) return row;

          const updatedRow = {
            ...row,
            attendance_id: row.attendance_id || true,
          };

          initialValues.current.set(row.id, getRowSnapshot(updatedRow));
          return updatedRow;
        }),
      );

      setDirty(false);
      notify.success(`Saved ${response.data.saved} attendance records.`);
    } catch (requestError) {
      notify.error(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  function changeSession(event) {
    const nextSession = event.target.value;

    if (dirty && !window.confirm("Discard unsaved attendance changes?")) {
      return;
    }

    setSession(nextSession);
  }

  return (
    <main className="attendance-page">
      <header className="attendance-heading">
        <div>
          <h1>Attendance</h1>
          <p className="attendance-description">
            Select a class session and record each student’s attendance.
          </p>
        </div>
      </header>

      <section className="attendance-panel" aria-label="Select a class session">
        <div className="attendance-toolbar">
          <label className="attendance-control">
            <select
              value={session}
              onChange={changeSession}
              disabled={saving}
              aria-label="Class session"
            >
              <option value="">Select a class session</option>
              {sessionList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.course_name} — {item.date}{" "}
                  {item.start_time?.slice(0, 5)} ({item.room})
                  {item.status !== "scheduled" ? ` — ${item.status}` : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <RequestState
        loading={sessions.loading || loading}
        error={sessions.error || error}
        onRetry={() => {
          sessions.refresh();
          setVersion((value) => value + 1);
        }}
      />

      {sessionDetails && readOnly && (
        <p className="attendance-read-only" role="status">
          This session is {sessionDetails.status}. Attendance history is
          read-only. An administrator can restore it to make corrections.
        </p>
      )}

      {session && !loading && !error && (
        <>
          <section
            className="attendance-summary"
            aria-label="Attendance counts"
            aria-live="polite"
          >
            <div className="attendance-summary-card">
              <span className="attendance-summary-card__label">
                Total students
              </span>
              <strong>{attendanceCounts.total}</strong>
            </div>

            <div className="attendance-summary-card attendance-summary-card--present">
              <span className="attendance-summary-card__label">Present</span>
              <strong>{attendanceCounts.present}</strong>
            </div>

            <div className="attendance-summary-card attendance-summary-card--absent">
              <span className="attendance-summary-card__label">Absent</span>
              <strong>{attendanceCounts.absent}</strong>
            </div>

            <div className="attendance-summary-card attendance-summary-card--late">
              <span className="attendance-summary-card__label">Late</span>
              <strong>{attendanceCounts.late}</strong>
            </div>

            <div className="attendance-summary-card attendance-summary-card--excused">
              <span className="attendance-summary-card__label">Excused</span>
              <strong>{attendanceCounts.excused}</strong>
            </div>

            <div className="attendance-summary-card attendance-summary-card--waiting">
              <span className="attendance-summary-card__label">Unmarked</span>
              <strong>{attendanceCounts.unmarked}</strong>
            </div>
          </section>

          {attendanceCounts.unmarked > 0 && (
            <p className="attendance-unmarked-warning" role="status">
              {attendanceCounts.unmarked} student
              {attendanceCounts.unmarked === 1 ? " is" : "s are"} still
              unmarked. You can save the marks entered so far and complete the
              remaining attendance later.
            </p>
          )}

          <section className="attendance-panel" aria-label="Session attendance">
            <div className="attendance-panel__heading">
              <div>
                <h2>Student attendance</h2>
                <p>
                  Set each student’s status. Add a note if more context is
                  needed.
                </p>
              </div>
            </div>

            <div className="attendance-roster-toolbar">
              <label className="attendance-search">
                <span className="visually-hidden">Search the class roster</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search students by name, ID or year"
                  disabled={!rows.length}
                />
              </label>

              <span className="attendance-roster-count" aria-live="polite">
                Showing {filteredRows.length} of {rows.length} students
              </span>
            </div>

            <form onSubmit={save}>
              <div className="attendance-table-wrap">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th scope="col">Student</th>
                      <th scope="col">Year</th>
                      <th scope="col">Status</th>
                      <th scope="col">Notes</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pagination.rows.map((row) => {
                      const studentName = getStudentName(row);

                      return (
                        <tr
                          key={row.id}
                          className={
                            !row.status ? "attendance-row--unmarked" : undefined
                          }
                        >
                          <td>
                            <div className="attendance-student">
                              <strong>{studentName}</strong>
                              <span>ASP-{row.id}</span>
                            </div>
                          </td>

                          <td>{row.year_level || "—"}</td>

                          <td>
                            <select
                              className={`attendance-status-select${
                                row.status
                                  ? ` attendance-status-select--${row.status}`
                                  : ""
                              }`}
                              aria-label={`Attendance for ${studentName}`}
                              value={row.status || ""}
                              disabled={saving || readOnly}
                              onChange={(event) =>
                                update(row.id, "status", event.target.value)
                              }
                            >
                              <option
                                value=""
                                disabled={Boolean(row.attendance_id)}
                              >
                                Unmarked
                              </option>
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                              <option value="late">Late</option>
                              <option value="excused">Excused</option>
                            </select>
                          </td>

                          <td>
                            <input
                              className="attendance-notes-input"
                              aria-label={`Attendance notes for ${studentName}`}
                              value={row.notes || ""}
                              disabled={saving || readOnly}
                              onChange={(event) =>
                                update(row.id, "notes", event.target.value)
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}

                    {filteredRows.length === 0 && (
                      <tr>
                        <td className="attendance-empty" colSpan={4}>
                          {rows.length
                            ? "No students match your search."
                            : "No students are assigned to this session."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredRows.length > 0 && (
                <Pagination
                  {...pagination}
                  label="Attendance table pages"
                  disabled={saving}
                />
              )}

              <div className="attendance-form__actions">
                <button
                  className="attendance-save-button"
                  type="submit"
                  disabled={
                    saving ||
                    readOnly ||
                    !rows.length ||
                    loading ||
                    !hasUnsavedChanges
                  }
                >
                  {saving ? "Saving…" : "Save attendance"}
                </button>
              </div>
            </form>
          </section>
        </>
      )}
    </main>
  );
}
