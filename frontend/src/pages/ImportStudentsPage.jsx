import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/client";
import { useAuth } from "../context/AuthContext";


export default function ImportStudentsPage() {
  const { logout } = useAuth();

  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [tableError, setTableError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loadingStudents, setLoadingStudents] =
    useState(true);

  const loadStudents = async () => {
    setTableError("");

    try {
      const response = await api.get("/students/");

      const studentData = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setStudents(studentData);
    } catch (requestError) {
      setTableError(
        requestError.response?.data?.detail ||
          "The student records could not be loaded."
      );
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const downloadTemplate = async () => {
    setError("");

    try {
      const response = await api.get(
        "/students/import/template/",
        {
          responseType: "blob",
        }
      );

      const downloadUrl = URL.createObjectURL(
        response.data
      );

      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = "student-import-template.xlsx";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(downloadUrl);
    } catch {
      setError(
        "The Excel template could not be downloaded."
      );
    }
  };

  const uploadStudents = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Please select an Excel file.");
      return;
    }

    setUploading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post(
        "/students/import/",
        formData
      );

      setResult(response.data);
      setFile(null);

      // Reload the table after importing.
      await loadStudents();
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "The Excel file could not be imported."
      );
    } finally {
      setUploading(false);
    }
  };

  const filteredStudents = students.filter(
    (student) => {
      const searchableText = [
        student.first_name,
        student.last_name,
        student.phone_number,
        student.email,
        student.school,
        student.guardian_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        search.toLowerCase()
      );
    }
  );

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <Link to="/dashboard">
            ← Back to dashboard
          </Link>

          <p className="eyebrow">
            Student registrations
          </p>

          <h1>Import students</h1>
        </div>

        <button
          className="secondary-button"
          onClick={logout}
        >
          Sign out
        </button>
      </header>

      <div className="import-layout">
        <section className="upload-card">
          <h2>1. Download the template</h2>

          <p>
            Use the template so your Excel headings
            match the database fields.
          </p>

          <button
            type="button"
            className="secondary-button"
            onClick={downloadTemplate}
          >
            Download Excel template
          </button>

          <div className="requirements-box">
            <strong>Required columns</strong>

            <ul>
              <li>Phone Number</li>
              <li>First Name</li>
              <li>Last Name</li>
            </ul>

            <p>
              A matching phone number updates the
              existing student.
            </p>
          </div>

          <form
            className="import-form"
            onSubmit={uploadStudents}
          >
            <h2>2. Upload the spreadsheet</h2>

            <input
              key={file ? file.name : "empty"}
              type="file"
              accept=".xlsx"
              onChange={(event) => {
                setFile(
                  event.target.files?.[0] || null
                );

                setResult(null);
                setError("");
              }}
            />

            <button
              type="submit"
              disabled={!file || uploading}
            >
              {uploading
                ? "Importing..."
                : "Import students"}
            </button>
          </form>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}
        </section>

        <section className="result-panel">
          <h2>Import results</h2>

          {!result && (
            <p>
              Import results will appear here.
            </p>
          )}

          {result && (
            <>
              <div className="result-grid">
                <div>
                  <strong>{result.created}</strong>
                  <span>Created</span>
                </div>

                <div>
                  <strong>{result.updated}</strong>
                  <span>Updated</span>
                </div>

                <div>
                  <strong>{result.failed}</strong>
                  <span>Failed</span>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div>
                  <h3>Rows requiring attention</h3>

                  <table>
                    <thead>
                      <tr>
                        <th>Excel row</th>
                        <th>Problem</th>
                      </tr>
                    </thead>

                    <tbody>
                      {result.errors.map(
                        (item, index) => (
                          <tr
                            key={`${item.row}-${index}`}
                          >
                            <td>{item.row}</td>
                            <td>{item.message}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <section className="students-table-section">
        <div className="students-table-header">
          <div>
            <p className="eyebrow">
              Imported registrations
            </p>

            <h2>
              Students ({filteredStudents.length})
            </h2>
          </div>

          <input
            className="student-search"
            type="search"
            placeholder="Search students..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        {tableError && (
          <p className="error-message">
            {tableError}
          </p>
        )}

        {loadingStudents ? (
          <p>Loading students...</p>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-table-message">
            No student registrations found.
          </div>
        ) : (
          <div className="students-table-wrapper">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone number</th>
                  <th>Email</th>
                  <th>Date of birth</th>
                  <th>School</th>
                  <th>Year level</th>
                  <th>Guardian</th>
                  <th>Guardian phone</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map(
                  (student) => (
                    <tr key={student.id}>
                      <td>
                        <strong>
                          {student.first_name}{" "}
                          {student.last_name}
                        </strong>
                      </td>

                      <td>
                        {student.phone_number}
                      </td>

                      <td>
                        {student.email || "—"}
                      </td>

                      <td>
                        {student.date_of_birth || "—"}
                      </td>

                      <td>
                        {student.school || "—"}
                      </td>

                      <td>
                        {student.year_level || "—"}
                      </td>

                      <td>
                        {student.guardian_name || "—"}
                      </td>

                      <td>
                        {student.guardian_phone || "—"}
                      </td>

                      <td>
                        <span
                          className={
                            student.is_active
                              ? "status-active"
                              : "status-inactive"
                          }
                        >
                          {student.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}