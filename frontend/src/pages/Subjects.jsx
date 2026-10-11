import { useEffect, useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import api from "../api/client";
import { errorMessage } from "../api/crm";
import useRecords from "../hooks/useRecords";
import RequestState from "../components/RequestState";
import Pagination from "../components/Pagination";
import Notification from "../components/Notification";
import usePagination from "../hooks/usePagination";
import "./Subjects.css";
import { useAuth } from "../context/AuthContext";
import Enrolments from "../components/Enrolments";

function getSessionSubjectId(session) {
  const course = session.course ?? session.course_id ?? session.courseId;
  if (course && typeof course === "object") return course.id;
  return course;
}

export default function Subjects() {
  const { user } = useAuth();
  const canManage = Boolean(user?.can_manage);
  const records = useRecords("/courses/");
  const sessions = useRecords("/sessions/");
  const [name, setName] = useState("");
  const [editingSubject, setEditingSubject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const subjects = useMemo(
    () =>
      (Array.isArray(records.data) ? [...records.data] : []).sort((a, b) =>
        String(a.name ?? "").localeCompare(String(b.name ?? "")),
      ),
    [records.data],
  );

  const sessionRecords = Array.isArray(sessions.data) ? sessions.data : [];

  const sessionCounts = useMemo(() => {
    const counts = new Map();

    for (const session of sessionRecords) {
      const subjectId = getSessionSubjectId(session);

      if (subjectId !== undefined && subjectId !== null) {
        const key = String(subjectId);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }

    return counts;
  }, [sessionRecords]);

  const activeCount = subjects.filter(
    (subject) => subject.is_active !== false,
  ).length;
  const archivedCount = subjects.length - activeCount;
  const normalizedQuery = query.trim().toLowerCase();

  const filteredSubjects = subjects.filter((subject) => {
    const active = subject.is_active !== false;
    const matchesName = String(subject.name ?? "")
      .toLowerCase()
      .includes(normalizedQuery);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && active) ||
      (statusFilter === "archived" && !active);

    return matchesName && matchesStatus;
  });

  const pagination = usePagination(filteredSubjects, JSON.stringify([query, statusFilter]));

  function openAddModal() {
    setName("");
    setEditingSubject(null);
    setActionError("");
    setActionMessage("");
    setModalOpen(true);
  }

  function startEditing(subject) {
    setEditingSubject(subject);
    setName(subject.name ?? "");
    setActionError("");
    setActionMessage("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setName("");
    setEditingSubject(null);
    setActionError("");
  }

  useEffect(() => {
    if (!modalOpen) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape" && !saving) {
        setModalOpen(false);
        setName("");
        setEditingSubject(null);
        setActionError("");
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [modalOpen, saving]);

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

      setModalOpen(false);
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
    setSaving(true);

    try {
      await api.patch(`/courses/${subject.id}/`, {
        is_active: isActive,
      });
      await records.refresh();
      setActionMessage(isActive ? "Subject reactivated." : "Subject archived. Existing class records retained.");
    } catch (requestError) {
      setActionError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function deleteSubject(subject) {
    if (!window.confirm(`Permanently delete the unused subject ${subject.name}? This cannot be undone. Archive used subjects instead.`)) return;
    setSaving(true); setActionError(""); setActionMessage("");
    try {
      await api.delete(`/courses/${subject.id}/`);
      records.refresh(); setActionMessage("Unused subject permanently deleted.");
    } catch (e) { setActionError(errorMessage(e)); } finally { setSaving(false); }
  }

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
  }

  const hasFilters = Boolean(query) || statusFilter !== "all";
  const loading = records.loading || sessions.loading;
  const loadError = records.error || sessions.error;

  return (
    <main className="subjects-page">
      <header className="subjects-page__heading">
        <div>
          <p className="subjects-page__eyebrow">Class setup</p>
          <h1>{canManage ? "Manage subjects" : "Class subjects"}</h1>
          <p>Manage the subjects available when creating classes.</p>
        </div>

        {canManage && <button
          className="subjects-primary-button"
          type="button"
          onClick={openAddModal}
        >
          <Plus size={17} aria-hidden="true" />
          Add subject
        </button>}
      </header>

      <RequestState
        loading={loading}
        error={loadError}
        onRetry={() => {
          records.refresh();
          sessions.refresh();
        }}
      />

      <Notification error={actionError} message={actionMessage} onDismiss={() => { setActionError(""); setActionMessage(""); }} />

      <section className="subjects-summary" aria-label="Subject totals">
        <article className="subjects-summary__card">
          <span>Active subjects</span>
          <strong>{records.loading ? "—" : activeCount}</strong>
        </article>

        <article className="subjects-summary__card">
          <span>Archived subjects</span>
          <strong>{records.loading ? "—" : archivedCount}</strong>
        </article>
      </section>

      <section className="subjects-panel" aria-labelledby="subjects-list-title">
        <div className="subjects-panel__heading">
          <div>
            <h2 id="subjects-list-title">Subjects</h2>
            <p>Search, review usage, and update subject availability.</p>
          </div>

          <span className="subjects-total-count">
            {records.loading
              ? "Loading subjects…"
              : `${filteredSubjects.length} of ${subjects.length} subjects`}
          </span>
        </div>

        <div className="subjects-toolbar" aria-label="Subject filters">
          <label className="subjects-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search subjects"
              aria-label="Search subjects"
            />
          </label>

          <label className="subjects-filter">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          {hasFilters && (
            <button
              type="button"
              className="subjects-text-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredSubjects.length ? (
          <div className="subjects-table-wrap">
            <table className="subjects-table">
              <thead>
                <tr>
                  <th scope="col">Subject</th>
                  <th scope="col">Class sessions</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>

              <tbody>
                {pagination.rows.map((subject) => {
                  const active = subject.is_active !== false;

                  const classCount =
                    sessionCounts.get(String(subject.id)) ??
                    sessionRecords.filter((session) => {
                      const sessionSubjectId = getSessionSubjectId(session);

                      if (
                        sessionSubjectId !== undefined &&
                        sessionSubjectId !== null
                      ) {
                        return String(sessionSubjectId) === String(subject.id);
                      }

                      const sessionCourse =
                        session.course ?? session.course_id ?? session.courseId;

                      const sessionSubjectName =
                        session.course_name ??
                        (typeof sessionCourse === "object"
                          ? (sessionCourse?.name ?? "")
                          : typeof sessionCourse === "string"
                            ? sessionCourse
                            : "");

                      return (
                        sessionSubjectName.toLowerCase() ===
                        String(subject.name ?? "").toLowerCase()
                      );
                    }).length;

                  return (
                    <tr key={subject.id}>
                      <td className="subjects-name-cell">{subject.name}</td>

                      <td>
                        {sessions.loading
                          ? "Loading…"
                          : sessions.error
                            ? "Unavailable"
                            : `${classCount} ${
                                classCount === 1 ? "session" : "sessions"
                              }`}
                      </td>

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

                      <td>
                        {canManage ? <div className="subjects-actions">
                          <button
                            type="button"
                            className="subjects-action-button"
                            disabled={saving}
                            onClick={() => startEditing(subject)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="subjects-action-button subjects-action-button--secondary"
                            disabled={saving}
                            onClick={() => setSubjectActive(subject, !active)}
                          >
                            {active ? "Archive" : "Reactivate"}
                          </button>
                          <button type="button" className="subjects-action-button subjects-action-button--secondary"
                            disabled={saving || subject.can_delete === false} onClick={() => deleteSubject(subject)}
                            title={subject.can_delete === false ? "This subject is used. Archive it instead." : "Delete an unused subject"}>Delete permanently</button>
                        </div> : <span>View only</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="subjects-empty-state">
            <h3>
              {subjects.length ? "No matching subjects" : "No subjects yet"}
            </h3>
            <p>
              {subjects.length
                ? "Try changing your search or status filter."
                : "Add a subject to make it available when creating a class."}
            </p>

            {hasFilters && (
              <button
                type="button"
                className="subjects-secondary-button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      <Pagination {...pagination} label="Subject table pages" disabled={saving} />
      </section>

      {modalOpen && canManage && (
        <div
          className="subjects-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="subjects-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="subjects-modal-title"
          >
            <div className="subjects-modal__heading">
              <div>
                <p className="subjects-page__eyebrow">Class setup</p>
                <h2 id="subjects-modal-title">
                  {editingSubject ? "Edit subject" : "Add a subject"}
                </h2>
                <p>
                  {editingSubject
                    ? "Update the subject name. Existing classes will continue to reference this subject."
                    : "Add a subject to make it available when creating classes."}
                </p>
              </div>

              <button
                className="subjects-modal__close"
                type="button"
                aria-label="Close subject form"
                disabled={saving}
                onClick={closeModal}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form className="subjects-form" onSubmit={handleSubmit}>
              <label htmlFor="subject-name">Subject name</label>
              <input
                id="subject-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Mathematics"
                maxLength={120}
                required
                autoFocus
              />

              <Notification error={actionError} onDismiss={() => setActionError("")} />

              <div className="subjects-modal__actions">
                <button
                  type="button"
                  className="subjects-secondary-button"
                  disabled={saving}
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="subjects-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving…"
                    : editingSubject
                      ? "Save changes"
                      : "Add subject"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
        {user?.can_manage && <Enrolments />}
    </main>
  );
}
