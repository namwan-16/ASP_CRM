import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/client";
import { errorMessage } from "../api/crm";
import useRecords from "../hooks/useRecords";
import RequestState from "../components/RequestState";
import Pagination from "../components/Pagination";
import Notification from "../components/Notification";
import usePagination from "../hooks/usePagination";

export default function Attendance() {
  const sessions = useRecords("/sessions/");
  const [params] = useSearchParams();
  const [session, setSession] = useState(params.get("session") || "");
  const [sessionDetails, setSessionDetails] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [version, setVersion] = useState(0);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setRows([]);
    setSessionDetails(null);
    setError("");
    setMessage("");
    setDirty(false);
    if (!session) {
      setLoading(false);
      return () => controller.abort();
    }
    setLoading(true);
    api
      .get(`/sessions/${session}/roster/`, { signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) {
          setRows(response.data.students);
          setSessionDetails(response.data.session);
        }
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [session, version]);

  function update(id, field, value) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
    setDirty(true);
    setMessage("");
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const records = rows
        .filter((row) => row.status)
        .map((row) => ({
          student: row.id,
          status: row.status,
          notes: row.notes,
        }));
      if (!records.length) {
        setError("Choose at least one attendance status.");
        return;
      }
      const response = await api.post(`/sessions/${session}/attendance/`, {
        records,
      });
      setMessage(`Saved ${response.data.saved} attendance records.`);
      setDirty(false);
      setRows((current) =>
        current.map((row) =>
          row.status
            ? { ...row, attendance_id: row.attendance_id || true }
            : row,
        ),
      );
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  const pagination = usePagination(rows, session);
  const readOnly = sessionDetails?.status !== "scheduled";
  return (
    <main className="crm-page">
      <h1>Attendance</h1>
      <div className="crm-form">
        <label>
          Class session
          <select
            value={session}
            onChange={(event) => {
              if (
                dirty &&
                !window.confirm("Discard unsaved attendance changes?")
              )
                return;
              setSession(event.target.value);
            }}
            disabled={saving}
          >
            <option value="">Select a class session</option>
            {sessions.data.map((item) => (
              <option key={item.id} value={item.id}>
                {item.course_name} - {item.date} {item.start_time.slice(0, 5)} (
                {item.room})
                {item.status !== "scheduled" ? ` — ${item.status}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      <RequestState
        loading={sessions.loading || loading}
        error={sessions.error || error}
        onRetry={() => {
          sessions.refresh();
          setVersion((value) => value + 1);
        }}
      />
      <Notification message={message} onDismiss={() => setMessage("")} />
      {sessionDetails && readOnly && (
        <p className="crm-message" role="status">
          This session is {sessionDetails.status}. Attendance history is
          read-only. An administrator can restore it to make corrections.
        </p>
      )}
      {session && !loading && (
        <form onSubmit={save}>
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Year</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {pagination.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {row.name}
                      <br />
                      <small>ASP-{row.id}</small>
                    </td>
                    <td>{row.year_level}</td>
                    <td>
                      <select
                        aria-label={`Attendance for ${row.name}`}
                        value={row.status}
                        disabled={saving || readOnly}
                        onChange={(event) =>
                          update(row.id, "status", event.target.value)
                        }
                      >
                        <option value="" disabled={Boolean(row.attendance_id)}>
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
                        aria-label={`Attendance notes for ${row.name}`}
                        value={row.notes}
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
          <Pagination {...pagination} label="Attendance table pages" disabled={saving} />
          {!rows.length && (
            <p className="crm-message">
              No students are assigned to this session.
            </p>
          )}
          <div className="crm-form">
            <button
              type="submit"
              disabled={saving || readOnly || !rows.length || loading}
            >
              {saving ? "Saving..." : "Save attendance"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
