import { useState } from "react";
import api from "../api/client";
import { errorMessage } from "../api/crm";
import useRecords from "../hooks/useRecords";
import usePagination from "../hooks/usePagination";
import Pagination from "./Pagination";
import RequestState from "./RequestState";

export default function Enrolments() {
  const records = useRecords("/registrations/");
  const students = useRecords("/students/");
  const courses = useRecords("/courses/");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [student, setStudent] = useState("");
  const [course, setCourse] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const filtered = records.data.filter(
    (row) =>
      `${row.student_name} ${row.course_name}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (status === "all" || row.is_active === (status === "active")),
  );
  const pagination = usePagination(filtered, JSON.stringify([query, status]));
  async function perform(operation, success) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await operation();
      records.refresh();
      setMessage(success);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function submit(event) {
    event.preventDefault();
    perform(async () => {
      await api.post("/registrations/", {
        student: Number(student),
        course: Number(course),
        is_active: true,
      });
      setStudent("");
      setCourse("");
    }, "Enrolment added.");
  }
  return (
    <section className="registrations-panel" aria-labelledby="enrolments-title">
      <h2 id="enrolments-title">Course enrolments</h2>
      <p>
        Pause an enrolment when a student stops attending. Resume the same
        enrolment when they return; their class, attendance and note history
        stays in place.
      </p>
      <RequestState
        loading={records.loading || students.loading || courses.loading}
        error={records.error || students.error || courses.error}
        onRetry={() => {
          records.refresh();
          students.refresh();
          courses.refresh();
        }}
      />
      <Notification
        error={error}
        message={message}
        onDismiss={() => {
          setError("");
          setMessage("");
        }}
      />
      <form className="crm-form" onSubmit={submit}>
        <label>
          Student
          <select
            required
            value={student}
            disabled={busy}
            onChange={(e) => setStudent(e.target.value)}
          >
            <option value="">Select a student</option>
            {students.data
              .filter((row) => row.is_active)
              .map((row) => (
                <option key={row.id} value={row.id}>
                  {row.first_name} {row.last_name} (ASP-{row.id})
                </option>
              ))}
          </select>
        </label>
        <label>
          Subject
          <select
            required
            value={course}
            disabled={busy}
            onChange={(e) => setCourse(e.target.value)}
          >
            <option value="">Select a subject</option>
            {courses.data
              .filter((row) => row.is_active)
              .map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
          </select>
        </label>
        <button
          className="registrations-primary-button"
          disabled={busy || records.loading}
          type="submit"
        >
          Add enrolment
        </button>
      </form>
      <div className="crm-form">
        <label>
          Search enrolments
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Enrolment status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All enrolments</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </label>
      </div>
      <div className="registrations-table-wrap">
        <table className="registrations-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pagination.rows.map((row) => (
              <tr key={row.id}>
                <td>{row.student_name}</td>
                <td>{row.course_name}</td>
                <td>{row.is_active ? "Active" : "Paused"}</td>
                <td>
                  <button
                    type="button"
                    className="registrations-secondary-button"
                    disabled={busy}
                    onClick={() => {
                      if (
                        !window.confirm(
                          `${row.is_active ? "Pause" : "Resume"} ${row.student_name}’s ${row.course_name} enrolment? Their history will be kept.`,
                        )
                      )
                        return;
                      perform(
                        () =>
                          api.patch(`/registrations/${row.id}/`, {
                            is_active: !row.is_active,
                          }),
                        row.is_active
                          ? "Enrolment paused. History retained."
                          : "Course enrolment resumed. History retained.",
                      );
                    }}
                  >
                    {row.is_active ? "Pause" : "Resume"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filtered.length && !records.loading && <p>No enrolments found.</p>}
      <Pagination
        {...pagination}
        label="Enrolment table pages"
        disabled={busy}
      />
    </section>
  );
}
