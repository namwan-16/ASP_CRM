import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/client";
import { errorMessage } from "../api/crm";
import useRecords from "../hooks/useRecords";
import RequestState from "../components/RequestState";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { notify } from "../utils/notifications";
import "./Attendance.css";

export default function Attendance() {
  const sessions = useRecords("/sessions/");
  const [params] = useSearchParams();

  const [session, setSession] = useState(params.get("session") || "");
  const [sessionDetails, setSessionDetails] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    setRows([]);
    setSessionDetails(null);
    setError("");
    setDirty(false);

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
        if (!controller.signal.aborted) {
          setRows(response.data.students || []);
          setSessionDetails(response.data.session || null);
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
  }, [session, version]);

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

    setSaving(true);

    try {
      const response = await api.post(`/sessions/${session}/attendance/`, {
        records,
      });

      notify.success(`Saved ${response.data.saved} attendance records.`);

      setDirty(false);
      setRows((current) =>
        current.map((row) =>
          row.status
            ? { ...row, attendance_id: row.attendance_id || true }
            : row,
        ),
      );
    } catch (requestError) {
      notify.error(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  const pagination = usePagination(rows, session);
  const readOnly = sessionDetails?.status !== "scheduled";
  const sessionList = Array.isArray(sessions.data) ? sessions.data : [];

  return (
    <main className="attendance-page">
      <header className="attendance-heading">
        <div>
          <p className="attendance-eyebrow">Class operations</p>
          <h1>Attendance</h1>
          <p className="attendance-description">
            Select a class session and record each student’s attendance.
          </p>
        </div>
      </header>

      <section className="attendance-panel" aria-label="Select a class session">
        <div className="attendance-panel__heading">
          <div>
            <h2>Class session</h2>
            <p>Choose the session whose attendance you want to record.</p>
          </div>
        </div>

        <div className="attendance-toolbar">
          <label className="attendance-control">
            Class session
            <select
              value={session}
              onChange={(event) => {
                if (
                  dirty &&
                  !window.confirm("Discard unsaved attendance changes?")
                ) {
                  return;
                }

                setSession(event.target.value);
              }}
              disabled={saving}
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
        <section className="attendance-panel" aria-label="Session attendance">
          <div className="attendance-panel__heading">
            <div>
              <h2>Student attendance</h2>
              <p>
                Set each student’s status. Add a note if more context is needed.
              </p>
            </div>
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
                  {pagination.rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="attendance-student">
                          <strong>{row.name}</strong>
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
                          aria-label={`Attendance for ${row.name}`}
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
                          aria-label={`Attendance notes for ${row.name}`}
                          value={row.notes || ""}
                          disabled={saving || readOnly}
                          onChange={(event) =>
                            update(row.id, "notes", event.target.value)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rows.length > 0 && (
              <div className="attendance-pagination">
                <Pagination
                  {...pagination}
                  label="Attendance table pages"
                  disabled={saving}
                />
              </div>
            )}

            {!rows.length && (
              <p className="attendance-empty">
                No students are assigned to this session.
              </p>
            )}

            <div className="attendance-form__actions">
              <button
                className="attendance-save-button"
                type="submit"
                disabled={
                  saving || readOnly || !rows.length || loading || !dirty
                }
              >
                {saving ? "Saving..." : "Save attendance"}
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}
