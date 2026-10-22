import { useEffect, useMemo, useRef, useState } from "react";
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
import ConfirmDialog from "../components/ConfirmDialog";

const NOTE_PREFIX = "ASP_PROGRESS_NOTE_V1:";
const ACHIEVEMENT_OPTIONS = ["Under", "Fair", "Over"];
const FEEDBACK_OPTIONS = ["Hard", "Fair", "Easy"];
const EMPTY_FORM = {
  presenter: "",
  answersChecked: "",
  achievement: "",
  studentFeedback: "",
  comments: "",
};

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getDefaultPresenter(user) {
  const name = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || user?.email || "";
}

function getSessionId(value) {
  if (value && typeof value === "object") {
    return value.id == null ? "" : String(value.id);
  }

  return value == null ? "" : String(value);
}

function getSessionStudents(session) {
  if (!Array.isArray(session?.students)) return [];

  return session.students.map((student) =>
    student && typeof student === "object"
      ? Number(student.id)
      : Number(student),
  );
}

function sessionIncludesStudent(session, studentId) {
  return getSessionStudents(session).includes(Number(studentId));
}

function isCancelledSession(session) {
  const status = String(session?.status || "").toLowerCase();
  return status === "cancelled" || status === "canceled";
}

function parseProgressNote(value, legacyPresenter = "") {
  if (typeof value === "string" && value.startsWith(NOTE_PREFIX)) {
    try {
      const parsed = JSON.parse(value.slice(NOTE_PREFIX.length));

      if (parsed?.version === 1) {
        const answersChecked = ["yes", "no", "not_recorded"].includes(
          parsed.answersChecked,
        )
          ? parsed.answersChecked
          : "not_recorded";

        return {
          structured: true,
          presenter: parsed.presenter || legacyPresenter,
          answersChecked,
          achievement: parsed.achievement || "",
          studentFeedback: parsed.studentFeedback || "",
          comments: parsed.comments || "",
        };
      }
    } catch {
      // Fall back to displaying the original note text.
    }
  }

  return {
    structured: false,
    presenter: legacyPresenter,
    answersChecked: "not_recorded",
    achievement: "",
    studentFeedback: "",
    comments: value || "",
  };
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

function getStudentName(student) {
  return `${student?.first_name || ""} ${student?.last_name || ""}`.trim();
}

function getSessionLabel(session) {
  if (!session) return "";

  const subject = session.course_name || session.subject_name || "Class";
  const date = session.date ? formatDate(session.date) : "";
  const time = session.start_time ? session.start_time.slice(0, 5) : "";

  return [subject, date, time].filter(Boolean).join(" · ");
}

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
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [student, setStudent] = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    presenter: getDefaultPresenter(user),
  }));

  const dialogRef = useRef(null);
  const addButtonRef = useRef(null);
  const modalSnapshot = useRef(null);
  const wasModalOpen = useRef(false);

  const sessionsById = useMemo(
    () => new Map(sessionRecords.map((item) => [String(item.id), item])),
    [sessionRecords],
  );

  const notes = useMemo(
    () =>
      noteRecords.map((note) => {
        const details = parseProgressNote(note.text, note.author_name || "");
        const linkedSessionId = getSessionId(note.session);
        const linkedSession = sessionsById.get(linkedSessionId);

        return {
          ...note,
          student: note.student_name || "Unknown student",
          studentId: String(note.student),
          details,
          linkedSession,
          linkedSessionId,
          sessionLabel: getSessionLabel(linkedSession),
        };
      }),
    [noteRecords, sessionsById],
  );

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return notes
      .filter((note) => {
        const linkedSession = note.linkedSession;
        const searchable = [
          note.student,
          note.studentId,
          note.details.presenter,
          note.details.achievement,
          note.details.studentFeedback,
          note.details.comments,
          note.sessionLabel,
          linkedSession?.course_name,
          linkedSession?.date,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesQuery =
          !normalizedQuery || searchable.includes(normalizedQuery);
        const matchesStudent =
          !studentFilter || note.studentId === studentFilter;
        const matchesSession =
          !sessionFilter || note.linkedSessionId === sessionFilter;
        const matchesFrom = !dateFrom || note.date >= dateFrom;
        const matchesTo = !dateTo || note.date <= dateTo;

        return (
          matchesQuery &&
          matchesStudent &&
          matchesSession &&
          matchesFrom &&
          matchesTo
        );
      })
      .sort(
        (a, b) => b.date.localeCompare(a.date) || Number(b.id) - Number(a.id),
      );
  }, [notes, query, studentFilter, sessionFilter, dateFrom, dateTo]);

  const pagination = usePagination(
    visible,
    JSON.stringify([
      query,
      studentFilter,
      sessionFilter,
      dateFrom,
      dateTo,
      showDeleted,
    ]),
  );

  const selectedStudent = studentRecords.find(
    (item) => String(item.id) === student,
  );

  const selectedStudentName =
    getStudentName(selectedStudent) ||
    (student ? `Student ${student}` : "Student");

  const modalOpen = adding || Boolean(editing);
  const hasModalChanges =
    modalOpen &&
    modalSnapshot.current !== null &&
    modalSnapshot.current !== JSON.stringify({ student, sessionId, form });

  const availableSessions = useMemo(() => {
    if (!student) return [];

    return sessionRecords
      .filter(
        (item) =>
          !isCancelledSession(item) && sessionIncludesStudent(item, student),
      )
      .sort(
        (a, b) =>
          String(b.date || "").localeCompare(String(a.date || "")) ||
          String(b.start_time || "").localeCompare(String(a.start_time || "")),
      );
  }, [sessionRecords, student]);

  useEffect(() => {
    if (modalOpen) {
      wasModalOpen.current = true;
      dialogRef.current?.focus();
      return;
    }

    if (wasModalOpen.current) {
      wasModalOpen.current = false;
      addButtonRef.current?.focus();
    }
  }, [modalOpen]);

  function resetModal() {
    setAdding(false);
    setEditing(null);
    setStudent("");
    setSessionId("");
    setForm({
      ...EMPTY_FORM,
      presenter: getDefaultPresenter(user),
    });
    modalSnapshot.current = null;
  }

  function closeModal() {
    if (saving) return;

    if (hasModalChanges) {
      setPendingConfirmation({ type: "discard" });
      return;
    }

    resetModal();
  }

  function openAddModal() {
    addButtonRef.current = document.activeElement;
    setEditing(null);
    setStudent("");
    setSessionId("");

    const newForm = {
      ...EMPTY_FORM,
      presenter: getDefaultPresenter(user),
    };

    setForm(newForm);
    setAdding(true);
    modalSnapshot.current = JSON.stringify({
      student: "",
      sessionId: "",
      form: newForm,
    });
  }

  function openEditModal(note) {
    const sourceNote = noteRecords.find((item) => item.id === note.id);
    if (!sourceNote) return;

    addButtonRef.current = document.activeElement;

    const details = parseProgressNote(
      sourceNote.text,
      sourceNote.author_name || "",
    );
    const nextStudent = String(sourceNote.student);
    const nextSessionId = getSessionId(sourceNote.session);
    const nextForm = {
      presenter: details.presenter || getDefaultPresenter(user),
      answersChecked: details.answersChecked,
      achievement: details.achievement,
      studentFeedback: details.studentFeedback,
      comments: details.comments,
    };

    setAdding(false);
    setEditing(note.id);
    setStudent(nextStudent);
    setSessionId(nextSessionId);
    setForm(nextForm);
    modalSnapshot.current = JSON.stringify({
      student: nextStudent,
      sessionId: nextSessionId,
      form: nextForm,
    });
  }

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

  function handleModalKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = dialogRef.current?.querySelectorAll(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    );

    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
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

    if (!["yes", "no", "not_recorded"].includes(form.answersChecked)) {
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
        editing ? "Progress note updated." : "Progress note added.",
      );
      resetModal();
    } catch (requestError) {
      notify.error(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  function requestToggleDeletedNote(note) {
    setPendingConfirmation({
      type: "note",
      note,
      restoring: Boolean(note.is_deleted),
    });
  }

  async function confirmPendingAction() {
    if (!pendingConfirmation) return;

    if (pendingConfirmation.type === "discard") {
      setPendingConfirmation(null);
      resetModal();
      return;
    }

    const { note, restoring } = pendingConfirmation;
    setSaving(true);

    try {
      if (restoring) {
        await api.post(`/progress-notes/${note.id}/restore/`);
      } else {
        await api.delete(`/progress-notes/${note.id}/`);
      }

      records.refresh();
      notify.success(
        restoring ? "Progress note restored." : "Progress note deleted.",
      );
      setPendingConfirmation(null);
    } catch (requestError) {
      notify.error(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  const confirmationDetails =
    pendingConfirmation?.type === "discard"
      ? {
          title: "Discard unsaved changes?",
          message: "Your progress note changes will be lost.",
          confirmLabel: "Discard changes",
          variant: "danger",
        }
      : pendingConfirmation?.restoring
        ? {
            title: "Restore this progress note?",
            message:
              "The note will return to the student’s progress note history.",
            confirmLabel: "Restore note",
            variant: "default",
          }
        : pendingConfirmation
          ? {
              title: "Delete this progress note?",
              message:
                "The note will be removed from the current list. Its content and audit history will be retained, and it can be restored later.",
              confirmLabel: "Delete note",
              variant: "danger",
            }
          : null;

  function clearFilters() {
    setQuery("");
    setStudentFilter("");
    setSessionFilter("");
    setDateFrom("");
    setDateTo("");
  }

  const filtersActive = Boolean(
    query || studentFilter || sessionFilter || dateFrom || dateTo,
  );

  return (
    <main className="pn-page">
      <header className="pn-top">
        <div>
          <h1>Progress notes</h1>
          <p>Record and review student interactions.</p>
        </div>

        <button
          ref={addButtonRef}
          className="pn-btn"
          type="button"
          onClick={openAddModal}
        >
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

      <section className="pn-filters" aria-label="Filter progress notes">
        <label className="pn-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by student, ID, presenter or session"
            aria-label="Search progress notes"
          />
        </label>

        <label className="pn-filter">
          <span>Student</span>
          <select
            value={studentFilter}
            onChange={(event) => setStudentFilter(event.target.value)}
          >
            <option value="">All students</option>
            {studentRecords.map((item) => (
              <option key={item.id} value={item.id}>
                {getStudentName(item) || `Student ${item.id}`}
              </option>
            ))}
          </select>
        </label>

        <label className="pn-filter">
          <span>Class session</span>
          <select
            value={sessionFilter}
            onChange={(event) => setSessionFilter(event.target.value)}
          >
            <option value="">All sessions</option>
            {sessionRecords
              .filter((item) => !isCancelledSession(item))
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {getSessionLabel(item) || `Session ${item.id}`}
                </option>
              ))}
          </select>
        </label>

        <label className="pn-filter">
          <span>From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </label>

        <label className="pn-filter">
          <span>To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </label>

        {filtersActive && (
          <button
            className="pn-clear-filters"
            type="button"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
      </section>

      <ul className="pn-list">
        {pagination.rows.map((note) => {
          const canEdit =
            !note.is_deleted && (user?.can_manage || note.author === user?.id);
          const canDeleteOrRestore =
            user?.can_manage || note.author === user?.id;

          return (
            <li key={note.id}>
              <div className="pn-row">
                <strong>{note.student}</strong>
                <span>{formatDate(note.date)}</span>
              </div>

              <p className="pn-student-id">Student ID: ASP-{note.studentId}</p>

              <p className="pn-note-session">
                {note.sessionLabel
                  ? `Class session: ${note.sessionLabel}`
                  : "General student note"}
              </p>

              <dl className="pn-note-details">
                <div>
                  <dt>Presenter</dt>
                  <dd>{note.details.presenter || "—"}</dd>
                </div>

                <div>
                  <dt>Answers checked</dt>
                  <dd>
                    {note.details.answersChecked === "yes"
                      ? "Yes"
                      : note.details.answersChecked === "no"
                        ? "No"
                        : "Not recorded"}
                  </dd>
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

              {canDeleteOrRestore && (
                <div className="crm-inline-actions">
                  {canEdit && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => openEditModal(note)}
                    >
                      Edit
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => requestToggleDeletedNote(note)}
                  >
                    {note.is_deleted ? "Restore" : "Delete"}
                  </button>
                </div>
              )}
            </li>
          );
        })}

        {visible.length === 0 && (
          <li className="pn-empty">
            {filtersActive
              ? "No progress notes match these filters."
              : "No progress notes found."}
          </li>
        )}
      </ul>

      {visible.length > 0 && (
        <Pagination
          {...pagination}
          label="Progress note pages"
          disabled={saving}
        />
      )}

      {modalOpen && (
        <div
          className="pn-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            ref={dialogRef}
            className="pn-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pn-modal-title"
            aria-describedby="pn-modal-description"
            tabIndex={-1}
            onKeyDown={handleModalKeyDown}
          >
            <div className="pn-modal__heading">
              <div>
                <p className="pn-eyebrow">
                  {editing ? "STUDENT RECORD" : "NEW STUDENT NOTE"}
                </p>

                <h2 id="pn-modal-title">
                  {editing ? "Edit progress note" : "Add progress note"}
                </h2>

                <p id="pn-modal-description">
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
                        {getStudentName(item)} (ASP-{item.id})
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
                Class session <span className="pn-optional">Optional</span>
                <select
                  value={sessionId}
                  disabled={Boolean(editing)}
                  onChange={(event) => setSessionId(event.target.value)}
                >
                  <option value="">General student note</option>

                  {availableSessions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {getSessionLabel(item)} ({item.status})
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
                  {form.answersChecked === "not_recorded" && (
                    <option value="not_recorded">
                      Not recorded for this older note
                    </option>
                  )}
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

      <ConfirmDialog
        open={Boolean(pendingConfirmation)}
        title={confirmationDetails?.title || "Confirm action"}
        message={confirmationDetails?.message || "Confirm this action."}
        confirmLabel={confirmationDetails?.confirmLabel || "Confirm"}
        cancelLabel={
          pendingConfirmation?.type === "discard" ? "Keep editing" : "Cancel"
        }
        variant={confirmationDetails?.variant || "default"}
        busy={saving}
        onConfirm={confirmPendingAction}
        onCancel={() => {
          if (!saving) setPendingConfirmation(null);
        }}
      />
    </main>
  );
}
