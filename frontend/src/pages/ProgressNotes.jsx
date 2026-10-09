import { useEffect, useMemo, useState } from "react";
import { Search, Plus, X } from "lucide-react";
import "./ProgressNotes.css";
import api from "../api/client";
import { errorMessage } from "../api/crm";
import useRecords from "../hooks/useRecords";
import { useAuth } from "../context/AuthContext";
import RequestState from "../components/RequestState";

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
      // Keep displaying the original value if it cannot be parsed.
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

  return name || user?.username || "";
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
  const records = useRecords("/progress-notes/");
  const students = useRecords("/students/");
  const noteRecords = Array.isArray(records.data) ? records.data : [];
  const studentRecords = Array.isArray(students.data) ? students.data : [];
  const { user } = useAuth();

  const [error, setError] = useState("");
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
    setError("");
    setEditing(null);
    setStudent("");
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

    setError("");
    setAdding(false);
    setEditing(note.id);
    setStudent(String(sourceNote.student));
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
    setForm(emptyForm(getDefaultPresenter(user)));
    setError("");
  }

  async function save(event) {
    event.preventDefault();

    if (!student) {
      setError("Select a student.");
      return;
    }

    if (!form.presenter.trim()) {
      setError("Enter the presenter’s name or initials.");
      return;
    }

    if (!form.answersChecked) {
      setError("Choose whether the answers were checked.");
      return;
    }

    if (
      form.answersChecked === "yes" &&
      (!form.achievement || !form.studentFeedback)
    ) {
      setError("Select the achievement and student feedback.");
      return;
    }

    if (form.comments.length > 256) {
      setError("Comments must be 256 characters or fewer.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const data = { text: makeApiText(form) };

      if (editing) {
        await api.patch(`/progress-notes/${editing}/`, data);
      } else {
        await api.post("/progress-notes/", {
          student: Number(student),
          ...data,
        });
      }

      records.refresh();
      setStudent("");
      setForm(emptyForm(getDefaultPresenter(user)));
      setAdding(false);
      setEditing(null);
    } catch (requestError) {
      setError(errorMessage(requestError));
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
        setForm(emptyForm(getDefaultPresenter(user)));
        setError("");
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [adding, editing, saving, user]);

  return (
    <main className="pn-page">
      <div className="pn-top">
        <div>
          <h1>Progress notes</h1>
          <p>Record and review student interactions.</p>
        </div>

        <button className="pn-btn" type="button" onClick={openAddModal}>
          <Plus size={16} aria-hidden="true" /> Add note
        </button>
      </div>

      <RequestState
        loading={records.loading || students.loading}
        error={records.error || students.error}
        onRetry={() => {
          records.refresh();
          students.refresh();
        }}
      />

      {error && !adding && !editing && (
        <p className="crm-message crm-message--error" role="alert">
          {error}
        </p>
      )}

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
        {visible.map((note) => (
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

            {(user?.can_manage || note.author === user?.id) && (
              <div className="crm-inline-actions">
                <button type="button" onClick={() => openEditModal(note)}>
                  Edit
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm("Delete this progress note?")) return;

                    try {
                      await api.delete(`/progress-notes/${note.id}/`);
                      records.refresh();
                    } catch (requestError) {
                      setError(errorMessage(requestError));
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </li>
        ))}

        {visible.length === 0 && (
          <li className="pn-empty">No progress notes found.</li>
        )}
      </ul>

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
                  onChange={(event) => setStudent(event.target.value)}
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

              {error && (
                <p className="crm-message crm-message--error" role="alert">
                  {error}
                </p>
              )}

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
