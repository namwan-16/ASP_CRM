import { useMemo, useState } from "react";
import api from "../api/client";
import { errorMessage } from "../api/crm";
import useRecords from "../hooks/useRecords";
import RequestState from "../components/RequestState";
import "./Subjects.css";

export default function Subjects() {
  const records = useRecords("/courses/");
  const [name, setName] = useState("");
  const [editingSubject, setEditingSubject] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const subjects = useMemo(
    () =>
      (Array.isArray(records.data) ? [...records.data] : []).sort((a, b) =>
        String(a.name ?? "").localeCompare(String(b.name ?? "")),
      ),
    [records.data],
  );

  function resetForm() {
    setName("");
    setEditingSubject(null);
    setActionError("");
    setActionMessage("");
  }

  function startEditing(subject) {
    setEditingSubject(subject);
    setName(subject.name ?? "");
    setActionError("");
    setActionMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanName = name.trim();
    setActionError("");
    setActionMessage("");

    if (!cleanName) {
      setActionError("Enter a subject name.");
      return;
    }

    const duplicate = subjects.some(
      (subject) =>
        subject.id !== editingSubject?.id &&
        String(subject.name ?? "")
          .trim()
          .toLowerCase() === cleanName.toLowerCase(),
    );

    if (duplicate) {
      setActionError("A subject with this name already exists.");
      return;
    }

    setSaving(true);
    try {
      if (editingSubject) {
        await api.patch(`/courses/${editingSubject.id}/`, {
          name: cleanName,
        });
        setActionMessage("Subject updated.");
      } else {
        await api.post("/courses/", {
          name: cleanName,
          is_active: true,
        });
        setActionMessage("Subject added.");
      }

      setName("");
      setEditingSubject(null);
      await records.refresh();
    } catch (requestError) {
      setActionError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function setSubjectActive(subject, isActive) {
    const action = isActive ? "reactivate" : "archive";
    const confirmed = window.confirm(
      `${isActive ? "Reactivate" : "Archive"} ${subject.name}? ${
        isActive
          ? "It will be available when creating classes again."
          : "It will stay on existing class records but cannot be selected for new classes."
      }`,
    );

    if (!confirmed) return;

    setActionError("");
    setActionMessage("");

    try {
      await api.patch(`/courses/${subject.id}/`, {
        is_active: isActive,
      });
      await records.refresh();
      setActionMessage(`Subject ${action}d.`);
    } catch (requestError) {
      setActionError(errorMessage(requestError));
    }
  }

  return (
    <main className="subjects-page">
      <header className="subjects-page__heading">
        <div>
          <p className="subjects-page__eyebrow">Class setup</p>
          <h1>Manage subjects</h1>
          <p>Manage the subjects available when creating classes.</p>
        </div>
      </header>

      <RequestState
        loading={records.loading}
        error={records.error}
        onRetry={records.refresh}
      />

      {(actionError || actionMessage) && (
        <p
          className={`subjects-message ${
            actionError
              ? "subjects-message--error"
              : "subjects-message--success"
          }`}
          role={actionError ? "alert" : "status"}
        >
          {actionError || actionMessage}
        </p>
      )}

      <section className="subjects-panel" aria-labelledby="subject-form-title">
        <form className="subjects-form" onSubmit={handleSubmit}>
          <h2 id="subject-form-title">
            {editingSubject ? "Edit subject" : "Add a subject"}
          </h2>

          <label htmlFor="subject-name">Subject name</label>

          <div className="subjects-form__controls">
            <input
              id="subject-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Mathematics"
              maxLength={120}
              required
            />

            <button type="submit" disabled={saving}>
              {saving
                ? "Saving…"
                : editingSubject
                  ? "Save changes"
                  : "Add subject"}
            </button>

            {editingSubject && (
              <button
                type="button"
                className="subjects-button--secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="subjects-panel" aria-labelledby="subjects-list-title">
        <div className="subjects-list-heading">
          <h2 id="subjects-list-title">Subjects</h2>
          <span>{subjects.length} total</span>
        </div>

        {subjects.length ? (
          <div className="subjects-table-wrap">
            <table className="subjects-table">
              <thead>
                <tr>
                  <th scope="col">Subject</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>

              <tbody>
                {subjects.map((subject) => {
                  const active = subject.is_active !== false;

                  return (
                    <tr key={subject.id}>
                      <td>{subject.name}</td>
                      <td>
                        <span
                          className={`subjects-status ${
                            active
                              ? "subjects-status--active"
                              : "subjects-status--archived"
                          }`}
                        >
                          {active ? "Active" : "Archived"}
                        </span>
                      </td>
                      <td className="subjects-actions">
                        <button
                          type="button"
                          onClick={() => startEditing(subject)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="subjects-button--secondary"
                          onClick={() => setSubjectActive(subject, !active)}
                        >
                          {active ? "Archive" : "Reactivate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          !records.loading &&
          !records.error && (
            <div className="subjects-empty-state">
              <h3>No subjects yet</h3>
              <p>
                Add a subject above. It will appear in the subject dropdown when
                creating a class.
              </p>
            </div>
          )
        )}
      </section>
    </main>
  );
}
