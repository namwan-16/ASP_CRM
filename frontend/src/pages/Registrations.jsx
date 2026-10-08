import { useState } from "react";
import api from "../api/client";
import { download, errorMessage } from "../api/crm";
import { useAuth } from "../context/AuthContext";
import useRecords from "../hooks/useRecords";
import RequestState from "../components/RequestState";


export default function Registrations() {
  const { user } = useAuth();
  const records = useRecords("/registrations/");
  const students = useRecords("/students/");
  const courses = useRecords("/courses/");
  const [student, setStudent] = useState("");
  const [course, setCourse] = useState("");
  const [courseName, setCourseName] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function perform(operation) {
    setError(""); setBusy(true);
    try { await operation(); }
    catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  }

  async function upload(dryRun) {
    if (!file) return;
    setBusy(true); setError(""); setErrors([]); setResult(null);
    const data = new FormData(); data.append("file", file); data.append("dry_run", String(dryRun));
    try {
      const response = await api.post("/students/import/", data);
      setResult(response.data);
      if (!dryRun) { students.refresh(); records.refresh(); }
    } catch (requestError) {
      const data = requestError.response?.data;
      setErrors(data?.errors || []);
      setError(typeof data?.detail === "string" ? data.detail : errorMessage(requestError));
    } finally { setBusy(false); }
  }

  return <main className="crm-page">
    <h1>Registrations &amp; Import</h1>
    <RequestState loading={records.loading || students.loading || courses.loading} error={records.error || students.error || courses.error} onRetry={() => { records.refresh(); students.refresh(); courses.refresh(); }} />
    {error && <p className="crm-message crm-message--error" role="alert">{error}</p>}
    {user?.can_manage && <>
      <h2>Excel / CSV Import</h2>
      <div className="crm-form">
        <label>File<input type="file" accept=".xlsx,.csv" disabled={busy} onChange={(event) => { setFile(event.target.files[0] || null); setResult(null); setErrors([]); setError(""); }} /></label>
        <button type="button" disabled={busy} onClick={() => perform(() => download("/students/import-template/", "student-import-template.xlsx"))}>Download template</button>
        <button type="button" disabled={busy || !file} onClick={() => upload(true)}>Preview</button>
        <button type="button" disabled={busy || !result?.dry_run} onClick={() => upload(false)}>{busy ? "Processing..." : "Import"}</button>
      </div>
      {result && <p className="crm-message crm-message--success" role="status">{result.dry_run ? "Preview: " : "Imported: "}{result.created} new students, {result.updated} updated students.{result.dry_run && " No records saved yet."}</p>}
      {errors.length > 0 && <div className="crm-table-wrap"><table className="crm-table"><thead><tr><th>Row</th><th>Error</th></tr></thead><tbody>{errors.map((row) => <tr key={row.row}><td>{row.row}</td><td>{errorMessage({ response: { data: row.errors } })}</td></tr>)}</tbody></table></div>}
      <h2>Courses</h2>
      <form className="crm-form" onSubmit={(event) => { event.preventDefault(); perform(async () => { await api.post("/courses/", { name: courseName }); setCourseName(""); courses.refresh(); }); }}>
        <label>Course name<input value={courseName} required maxLength={150} onChange={(event) => setCourseName(event.target.value)} /></label><button type="submit" disabled={busy}>Add course</button>
      </form>
      <div className="crm-inline-actions">{courses.data.map((item) => <button type="button" disabled={busy} key={item.id} onClick={() => perform(async () => { await api.patch(`/courses/${item.id}/`, { is_active: !item.is_active }); courses.refresh(); })}>{item.name}: {item.is_active ? "Active" : "Inactive"}</button>)}</div>
      <h2>Enrol Student</h2>
      <form className="crm-form" onSubmit={(event) => { event.preventDefault(); perform(async () => { await api.post("/registrations/", { student: Number(student), course: Number(course) }); records.refresh(); setStudent(""); setCourse(""); }); }}>
        <label>Student<select required value={student} onChange={(event) => setStudent(event.target.value)}><option value="">Select student</option>{students.data.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.first_name} {item.last_name} (ASP-{item.id})</option>)}</select></label>
        <label>Course<select required value={course} onChange={(event) => setCourse(event.target.value)}><option value="">Select course</option>{courses.data.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <button type="submit" disabled={busy}>Enrol student</button>
      </form>
    </>}
    <h2>Enrolments</h2>
    <div className="crm-table-wrap"><table className="crm-table"><thead><tr><th>Student</th><th>Course</th><th>Status</th>{user?.can_manage && <th>Action</th>}</tr></thead><tbody>
      {records.data.map((item) => <tr key={item.id}><td>{item.student_name}</td><td>{item.course_name}</td><td>{item.is_active ? "Active" : "Inactive"}</td>{user?.can_manage && <td><button type="button" disabled={busy} onClick={() => perform(async () => { await api.patch(`/registrations/${item.id}/`, { is_active: !item.is_active }); records.refresh(); })}>{item.is_active ? "Deactivate" : "Activate"}</button></td>}</tr>)}
    </tbody></table></div>
    {!records.loading && !records.data.length && <p className="crm-message">No enrolments found.</p>}
  </main>;
}
