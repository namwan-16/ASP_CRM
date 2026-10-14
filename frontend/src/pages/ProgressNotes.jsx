import { useEffect, useMemo, useState } from "react";
import { Search, Plus, X } from "lucide-react";
import "./ProgressNotes.css";
import api from "../api/client";
import { errorMessage } from "../api/crm";
import useRecords from "../hooks/useRecords";
import { useAuth } from "../context/AuthContext";
import RequestState from "../components/RequestState";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { notify } from "../utils/notifications";

const NOTE_PREFIX = "ASP_PROGRESS_NOTE_V1:";
const ACHIEVEMENT_OPTIONS = ["Under", "Fair", "Over"];
const FEEDBACK_OPTIONS = ["Hard", "Fair", "Easy"];

const fmt = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function parseProgressNote(value, legacyPresenter = "") {
  if (typeof value === "string" && value.startsWith(NOTE_PREFIX)) {
    try {
      const parsed = JSON.parse(value.slice(NOTE_PREFIX.length));

      if (parsed?.version === 1) {
        return {
          structured: true,
          presenter: parsed.presenter || legacyPresenter,
          answersChecked: parsed.answersChecked === "yes" ? "yes" : "no",
          achievement: parsed.achievement || "",
          studentFeedback: parsed.studentFeedback || "",
          comments: parsed.comments || "",
        };
      }
    } catch {
      // Show the original value if it cannot be parsed.
    }
  }

  return {
    structured: false,
    presenter: legacyPresenter,
    answersChecked: "no",
    achievement: "",
    studentFeedback: "",
    comments: value || "",
  };
}

function getDefaultPresenter(user) {
  const name = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || user?.email || "";
}

function makeApiText(form) {
  return `${NOTE_PREFIX}${JSON.stringify({
    version: 1,
    presenter: form.presenter.trim(),
    answersChecked: form.answersChecked,
    achievement: form.answersChecked === "yes" ? form.achievement : "",
    studentFeedback: form.answersChecked === "yes" ? form.studentFeedback : "",
    comments: form.comments.trim(),
  })}`;
}

const emptyForm = (presenter = "") => ({
  presenter,
  answersChecked: "",
  achievement: "",
  studentFeedback: "",
  comments: "",
});

