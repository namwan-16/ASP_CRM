import { useRef, useState } from "react";
import "./Registrations.css";
import api from "../api/client";
import { download, errorMessage } from "../api/crm";
import { useAuth } from "../context/AuthContext";
import useRecords from "../hooks/useRecords";
import RequestState from "../components/RequestState";

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
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
          <h1>Student Registration Import</h1>
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

          {error && (
            <p
              className="registrations-message registrations-message--error"
              role="alert"
            >
              {error}
            </p>
          )}

          {result && (
            <div
              className={`registrations-message ${
                result.dry_run
                  ? "registrations-message--info"
                  : "registrations-message--success"
              }`}
              role="status"
            >
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
                    {errors.map((row, index) => (
                      <tr key={`${row.row ?? "error"}-${index}`}>
                        <td>{row.row ?? "—"}</td>
                        <td>{getRowErrorMessage(row)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
    </main>
  );
}
