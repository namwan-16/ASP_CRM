import React, { useMemo, useState } from "react";
import "./Classes.css";

// Prototype records only. Replace these with API data when backend endpoints are ready.
const demoStudents = [
  { id: "ASP-1001", name: "Ava Thompson", year: "Year 7" },
  { id: "ASP-1002", name: "Noah Williams", year: "Year 8" },
  { id: "ASP-1003", name: "Mia Chen", year: "Year 9" },
  { id: "ASP-1004", name: "Oliver Brown", year: "Year 10" },
  { id: "ASP-1005", name: "Isla Wilson", year: "Year 7" },
];

const demoPresenters = ["Jane Doe", "Michael Lee", "Sarah Brown"];
const demoAssistants = ["Alex Kim", "Priya Singh"];

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateAfter(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return localDateString(date);
}

function getStatus(date) {
  const today = localDateString(new Date());
  if (date < today) return "Completed";
  if (date === today) return "Today";
  return "Upcoming";
}

const initialClasses = [
  {
    id: "CLS-001",
    course: "Mathematics",
    date: dateAfter(1),
    startTime: "16:00",
    endTime: "17:00",
    room: "Room 1",
    capacity: 20,
    presenter: "Jane Doe",
    assistant: "Alex Kim",
    studentIds: ["ASP-1001", "ASP-1003"],
  },
  {
    id: "CLS-002",
    course: "Physics",
    date: dateAfter(1),
    startTime: "17:00",
    endTime: "18:00",
    room: "Room 2",
    capacity: 18,
    presenter: "Michael Lee",
    assistant: "Priya Singh",
    studentIds: ["ASP-1002", "ASP-1005"],
  },
  {
    id: "CLS-003",
    course: "Chemistry",
    date: dateAfter(2),
    startTime: "16:00",
    endTime: "17:30",
    room: "Science Lab",
    capacity: 16,
    presenter: "Sarah Brown",
    assistant: "",
    studentIds: ["ASP-1004"],
  },
  {
    id: "CLS-004",
    course: "Mathematics",
    date: dateAfter(4),
    startTime: "16:00",
    endTime: "17:00",
    room: "Room 1",
    capacity: 20,
    presenter: "Michael Lee",
    assistant: "",
    studentIds: ["ASP-1002", "ASP-1004"],
  },
];

