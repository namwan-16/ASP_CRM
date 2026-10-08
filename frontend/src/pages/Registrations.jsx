import { useMemo, useRef, useState } from "react";
import "./Registrations.css";

const initialUploads = [
  {
    id: 1,
    fileName: "ASP_Registration_Fortnight_01.csv",
    uploadedAt: "6 Oct 2026, 10:24 am",
    uploadedBy: "Demo administrator",
    rows: 24,
    status: "Reviewed",
  },
  {
    id: 2,
    fileName: "ASP_Registration_Fortnight_02.csv",
    uploadedAt: "22 Sep 2026, 2:15 pm",
    uploadedBy: "Demo administrator",
    rows: 18,
    status: "Needs review",
  },
];

function parseCsv(text) {
  const content = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let cell = "";
  let insideQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    const nextCharacter = content[index + 1];

    if (insideQuotes) {
      if (character === '"' && nextCharacter === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        insideQuotes = false;
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"' && cell.length === 0) {
      insideQuotes = true;
    } else if (character === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      row.push(cell.trim());

      if (row.some((value) => value !== "")) {
        rows.push(row);
      }

      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  row.push(cell.trim());

  if (row.some((value) => value !== "")) {
    rows.push(row);
  }

  return rows;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getCurrentUploadTime() {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Australia/Perth",
  }).format(new Date());
}

export default function Registrations() {
  const fileInputRef = useRef(null);

  const [uploads, setUploads] = useState(initialUploads);
  const [preview, setPreview] = useState(null);
  const [fileError, setFileError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredUploads = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return uploads.filter((upload) => {
      const matchesSearch =
        !query ||
        upload.fileName.toLowerCase().includes(query) ||
        upload.uploadedBy.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        upload.status.toLowerCase().replaceAll(" ", "_") === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [uploads, searchTerm, statusFilter]);

  const reviewedCount = uploads.filter(
    (upload) => upload.status === "Reviewed",
  ).length;

  const needsReviewCount = uploads.filter(
    (upload) => upload.status === "Needs review",
  ).length;

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    setPreview(null);
    setFileError("");

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFileError("Choose a CSV file to preview.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError("The file is too large. The maximum size is 10 MB.");
      event.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      const parsedRows = parseCsv(text);

      if (parsedRows.length === 0) {
        setFileError("This file appears to be empty.");
        event.target.value = "";
        return;
      }

      const headers = parsedRows[0].map((header) => header.trim());
      const dataRows = parsedRows.slice(1);
      const errors = [];

      if (headers.some((header) => !header)) {
        errors.push("Every column needs a header.");
      }

      const normalizedHeaders = headers.map((header) => header.toLowerCase());
      if (new Set(normalizedHeaders).size !== normalizedHeaders.length) {
        errors.push("Column headers must be unique.");
      }

      if (dataRows.length === 0) {
        errors.push("The file needs at least one data row.");
      }

      if (dataRows.some((dataRow) => dataRow.length !== headers.length)) {
        errors.push(
          "Some rows have a different number of columns than the header.",
        );
      }

      setPreview({
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        headers,
        rows: dataRows,
        errors,
      });
    } catch {
      setFileError("The file could not be read. Please try another CSV file.");
    }
  }

  function addDemoHistoryRecord() {
    if (!preview || preview.errors.length > 0) return;

    setUploads((currentUploads) => [
      {
        id: Date.now(),
        fileName: preview.fileName,
        uploadedAt: getCurrentUploadTime(),
        uploadedBy: "Demo administrator",
        rows: preview.rows.length,
        status: "Needs review",
      },
      ...currentUploads,
    ]);

    setPreview(null);
    setFileError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <main className="registrations-page">
      <header className="registrations-heading">
        <div>
          <h1>Registrations</h1>
          <p className="registrations-description">
            Review registration CSV files received from the ASP team.
          </p>
        </div>
      </header>

      <section
        className="registrations-summary"
        aria-label="Registration upload summary"
      >
        <article className="registrations-summary-card">
          <span>Total CSV uploads</span>
          <strong>{uploads.length}</strong>
          <small>Files in this demo</small>
        </article>

        <article className="registrations-summary-card registrations-summary-card--reviewed">
          <span>Reviewed</span>
          <strong>{reviewedCount}</strong>
          <small>Upload records marked reviewed</small>
        </article>

        <article className="registrations-summary-card registrations-summary-card--pending">
          <span>Needs review</span>
          <strong>{needsReviewCount}</strong>
          <small>Upload records awaiting review</small>
        </article>
      </section>

      <section className="registrations-upload-panel">
        <div className="registrations-section-heading">
          <div>
            <h2>Upload a registration CSV</h2>
            <p>
              Choose a CSV file to preview its columns and sample rows before
              backend integration.
            </p>
          </div>
        </div>

        <div className="registrations-dropzone">
          <div className="registrations-file-icon" aria-hidden="true">
            CSV
          </div>

          <div className="registrations-dropzone__copy">
            <strong>Select a CSV file from your computer</strong>
            <span>CSV format · Maximum file size 10 MB</span>
          </div>

          <button
            className="registrations-select-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose CSV
          </button>

          <input
            ref={fileInputRef}
            className="registrations-file-input"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            aria-label="Choose a registration CSV file"
          />
        </div>

        {fileError && (
          <p className="registrations-error" role="alert">
            {fileError}
          </p>
        )}

        {preview && (
          <div className="registrations-preview">
            <div className="registrations-preview__heading">
              <div>
                <h3>CSV preview</h3>
                <p>
                  {preview.fileName} · {preview.fileSize} ·{" "}
                  {preview.rows.length} data rows
                </p>
              </div>
              <span
                className={
                  preview.errors.length
                    ? "registrations-validation registrations-validation--error"
                    : "registrations-validation registrations-validation--valid"
                }
              >
                {preview.errors.length
                  ? "Check file"
                  : "File structure looks okay"}
              </span>
            </div>

            {preview.errors.length > 0 && (
              <ul className="registrations-error-list">
                {preview.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}

            <div className="registrations-table-wrap">
              <table className="registrations-preview-table">
                <thead>
                  <tr>
                    {preview.headers.map((header, index) => (
                      <th key={`${header}-${index}`} scope="col">
                        {header || `Column ${index + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 5).map((row, rowIndex) => (
                    <tr key={`preview-row-${rowIndex}`}>
                      {preview.headers.map((header, columnIndex) => (
                        <td key={`${header}-${columnIndex}`}>
                          {row[columnIndex] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {preview.rows.length > 5 && (
              <p className="registrations-preview__footnote">
                Showing the first 5 rows of {preview.rows.length}.
              </p>
            )}

            <div className="registrations-preview__actions">
              <button
                className="registrations-cancel-button"
                type="button"
                onClick={() => {
                  setPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Remove preview
              </button>

              <button
                className="registrations-confirm-button"
                type="button"
                disabled={preview.errors.length > 0}
                onClick={addDemoHistoryRecord}
              >
                Add to demo history
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="registrations-history-panel">
        <div className="registrations-section-heading">
          <div>
            <h2>Recent CSV uploads</h2>
            <p>Review files previously added to the demo history.</p>
          </div>
        </div>

        <div className="registrations-history-toolbar">
          <label className="registrations-search">
            <span className="visually-hidden">Search upload history</span>
            <input
              type="search"
              placeholder="Search by file name or uploader"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <label className="registrations-status-filter">
            <span className="visually-hidden">Filter uploads by status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="reviewed">Reviewed</option>
              <option value="needs_review">Needs review</option>
            </select>
          </label>
        </div>

        <div className="registrations-table-wrap">
          <table className="registrations-history-table">
            <thead>
              <tr>
                <th scope="col">File name</th>
                <th scope="col">Uploaded</th>
                <th scope="col">Uploaded by</th>
                <th scope="col">Data rows</th>
                <th scope="col">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredUploads.map((upload) => (
                <tr key={upload.id}>
                  <td className="registrations-file-name">{upload.fileName}</td>
                  <td>{upload.uploadedAt}</td>
                  <td>{upload.uploadedBy}</td>
                  <td>{upload.rows}</td>
                  <td>
                    <span
                      className={`registrations-status ${
                        upload.status === "Reviewed"
                          ? "registrations-status--reviewed"
                          : "registrations-status--pending"
                      }`}
                    >
                      {upload.status}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredUploads.length === 0 && (
                <tr>
                  <td className="registrations-empty" colSpan="5">
                    No upload records match your search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="registrations-demo-note">
        Demo only: selected files are previewed in your browser and are not
        uploaded to or saved by the backend.
      </p>
    </main>
  );
}
