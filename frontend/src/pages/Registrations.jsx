<<<<<<< HEAD
import { useRef, useState } from "react";
import "./Registrations.css";
=======
import { useState } from "react";
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
import api from "../api/client";
import { download, errorMessage } from "../api/crm";
import { useAuth } from "../context/AuthContext";
import useRecords from "../hooks/useRecords";
import RequestState from "../components/RequestState";
<<<<<<< HEAD
// import Enrolments from "../components/Enrolments";
import Pagination from "../components/Pagination";
import Notification from "../components/Notification";
import usePagination from "../hooks/usePagination";

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getRowErrorMessage(row) {
  return errorMessage({ response: { data: row.errors } });
}

export default function Registrations() {
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const students = useRecords("/students/");
=======


export default function Registrations() {
  const { user } = useAuth();
  const records = useRecords("/registrations/");
  const students = useRecords("/students/");
  const courses = useRecords("/courses/");
  const [student, setStudent] = useState("");
  const [course, setCourse] = useState("");
  const [courseName, setCourseName] = useState("");
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

<<<<<<< HEAD
  const errorPages = usePagination(errors, file?.name || "");

  async function perform(operation) {
    setError("");
    setBusy(true);

    try {
      await operation();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setResult(null);
    setErrors([]);
    setError("");
  }

  async function upload(dryRun) {
    if (!file) {
      setError("Choose a CSV or Excel file first.");
      return;
    }

    setBusy(true);
    setError("");
    setErrors([]);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("dry_run", String(dryRun));

    try {
      const response = await api.post("/students/import/", formData);
      setResult(response.data);

      if (!dryRun) {
        students.refresh();
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (requestError) {
      const responseData = requestError.response?.data;
      setErrors(responseData?.errors || []);
      setError(
        typeof responseData?.detail === "string"
          ? responseData.detail
          : errorMessage(requestError),
      );
    } finally {
      setBusy(false);
    }
  }

  function clearSelectedFile() {
    setFile(null);
    setResult(null);
    setErrors([]);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <main className="registrations-page">
      <header className="registrations-heading">
        <div>
          <h1>Student Registrations</h1>
          <p className="registrations-description">
            Upload and validate registration files before importing student
            records.
          </p>
        </div>
      </header>

      <RequestState
        loading={students.loading}
        error={students.error}
        onRetry={students.refresh}
      />

      {!user?.can_manage ? (
        <p
          className="registrations-message registrations-message--info"
          role="status"
        >
          Administrator access is required to import registration files.
        </p>
      ) : (
        <section
          className="registrations-panel registrations-upload-panel"
          aria-labelledby="registration-upload-title"
        >
          <div className="registrations-section-heading">
            <div>
              <h2 id="registration-upload-title">
                Import student registrations
              </h2>
              <p>Select a file to validate its contents before importing. </p>
            </div>

            <button
              className="registrations-secondary-button"
              type="button"
              disabled={busy}
              onClick={() =>
                perform(() =>
                  download(
                    "/students/import-template/",
                    "student-import-template.xlsx",
                  ),
                )
              }
            >
              Download template
            </button>
          </div>

          <div className="registrations-dropzone">
            <div className="registrations-file-icon" aria-hidden="true">
              CSV
            </div>

            <div className="registrations-dropzone__copy">
              <strong>{file ? file.name : "Choose a registration file"}</strong>
              <span>
                {file
                  ? `${formatFileSize(file.size)} · Ready to preview`
                  : "Excel (.xlsx) or CSV · Use the template for the required columns"}
              </span>
            </div>

            <label
              className="registrations-select-button"
              htmlFor="registration-import-file"
            >
              Select file
            </label>

            <input
              ref={fileInputRef}
              id="registration-import-file"
              className="registrations-file-input"
              type="file"
              accept=".xlsx,.csv"
              disabled={busy}
              onChange={handleFileChange}
              aria-label="Choose an Excel or CSV registration file"
            />
          </div>

          <Notification error={error} onDismiss={() => setError("")} />

          {result && (
            <div
              className={`registrations-message ${
                result.dry_run
                  ? "registrations-message--info"
                  : "registrations-message--success"
              }`}
              role="status"
            >
              <button type="button" aria-label="Dismiss import result" onClick={() => setResult(null)}>×</button>
              <strong>
                {result.dry_run ? "Preview complete" : "Import complete"}
              </strong>
              <span>
                {result.created ?? 0} new students · {result.updated ?? 0}{" "}
                updated students.
                {result.dry_run && " No records have been saved yet."}
              </span>
            </div>
          )}

          {errors.length > 0 && (
            <div className="registrations-errors">
              <h3>Validation errors</h3>
              <div className="registrations-table-wrap">
                <table className="registrations-table registrations-errors-table">
                  <thead>
                    <tr>
                      <th scope="col">Row</th>
                      <th scope="col">Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errorPages.rows.map((row, index) => (
                      <tr key={`${row.row ?? "error"}-${index}`}>
                        <td>{row.row ?? "—"}</td>
                        <td>{getRowErrorMessage(row)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination {...errorPages} label="Import error table pages" />
            </div>
          )}

          <div className="registrations-upload-actions">
            {file && (
              <button
                className="registrations-secondary-button"
                type="button"
                disabled={busy}
                onClick={clearSelectedFile}
              >
                Remove file
              </button>
            )}

            <button
              className="registrations-secondary-button"
              type="button"
              disabled={busy || !file}
              onClick={() => upload(true)}
            >
              {busy ? "Checking…" : "Preview file"}
            </button>

            <button
              className="registrations-primary-button"
              type="button"
              disabled={busy || !file || !result?.dry_run}
              onClick={() => upload(false)}
            >
              {busy ? "Processing…" : "Import students"}
            </button>
          </div>

          <p className="registrations-help-text">
            Import is enabled after a successful preview. Files with validation
            errors cannot be imported. Correct the errors and upload the file
            again.
          </p>
        </section>
      )}
      {/* {user?.can_manage && <Enrolments />} */}
    </main>
  );
=======
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
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
}