function formatDate(value) {
  if (!value) return "—";

  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatTime(value) {
  if (!value) return "—";

  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "pm" : "am";

  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")}${suffix}`;
}

function ClassForm({ classItem, onClose, onSave }) {
  const [form, setForm] = useState(
    classItem
      ? {
          course: classItem.course,
          date: classItem.date,
          startTime: classItem.startTime,
          endTime: classItem.endTime,
          room: classItem.room,
          capacity: String(classItem.capacity),
          presenter: classItem.presenter,
          assistant: classItem.assistant,
          studentIds: classItem.studentIds,
        }
      : {
          course: "",
          date: dateAfter(1),
          startTime: "16:00",
          endTime: "17:00",
          room: "",
          capacity: "20",
          presenter: "",
          assistant: "",
          studentIds: [],
        },
  );

  const [error, setError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function toggleStudent(studentId) {
    setForm((current) => ({
      ...current,
      studentIds: current.studentIds.includes(studentId)
        ? current.studentIds.filter((id) => id !== studentId)
        : [...current.studentIds, studentId],
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (
      !form.course.trim() ||
      !form.date ||
      !form.presenter.trim() ||
      !form.room.trim()
    ) {
      setError("Complete the course, date, room and presenter fields.");
      return;
    }

    if (form.endTime <= form.startTime) {
      setError("The end time must be later than the start time.");
      return;
    }

    const capacity = Number(form.capacity);

    if (!Number.isInteger(capacity) || capacity < 1) {
      setError("Enter a capacity of at least one student.");
      return;
    }

    if (form.studentIds.length > capacity) {
      setError("The selected student count cannot exceed the class capacity.");
      return;
    }

    onSave({ ...form, capacity });
  }

  return (
    <div
      className="classes-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="classes-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="classes-dialog-title"
      >
        <div className="classes-dialog__heading">
          <div>
            <p className="classes-eyebrow">CLASS SCHEDULING</p>
            <h2 id="classes-dialog-title">
              {classItem ? "Edit class" : "Create a class"}
            </h2>
          </div>

          <button
            className="classes-icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <form className="classes-form" onSubmit={handleSubmit}>
          <label>
            Course or subject
            <input
              name="course"
              value={form.course}
              onChange={updateField}
              placeholder="e.g. Mathematics"
            />
          </label>

          <div className="classes-form__row">
            <label>
              Class date
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={updateField}
              />
            </label>

            <label>
              Room
              <input
                name="room"
                value={form.room}
                onChange={updateField}
                placeholder="e.g. Room 1"
              />
            </label>
          </div>

          <div className="classes-form__row">
            <label>
              Start time
              <input
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={updateField}
              />
            </label>

            <label>
              End time
              <input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={updateField}
              />
            </label>
          </div>

          <div className="classes-form__row">
            <label>
              Presenter
              <select
                name="presenter"
                value={form.presenter}
                onChange={updateField}
              >
                <option value="">Select a presenter</option>
                {demoPresenters.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>

            <label>
              <span>
                Assistant{" "}
                <small className="classes-form__optional">Optional</small>
              </span>
              <select
                name="assistant"
                value={form.assistant}
                onChange={updateField}
              >
                <option value="">No assistant</option>
                {demoAssistants.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Class capacity
            <input
              type="number"
              min="1"
              name="capacity"
              value={form.capacity}
              onChange={updateField}
            />
          </label>

          <fieldset className="classes-student-picker">
            <legend>Assign registered students</legend>
            <p>
              Select demo students for this class. Backend enrolments will
              replace these records later.
            </p>

            <div className="classes-student-picker__list">
              {demoStudents.map((student) => (
                <label className="classes-student-option" key={student.id}>
                  <input
                    type="checkbox"
                    checked={form.studentIds.includes(student.id)}
                    onChange={() => toggleStudent(student.id)}
                  />
                  <span>
                    {student.name}
                    <small>
                      {student.id} · {student.year}
                    </small>
                  </span>
                </label>
              ))}
            </div>

            <span className="classes-student-picker__count">
              {form.studentIds.length} selected · Capacity {form.capacity || 0}
            </span>
          </fieldset>

          {error && (
            <p className="classes-form__error" role="alert">
              {error}
            </p>
          )}

          <p className="classes-form__note">
            Demo data only. Course, staff and student records will connect to
            the backend later.
          </p>

          <div className="classes-form__actions">
            <button
              className="classes-secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="classes-primary-button" type="submit">
              {classItem ? "Save changes" : "Create class"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ClassDetails({ classItem, onClose, onEdit }) {
  const enrolledStudents = demoStudents.filter((student) =>
    classItem.studentIds.includes(student.id),
  );

  return (
    <div
      className="classes-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="classes-dialog classes-dialog--details"
        role="dialog"
        aria-modal="true"
        aria-labelledby="class-details-title"
      >
        <div className="classes-dialog__heading">
          <div>
            <p className="classes-eyebrow">CLASS DETAILS · {classItem.id}</p>
            <h2 id="class-details-title">{classItem.course}</h2>
          </div>

          <button
            className="classes-icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <dl className="classes-details">
          <div>
            <dt>Date and time</dt>
            <dd>
              {formatDate(classItem.date)} · {formatTime(classItem.startTime)}–
              {formatTime(classItem.endTime)}
            </dd>
          </div>
          <div>
            <dt>Room</dt>
            <dd>{classItem.room}</dd>
          </div>
          <div>
            <dt>Presenter</dt>
            <dd>{classItem.presenter}</dd>
          </div>
          <div>
            <dt>Assistant</dt>
            <dd>{classItem.assistant || "No assistant assigned"}</dd>
          </div>
          <div>
            <dt>Enrolment</dt>
            <dd>
              {classItem.studentIds.length} of {classItem.capacity} students
            </dd>
          </div>
        </dl>

        <section
          className="classes-roster"
          aria-labelledby="classes-roster-title"
        >
          <h3 id="classes-roster-title">Enrolled students</h3>

          {enrolledStudents.length ? (
            <ul>
              {enrolledStudents.map((student) => (
                <li key={student.id}>
                  <span>{student.name}</span>
                  <small>
                    {student.id} · {student.year}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p>No students have been assigned to this class yet.</p>
          )}
        </section>

        <div className="classes-form__actions">
          <button
            className="classes-secondary-button"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="classes-primary-button"
            type="button"
            onClick={onEdit}
          >
            Edit class
          </button>
        </div>
      </section>
    </div>
  );
}

export default function Classes() {
  const [classes, setClasses] = useState(initialClasses);
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("All courses");
  const [presenterFilter, setPresenterFilter] = useState("All presenters");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All classes");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [editingClass, setEditingClass] = useState(null);

  const courses = useMemo(
    () => [...new Set(classes.map((item) => item.course))].sort(),
    [classes],
  );

  const presenters = useMemo(
    () => [...new Set(classes.map((item) => item.presenter))].sort(),
    [classes],
  );

  const filteredClasses = useMemo(() => {
    const search = query.trim().toLowerCase();

    return classes
      .filter((item) => {
        const studentText = demoStudents
          .filter((student) => item.studentIds.includes(student.id))
          .map((student) => student.name)
          .join(" ");

        const matchesSearch =
          !search ||
          [
            item.course,
            item.room,
            item.presenter,
            item.assistant,
            studentText,
          ].some((value) => value.toLowerCase().includes(search));

        const matchesCourse =
          courseFilter === "All courses" || item.course === courseFilter;

        const matchesPresenter =
          presenterFilter === "All presenters" ||
          item.presenter === presenterFilter;

        const matchesDate = !dateFilter || item.date === dateFilter;
        const status = getStatus(item.date);
        const matchesStatus =
          statusFilter === "All classes" || statusFilter === status;

        return (
          matchesSearch &&
          matchesCourse &&
          matchesPresenter &&
          matchesDate &&
          matchesStatus
        );
      })
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.startTime.localeCompare(b.startTime),
      );
  }, [classes, query, courseFilter, presenterFilter, dateFilter, statusFilter]);

  function saveClass(form) {
    if (editingClass) {
      setClasses((current) =>
        current.map((item) =>
          item.id === editingClass.id ? { ...item, ...form } : item,
        ),
      );
    } else {
      setClasses((current) => [
        ...current,
        { ...form, id: `CLS-${String(Date.now()).slice(-5)}` },
      ]);
    }

    setDialogOpen(false);
    setEditingClass(null);
  }

  function openEdit(classItem) {
    setEditingClass(classItem);
    setSelectedClass(null);
    setDialogOpen(true);
  }

  function clearFilters() {
    setQuery("");
    setCourseFilter("All courses");
    setPresenterFilter("All presenters");
    setDateFilter("");
    setStatusFilter("All classes");
  }

  return (
    <main className="classes-page">
      <section
        className="classes-toolbar"
        aria-label="Class management actions and filters"
      >
        <label className="classes-search">
          <span className="visually-hidden">Search classes</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            type="search"
            placeholder="Search course, room, staff or student"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label className="classes-filter">
          <span>Course</span>
          <select
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
          >
            <option>All courses</option>
            {courses.map((course) => (
              <option key={course}>{course}</option>
            ))}
          </select>
        </label>

        <label className="classes-filter">
          <span>Presenter</span>
          <select
            value={presenterFilter}
            onChange={(event) => setPresenterFilter(event.target.value)}
          >
            <option>All presenters</option>
            {presenters.map((presenter) => (
              <option key={presenter}>{presenter}</option>
            ))}
          </select>
        </label>

        <label className="classes-filter classes-filter--date">
          <span className="visually-hidden">Filter by date</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            aria-label="Filter by date"
          />
        </label>

        <label className="classes-filter">
          <span className="visually-hidden">Filter by status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option>All classes</option>
            <option>Upcoming</option>
            <option>Today</option>
            <option>Completed</option>
          </select>
        </label>

        <button
          className="classes-primary-button classes-create-button"
          type="button"
          onClick={() => {
            setEditingClass(null);
            setDialogOpen(true);
          }}
        >
          <span aria-hidden="true">+</span> Create class
        </button>
      </section>

      <section className="classes-panel" aria-labelledby="classes-list-title">
        <div className="classes-panel__heading">
          <div>
            <h2 id="classes-list-title">Classes and sessions</h2>
            <p>Manage schedules, staff assignments and student enrolments.</p>
          </div>
          <span className="classes-demo-label">Demo data</span>
        </div>

        <div className="classes-results" aria-live="polite">
          <span>
            Showing {filteredClasses.length} of {classes.length} classes
          </span>

          {(query ||
            courseFilter !== "All courses" ||
            presenterFilter !== "All presenters" ||
            dateFilter ||
            statusFilter !== "All classes") && (
            <button
              type="button"
              className="classes-clear-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}

          <span className="classes-scroll-hint">
            Scroll horizontally to view all columns
          </span>
        </div>

        {filteredClasses.length ? (
          <div
            className="classes-table-wrap"
            role="region"
            aria-label="Class sessions table"
            tabIndex={0}
          >
            <table className="classes-table">
              <thead>
                <tr>
                  <th scope="col">Course / subject</th>
                  <th scope="col">Date and time</th>
                  <th scope="col">Room</th>
                  <th scope="col">Presenter</th>
                  <th scope="col">Assistant</th>
                  <th scope="col">Students</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((item) => {
                  const status = getStatus(item.date);

                  return (
                    <tr key={item.id}>
                      <td>
                        <span className="classes-course-name">
                          {item.course}
                        </span>
                        <span className="classes-id">{item.id}</span>
                      </td>
                      <td>
                        {formatDate(item.date)}
                        <span className="classes-cell-subtext">
                          {formatTime(item.startTime)}–
                          {formatTime(item.endTime)}
                        </span>
                      </td>
                      <td>{item.room}</td>
                      <td>{item.presenter}</td>
                      <td>
                        {item.assistant || (
                          <span className="classes-not-assigned">
                            Not assigned
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="classes-enrolment-count">
                          {item.studentIds.length}
                        </span>
                        <span className="classes-cell-subtext">
                          of {item.capacity} capacity
                        </span>
                      </td>
                      <td>
                        <span
                          className={`classes-status classes-status--${status.toLowerCase()}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="classes-row-actions">
                        <button
                          className="classes-view-button"
                          type="button"
                          onClick={() => setSelectedClass(item)}
                        >
                          View
                        </button>
                        <button
                          className="classes-edit-button"
                          type="button"
                          onClick={() => openEdit(item)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="classes-empty-state">
            <h3>No classes found</h3>
            <p>
              Try changing the search or filters, or create a class session.
            </p>
            <button
              className="classes-secondary-button"
              type="button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {dialogOpen && (
        <ClassForm
          classItem={editingClass}
          onClose={() => {
            setDialogOpen(false);
            setEditingClass(null);
          }}
          onSave={saveClass}
        />
      )}

      {selectedClass && (
        <ClassDetails
          classItem={selectedClass}
          onClose={() => setSelectedClass(null)}
          onEdit={() => openEdit(selectedClass)}
        />
      )}
    </main>
  );
}