export default function ProgressNotes() {
  const [showDeleted, setShowDeleted] = useState(false);
  const records = useRecords(`/progress-notes/?is_deleted=${showDeleted}`);
  const students = useRecords("/students/");
  const sessions = useRecords("/sessions/");
  const { user } = useAuth();

  const noteRecords = Array.isArray(records.data) ? records.data : [];
  const studentRecords = Array.isArray(students.data) ? students.data : [];
  const sessionRecords = Array.isArray(sessions.data) ? sessions.data : [];

  const [sessionId, setSessionId] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [student, setStudent] = useState("");
  const [form, setForm] = useState(() => emptyForm(getDefaultPresenter(user)));

  const notes = useMemo(
    () =>
      noteRecords.map((note) => ({
        ...note,
        student: note.student_name,
        details: parseProgressNote(note.text, note.author_name || ""),
      })),
    [noteRecords],
  );

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return notes
      .filter((note) => {
        const searchable = [
          note.student,
          note.details.presenter,
          note.details.achievement,
          note.details.studentFeedback,
          note.details.comments,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return !normalizedQuery || searchable.includes(normalizedQuery);
      })
      .sort(
        (a, b) => b.date.localeCompare(a.date) || Number(b.id) - Number(a.id),
      );
  }, [notes, query]);

  const pagination = usePagination(
    visible,
    JSON.stringify([query, showDeleted]),
  );

  const editingNote = noteRecords.find((item) => item.id === editing);

  const selectedStudent = studentRecords.find(
    (item) => String(item.id) === student,
  );

  const selectedStudentName = selectedStudent
    ? `${selectedStudent.first_name} ${selectedStudent.last_name}`.trim()
    : editingNote?.student_name || (student ? `Student ${student}` : "Student");

  function updateForm(name, value) {
    setForm((current) => {
      const next = { ...current, [name]: value };

      if (name === "answersChecked" && value !== "yes") {
        next.achievement = "";
        next.studentFeedback = "";
      }

      return next;
    });
  }

  function openAddModal() {
    setEditing(null);
    setStudent("");
    setSessionId("");
    setForm(emptyForm(getDefaultPresenter(user)));
    setAdding(true);
  }

  function openEditModal(note) {
    const sourceNote = noteRecords.find((item) => item.id === note.id);
    if (!sourceNote) return;

    const details = parseProgressNote(
      sourceNote.text,
      sourceNote.author_name || "",
    );

    setAdding(false);
    setEditing(note.id);
    setStudent(String(sourceNote.student));
    setSessionId(sourceNote.session ? String(sourceNote.session) : "");
    setForm({
      presenter: details.presenter || getDefaultPresenter(user),
      answersChecked: details.structured ? details.answersChecked : "no",
      achievement: details.achievement,
      studentFeedback: details.studentFeedback,
      comments: details.comments,
    });
  }

  function closeModal() {
    if (saving) return;

    setAdding(false);
    setEditing(null);
    setStudent("");
    setSessionId("");
    setForm(emptyForm(getDefaultPresenter(user)));
  }

  async function save(event) {
    event.preventDefault();

    if (!student) {
      notify.warning("Select a student.");
      return;
    }

    if (!form.presenter.trim()) {
      notify.warning("Enter the presenter’s name or initials.");
      return;
    }

    if (!form.answersChecked) {
      notify.warning("Choose whether the answers were checked.");
      return;
    }

    if (
      form.answersChecked === "yes" &&
      (!form.achievement || !form.studentFeedback)
    ) {
      notify.warning("Select the achievement and student feedback.");
      return;
    }

    if (form.comments.length > 256) {
      notify.warning("Comments must be 256 characters or fewer.");
      return;
    }

    setSaving(true);

    try {
      const data = { text: makeApiText(form) };

      if (editing) {
        await api.patch(`/progress-notes/${editing}/`, data);
      } else {
        await api.post("/progress-notes/", {
          student: Number(student),
          session: sessionId ? Number(sessionId) : null,
          ...data,
        });
      }

      records.refresh();

      notify.success(
        editing
          ? "Progress note updated. Previous version retained in the audit history."
          : "Progress note added.",
      );

      setStudent("");
      setSessionId("");
      setForm(emptyForm(getDefaultPresenter(user)));
      setAdding(false);
      setEditing(null);
    } catch (requestError) {
      notify.error(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function toggleDeletedNote(note) {
    const restoring = Boolean(note.is_deleted);

    const confirmed = window.confirm(
      restoring
        ? "Restore this progress note to the student’s history?"
        : "Delete this progress note from the current list? Its content and audit history will be retained and can be restored.",
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      if (restoring) {
        await api.post(`/progress-notes/${note.id}/restore/`);
      } else {
        await api.delete(`/progress-notes/${note.id}/`);
      }

      records.refresh();

      notify.success(
        restoring
          ? "Progress note restored."
          : "Progress note deleted from the list. It remains recoverable.",
      );
    } catch (requestError) {
      notify.error(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!adding && !editing) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape" && !saving) {
        setAdding(false);
        setEditing(null);
        setStudent("");
        setSessionId("");
        setForm(emptyForm(getDefaultPresenter(user)));
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [adding, editing, saving, user]);

  return (
    <main className="pn-page">
      <header className="pn-top">
        <div>
          <h1>Progress notes</h1>
          <p>Record and review student interactions.</p>
        </div>

        <button className="pn-btn" type="button" onClick={openAddModal}>
          <Plus size={16} aria-hidden="true" />
          Add note
        </button>
      </header>

      <RequestState
        loading={records.loading || students.loading || sessions.loading}
        error={records.error || students.error || sessions.error}
        onRetry={() => {
          records.refresh();
          students.refresh();
          sessions.refresh();
        }}
      />

      <label className="pn-deleted-toggle">
        <input
          type="checkbox"
          checked={showDeleted}
          onChange={(event) => setShowDeleted(event.target.checked)}
        />
        <span>Show recoverable deleted notes</span>
      </label>

      <label className="pn-search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by student, presenter or note details"
          aria-label="Search progress notes"
        />
      </label>

      <ul className="pn-list">
        {pagination.rows.map((note) => (
          <li key={note.id}>
            <div className="pn-row">
              <strong>{note.student}</strong>
              <span>{fmt(note.date)}</span>
            </div>

            <dl className="pn-note-details">
              <div>
                <dt>Presenter</dt>
                <dd>{note.details.presenter || note.author_name || "—"}</dd>
              </div>

              <div>
                <dt>Answers checked</dt>
                <dd>{note.details.answersChecked === "yes" ? "Yes" : "No"}</dd>
              </div>

              {note.details.answersChecked === "yes" && (
                <>
                  <div>
                    <dt>Achievement</dt>
                    <dd>{note.details.achievement || "—"}</dd>
                  </div>

                  <div>
                    <dt>Student feedback</dt>
                    <dd>{note.details.studentFeedback || "—"}</dd>
                  </div>
                </>
              )}
            </dl>

            {note.details.comments && (
              <p className="pn-note-comments">{note.details.comments}</p>
            )}

            <small className="pn-note-author">
              Recorded by {note.author_name || "Former staff member"}
            </small>

            <div className="crm-inline-actions">
              {!note.is_deleted &&
                (user?.can_manage ||
                  user?.role === "presenter" ||
                  note.author === user?.id) && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => openEditModal(note)}
                  >
                    Edit
                  </button>
                )}

              {(user?.can_manage || note.author === user?.id) && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => toggleDeletedNote(note)}
                >
                  {note.is_deleted ? "Restore" : "Delete"}
                </button>
              )}
            </div>
          </li>
        ))}

        {visible.length === 0 && (
          <li className="pn-empty">No progress notes found.</li>
        )}
      </ul>

      <div className="pn-pagination">
        <Pagination
          {...pagination}
          label="Progress note pages"
          disabled={saving}
        />
      </div>

      {(adding || editing) && (
        <div
          className="pn-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="pn-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pn-modal-title"
          >
            <div className="pn-modal__heading">
              <div>
                <p className="pn-eyebrow">
                  {editing ? "STUDENT RECORD" : "NEW STUDENT NOTE"}
                </p>

                <h2 id="pn-modal-title">
                  {editing ? "Edit progress note" : "Add progress note"}
                </h2>

                <p>
                  {editing
                    ? "Update the note details below."
                    : "Record the student interaction details below."}
                </p>
              </div>

              <button
                className="pn-modal__close"
                type="button"
                aria-label="Close progress note dialog"
                disabled={saving}
                onClick={closeModal}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form className="pn-form pn-modal__form" onSubmit={save}>
              <label className="pn-field">
                Student
                <select
                  required
                  value={student}
                  disabled={Boolean(editing)}
                  onChange={(event) => {
                    setStudent(event.target.value);
                    setSessionId("");
                  }}
                >
                  <option value="">Select a student</option>

                  {adding &&
                    studentRecords.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.first_name} {item.last_name} (ASP-{item.id})
                      </option>
                    ))}

                  {editing && (
                    <option value={student}>
                      {selectedStudentName} (ASP-{student})
                    </option>
                  )}
                </select>
              </label>

              <label className="pn-field">
                Class session (optional)
                <select
                  value={sessionId}
                  disabled={Boolean(editing)}
                  onChange={(event) => setSessionId(event.target.value)}
                >
                  <option value="">General student note</option>

                  {sessionRecords
                    .filter((item) =>
                      editing
                        ? String(item.id) === sessionId
                        : item.status === "scheduled" &&
                          Array.isArray(item.students) &&
                          item.students.includes(Number(student)),
                    )
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.course_name} — {item.date}{" "}
                        {item.start_time?.slice(0, 5)} ({item.status})
                      </option>
                    ))}
                </select>
              </label>

              <label className="pn-field">
                Presenter name or initials
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={form.presenter}
                  onChange={(event) =>
                    updateForm("presenter", event.target.value)
                  }
                  placeholder="e.g. A. Smith or AS"
                />
              </label>

              <label className="pn-field">
                Were the answers checked?
                <select
                  required
                  value={form.answersChecked}
                  onChange={(event) =>
                    updateForm("answersChecked", event.target.value)
                  }
                >
                  <option value="">Select Yes or No</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>

              {form.answersChecked === "yes" && (
                <div className="pn-form__row">
                  <label className="pn-field">
                    Achievement
                    <select
                      required
                      value={form.achievement}
                      onChange={(event) =>
                        updateForm("achievement", event.target.value)
                      }
                    >
                      <option value="">Select achievement</option>
                      {ACHIEVEMENT_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="pn-field">
                    Student feedback
                    <select
                      required
                      value={form.studentFeedback}
                      onChange={(event) =>
                        updateForm("studentFeedback", event.target.value)
                      }
                    >
                      <option value="">Select feedback</option>
                      {FEEDBACK_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              <label className="pn-field">
                Presenter comments <span className="pn-optional">Optional</span>
                <textarea
                  rows={4}
                  maxLength={256}
                  value={form.comments}
                  onChange={(event) =>
                    updateForm("comments", event.target.value)
                  }
                  placeholder="Add brief comments about the interaction..."
                />
                <span className="pn-character-count" aria-live="polite">
                  {form.comments.length}/256 characters
                </span>
              </label>

              <div className="pn-modal__actions">
                <button
                  className="pn-btn pn-btn--secondary"
                  type="button"
                  disabled={saving}
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button className="pn-btn" type="submit" disabled={saving}>
                  {saving ? "Saving…" : editing ? "Save changes" : "Save note"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
