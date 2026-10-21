import { useEffect, useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { toast } from "react-toastify";
import ConfirmDialog from "../components/ConfirmDialog";
import api from "../api/client";
import { errorMessage } from "../api/crm";
import useRecords from "../hooks/useRecords";
import RequestState from "../components/RequestState";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import "./Subjects.css";

function getSessionSubjectId(session) {
  const course = session.course ?? session.course_id ?? session.courseId;
  if (course && typeof course === "object") return course.id;
  return course;
}

export default function Subjects() {
  const records = useRecords("/courses/");
  const sessions = useRecords("/sessions/");
  const [name, setName] = useState("");
  const [editingSubject, setEditingSubject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingSubjectAction, setPendingSubjectAction] = useState(null);

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

  const pagination = usePagination(
    filteredSubjects,
    JSON.stringify([query.trim().toLowerCase(), statusFilter]),
  );

  function openAddModal() {
    setName("");
    setEditingSubject(null);
    setModalOpen(true);
  }

  function startEditing(subject) {
    setEditingSubject(subject);
    setName(subject.name ?? "");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setName("");
    setEditingSubject(null);
  }

  useEffect(() => {
    if (!modalOpen) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape" && !saving) {
        setModalOpen(false);
        setName("");
        setEditingSubject(null);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [modalOpen, saving]);

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanName = name.trim();

    if (!cleanName) {
      toast.warning("Enter a subject name.");
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
      toast.warning("A subject with this name already exists.");
      return;
    }

    setSaving(true);

    try {
      if (editingSubject) {
        await api.patch(`/courses/${editingSubject.id}/`, {
          name: cleanName,
        });
        toast.success("Subject updated successfully.");
      } else {
        await api.post("/courses/", {
          name: cleanName,
          is_active: true,
        });
        toast.success("Subject added successfully.");
      }

      setModalOpen(false);
      setName("");
      setEditingSubject(null);
      await records.refresh();
    } catch (requestError) {
      toast.error(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  function setSubjectActive(subject, isActive) {
    setPendingSubjectAction({ subject, isActive });
  }

  async function confirmSubjectAction() {
    if (!pendingSubjectAction) return;

    const { subject, isActive } = pendingSubjectAction;
    const action = isActive ? "reactivated" : "archived";
    setSaving(true);

    try {
      await api.patch(`/courses/${subject.id}/`, {
        is_active: isActive,
      });
      await records.refresh();
      toast.success(`Subject ${action} successfully.`);
      setPendingSubjectAction(null);
    } catch (requestError) {
      toast.error(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
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
          <h1>Manage subjects</h1>
          <p>Manage the subjects available when creating classes.</p>
        </div>

        <button
          className="subjects-primary-button"
          type="button"
          onClick={openAddModal}
        >
          <Plus size={17} aria-hidden="true" /> Add subject
        </button>
      </header>

      <RequestState
        loading={loading}
        error={loadError}
        onRetry={() => {
          records.refresh();
          sessions.refresh();
        }}
      />

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
                        <div className="subjects-actions">
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
                        </div>
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

        {filteredSubjects.length > 0 && (
          <Pagination
            {...pagination}
            label="Subject table pages"
            disabled={saving}
          />
        )}
      </section>

      {modalOpen && (
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

      <ConfirmDialog
        open={Boolean(pendingSubjectAction)}
        title={
          pendingSubjectAction?.isActive
            ? "Reactivate this subject?"
            : "Archive this subject?"
        }
        message={
          pendingSubjectAction?.isActive
            ? "This subject will be available when creating classes again."
            : "This subject will remain on existing class records but cannot be selected for new classes."
        }
        confirmLabel={
          pendingSubjectAction?.isActive
            ? "Reactivate subject"
            : "Archive subject"
        }
        cancelLabel="Keep subject"
        variant={pendingSubjectAction?.isActive ? "default" : "danger"}
        busy={saving}
        onConfirm={confirmSubjectAction}
        onCancel={() => {
          if (!saving) setPendingSubjectAction(null);
        }}
      />
    </main>
  );
}
