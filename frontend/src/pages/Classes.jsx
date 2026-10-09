import React, { useEffect, useMemo, useState } from "react";



import "./Classes.css";



import api from "../api/client";



import { errorMessage, sessionRecord } from "../api/crm";



import useRecords from "../hooks/useRecords";



import { useAuth } from "../context/AuthContext";



import RequestState from "../components/RequestState";

const CLASSES_PER_PAGE = 5;



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



function parseLocalDate(value) {

  if (!value) return new Date();

  const parts = value.split("-").map(Number);

  return new Date(parts[0], parts[1] - 1, parts[2], 12);

}



function shiftDate(date, days) {

  const next = new Date(date);

  next.setDate(next.getDate() + days);

  return next;

}



function startOfWeek(date) {

  const start = new Date(date);

  const mondayOffset = (start.getDay() + 6) % 7;

  start.setDate(start.getDate() - mondayOffset);

  start.setHours(12, 0, 0, 0);

  return start;

}



function getMonthCalendarDates(date) {

  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1, 12);

  const firstCell = startOfWeek(firstOfMonth);

  return Array.from({ length: 42 }, (_, index) => shiftDate(firstCell, index));

}



function formatCalendarHeading(date, view) {

  if (view === "month") {

    return new Intl.DateTimeFormat("en-AU", {

      month: "long",

      year: "numeric",

    }).format(date);

  }



  const start = startOfWeek(date);

  const end = shiftDate(start, 6);

  const startLabel = new Intl.DateTimeFormat("en-AU", {

    day: "numeric",

    month: "short",

  }).format(start);

  const endLabel = new Intl.DateTimeFormat("en-AU", {

    day: "numeric",

    month: "short",

    year: "numeric",

  }).format(end);

  return startLabel + " – " + endLabel;

}



function CalendarView({

  sessions,

  anchorDate,

  view,

  onViewChange,

  onNavigate,

  onToday,

  onSelectSession,

  onCreateForDate,

  canManage,

}) {

  const dates =

    view === "week"

      ? Array.from({ length: 7 }, (_, index) =>

          shiftDate(startOfWeek(anchorDate), index),

        )

      : getMonthCalendarDates(anchorDate);

  const today = localDateString(new Date());

  const weekDays = [

    "Monday",

    "Tuesday",

    "Wednesday",

    "Thursday",

    "Friday",

    "Saturday",

    "Sunday",

  ];



  function sessionsOn(date) {

    const dateKey = localDateString(date);

    return sessions.filter((session) => session.date === dateKey);

  }



  return (

    <div className="classes-calendar" aria-label="Class calendar">

      <div className="classes-calendar__toolbar">

        <div className="classes-calendar__navigation">

          <button

            type="button"

            className="classes-calendar__nav-button"

            onClick={() => onNavigate(-1)}

            aria-label={"Previous " + view}

          >

            ‹

          </button>

          <button

            type="button"

            className="classes-calendar__today-button"

            onClick={onToday}

          >

            Today

          </button>

          <button

            type="button"

            className="classes-calendar__nav-button"

            onClick={() => onNavigate(1)}

            aria-label={"Next " + view}

          >

            ›

          </button>

          <h3 className="classes-calendar__title">

            {formatCalendarHeading(anchorDate, view)}

          </h3>

        </div>

        <div

          className="classes-calendar__view-toggle"

          role="group"

          aria-label="Calendar view"

        >

          <button

            type="button"

            aria-pressed={view === "week"}

            className={view === "week" ? "is-active" : ""}

            onClick={() => onViewChange("week")}

          >

            Week

          </button>

          <button

            type="button"

            aria-pressed={view === "month"}

            className={view === "month" ? "is-active" : ""}

            onClick={() => onViewChange("month")}

          >

            Month

          </button>

        </div>

      </div>



      {view === "week" ? (

        <div className="classes-calendar__week" aria-label="Weekly schedule">

          {dates.map((date, index) => {

            const dateKey = localDateString(date);

            const daySessions = sessionsOn(date);

            return (

              <section

                className={

                  "classes-calendar__day" +

                  (dateKey === today ? " is-today" : "")

                }

                key={dateKey}

              >

                <header className="classes-calendar__day-heading">

                  <span>{weekDays[index]}</span>

                  <strong>{date.getDate()}</strong>

                </header>

                <div className="classes-calendar__day-sessions">

                  {daySessions.length ? (

                    daySessions.map((session) => (

                      <button

                        className="classes-calendar__event"

                        type="button"

                        key={session.id}

                        onClick={() => onSelectSession(session)}

                      >

                        <strong>{session.course}</strong>

                        <span>

                          {formatTime(session.startTime)}–

                          {formatTime(session.endTime)}

                        </span>

                        <small>

                          {session.room} · {session.presenter}

                        </small>

                      </button>

                    ))

                  ) : (

                    <p className="classes-calendar__empty-day">No sessions</p>

                  )}

                </div>

                {canManage && (

                  <button

                    type="button"

                    className="classes-calendar__add"

                    onClick={() => onCreateForDate(dateKey)}

                  >

                    + Add class

                  </button>

                )}

              </section>

            );

          })}

        </div>

      ) : (

        <div className="classes-calendar__month-wrap">

          <div className="classes-calendar__month-weekdays" aria-hidden="true">

            {weekDays.map((day) => (

              <span key={day}>{day.slice(0, 3)}</span>

            ))}

          </div>

          <div

            className="classes-calendar__month"

            aria-label="Monthly schedule"

          >

            {dates.map((date) => {

              const dateKey = localDateString(date);

              const daySessions = sessionsOn(date);

              const isCurrentMonth = date.getMonth() === anchorDate.getMonth();

              return (

                <section

                  className={

                    "classes-calendar__month-day" +

                    (isCurrentMonth ? "" : " is-outside-month") +

                    (dateKey === today ? " is-today" : "")

                  }

                  key={dateKey}

                >

                  <div className="classes-calendar__month-date">

                    <span>{date.getDate()}</span>

                    {canManage && (

                      <button

                        type="button"

                        aria-label={"Add class on " + formatDate(dateKey)}

                        onClick={() => onCreateForDate(dateKey)}

                      >

                        +

                      </button>

                    )}

                  </div>

                  <div className="classes-calendar__month-events">

                    {daySessions.map((session) => (

                      <button

                        className="classes-calendar__month-event"

                        type="button"

                        key={session.id}

                        onClick={() => onSelectSession(session)}

                        title={

                          session.course +

                          ", " +

                          formatTime(session.startTime) +

                          "–" +

                          formatTime(session.endTime) +

                          ", " +

                          session.room

                        }

                      >

                        <strong>{formatTime(session.startTime)}</strong>{" "}

                        {session.course}

                      </button>

                    ))}

                  </div>

                </section>

              );

            })}

          </div>

        </div>

      )}

    </div>

  );

}



function findScheduleConflict(form, sessions, editingSessionId) {

  const selectedPresenter = Number(form.presenter);



  const selectedStudents = new Set(form.studentIds.map(Number));



  const room = form.room.trim().toLowerCase();



  return sessions.find((session) => {

    if (String(session.id) === String(editingSessionId)) return false;



    if (session.date !== form.date) return false;



    const overlaps =

      form.startTime < session.endTime && form.endTime > session.startTime;



    if (!overlaps) return false;



    const samePresenter = Number(session.presenterId) === selectedPresenter;



    const sameRoom = room && session.room.trim().toLowerCase() === room;



    const sameStudent = session.studentIds.some((id) =>

      selectedStudents.has(Number(id)),

    );



    return samePresenter || sameRoom || sameStudent;

  });

}



function ClassForm({

  classItem,

  initialDate = "",

  onClose,

  onSave,

  courses,

  staff,

  students,

  sessions,

}) {

  const [form, setForm] = useState(

    classItem

      ? {

          course: String(classItem.courseId),



          date: classItem.date,



          startTime: classItem.startTime,



          endTime: classItem.endTime,



          room: classItem.room,



          capacity: String(classItem.capacity),



          presenter: String(classItem.presenterId),



          studentIds: classItem.studentIds,

        }

      : {

          course: "",



          date: initialDate || dateAfter(1),



          startTime: "16:00",



          endTime: "17:00",



          room: "",



          capacity: "20",



          presenter: "",



          studentIds: [],

        },

  );



  const [error, setError] = useState("");



  const [saving, setSaving] = useState(false);



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



  async function handleSubmit(event) {

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



    const conflict = findScheduleConflict(form, sessions, classItem?.id);



    if (conflict) {

      const reasons = [];



      if (Number(conflict.presenterId) === Number(form.presenter)) {

        reasons.push("the presenter is already assigned");

      }



      if (

        conflict.room.trim().toLowerCase() === form.room.trim().toLowerCase()

      ) {

        reasons.push("the room is already booked");

      }



      if (

        conflict.studentIds.some((id) => form.studentIds.includes(Number(id)))

      ) {

        reasons.push("one or more selected students are already scheduled");

      }



      setError(

        `This session overlaps with ${conflict.course} (${formatTime(conflict.startTime)}–${formatTime(conflict.endTime)}): ${reasons.join(", ")}. Change the schedule, presenter, room or roster before saving.`,

      );



      return;

    }



    setError("");



    setSaving(true);



    try {

      await onSave({ ...form, capacity });

    } catch (requestError) {

      setError(errorMessage(requestError));

    } finally {

      setSaving(false);

    }

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

            Subject

            <select

              name="course"

              value={form.course}

              onChange={updateField}

              required

            >

              <option value="">Select a subject</option>



              {courses



                .filter((course) => course.is_active)



                .map((course) => (

                  <option key={course.id} value={course.id}>

                    {course.name}

                  </option>

                ))}

            </select>

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

                aria-label="Presenter"

                value={form.presenter}

                onChange={updateField}

              >

                <option value="">Select a presenter</option>



                {staff



                  .filter(

                    (person) =>

                      person.is_active &&

                      ["presenter", "admin"].includes(person.role),

                  )



                  .map((person) => (

                    <option key={person.id} value={person.id}>

                      {`${person.first_name} ${person.last_name}`.trim() ||

                        person.username}

                    </option>

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

              {students.map((student) => (

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



          <div className="classes-form__actions">

            <button

              className="classes-secondary-button"

              type="button"

              onClick={onClose}

            >

              Cancel

            </button>



            <button

              className="classes-primary-button"

              type="submit"

              disabled={saving}

            >

              {saving

                ? "Saving..."

                : classItem

                  ? "Save changes"

                  : "Create class"}

            </button>

          </div>

        </form>

      </section>

    </div>

  );

}



function ClassDetails({ classItem, onClose, onEdit, onDelete, students }) {

  const enrolledStudents = students.filter((student) =>

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



          {onEdit && (

            <button

              className="classes-primary-button"

              type="button"

              onClick={onEdit}

            >

              Edit class

            </button>

          )}



          {onDelete && (

            <button

              className="classes-secondary-button"

              type="button"

              onClick={onDelete}

            >

              Delete class

            </button>

          )}

        </div>

      </section>

    </div>

  );

}



export default function Classes() {

  const records = useRecords("/sessions/");



  const courseRecords = useRecords("/courses/");



  const staffRecords = useRecords("/auth/users/");



  const studentRecords = useRecords("/students/");



  const classes = useMemo(

    () => (Array.isArray(records.data) ? records.data : []).map(sessionRecord),



    [records.data],

  );



  const students = useMemo(

    () =>

      (Array.isArray(studentRecords.data) ? studentRecords.data : []).map(

        (student) => ({

          id: student.id,



          name: `${student.first_name} ${student.last_name}`,



          year: student.year_level,

        }),

      ),



    [studentRecords.data],

  );



  const { user } = useAuth();



  const canManage = user?.can_manage;



  const [actionError, setActionError] = useState("");



  const [query, setQuery] = useState("");



  const [courseFilter, setCourseFilter] = useState("All subjects");



  const [presenterFilter, setPresenterFilter] = useState("All presenters");



  const [dateFilter, setDateFilter] = useState("");



  const [statusFilter, setStatusFilter] = useState("All classes");

  const [currentPage, setCurrentPage] = useState(1);



  const [dialogOpen, setDialogOpen] = useState(false);



  const [selectedClass, setSelectedClass] = useState(null);



  const [editingClass, setEditingClass] = useState(null);



  const [initialClassDate, setInitialClassDate] = useState("");

  const [displayMode, setDisplayMode] = useState("table");

  const [calendarView, setCalendarView] = useState("week");

  const [calendarDate, setCalendarDate] = useState(() =>

    parseLocalDate(localDateString(new Date())),

  );



  const courseOptions = Array.isArray(courseRecords.data)

    ? courseRecords.data

    : [];



  const courses = useMemo(

    () =>

      [

        ...new Set([

          ...courseOptions.map((course) => course.name).filter(Boolean),



          ...classes.map((item) => item.course).filter(Boolean),

        ]),

      ].sort(),



    [courseOptions, classes],

  );



  const presenters = useMemo(

    () => [...new Set(classes.map((item) => item.presenter))].sort(),



    [classes],

  );



  const filteredClasses = useMemo(() => {

    const search = query.trim().toLowerCase();



    return classes



      .filter((item) => {

        const studentText = students



          .filter((student) => item.studentIds.includes(student.id))



          .map((student) => student.name)



          .join(" ");



        const matchesSearch =

          !search ||

          [item.course, item.room, item.presenter, studentText].some((value) =>

            value.toLowerCase().includes(search),

          );



        const matchesCourse =

          courseFilter === "All subjects" || item.course === courseFilter;



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

  }, [

    classes,



    students,



    query,



    courseFilter,



    presenterFilter,



    dateFilter,



    statusFilter,

  ]);



  useEffect(() => {
    setCurrentPage(1);
  }, [query, courseFilter, presenterFilter, dateFilter, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredClasses.length / CLASSES_PER_PAGE),
  );
  const displayedPage = Math.min(currentPage, totalPages);
  const firstVisibleClass = filteredClasses.length
    ? (displayedPage - 1) * CLASSES_PER_PAGE + 1
    : 0;
  const lastVisibleClass = Math.min(
    displayedPage * CLASSES_PER_PAGE,
    filteredClasses.length,
  );
  const pageClasses = filteredClasses.slice(
    (displayedPage - 1) * CLASSES_PER_PAGE,
    displayedPage * CLASSES_PER_PAGE,
  );

  async function saveClass(form) {

    const data = {

      course: Number(form.course),



      date: form.date,



      start_time: form.startTime,



      end_time: form.endTime,



      room: form.room,



      capacity: form.capacity,



      presenter: Number(form.presenter),



      assistant: null,



      students: form.studentIds,

    };



    if (editingClass) await api.patch(`/sessions/${editingClass.id}/`, data);

    else await api.post("/sessions/", data);



    records.refresh();



    setDialogOpen(false);



    setEditingClass(null);

    setInitialClassDate("");

  }



  function openCreateForDate(date = "") {

    setEditingClass(null);

    setInitialClassDate(date);

    setDialogOpen(true);

  }



  function navigateCalendar(direction) {

    setCalendarDate((current) => {

if (calendarView === "week") return shiftDate(current, direction * 7);
      return new Date(

        current.getFullYear(),

        current.getMonth() + direction,

        1,

        12,

      );

    });

  }



  function openEdit(classItem) {

    setEditingClass(classItem);



    setSelectedClass(null);



    setDialogOpen(true);

  }



  function clearFilters() {

    setQuery("");



    setCourseFilter("All subjects");



    setPresenterFilter("All presenters");



    setDateFilter("");



    setStatusFilter("All classes");

  }



  return (

    <main className="classes-page">

      <RequestState

        loading={

          records.loading ||

          courseRecords.loading ||

          staffRecords.loading ||

          studentRecords.loading

        }

        error={

          records.error ||

          courseRecords.error ||

          staffRecords.error ||

          studentRecords.error

        }

        onRetry={() => {

          records.refresh();



          courseRecords.refresh();



          staffRecords.refresh();



          studentRecords.refresh();

        }}

      />



      {actionError && (

        <p className="crm-message crm-message--error" role="alert">

          {actionError}

        </p>

      )}



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

            placeholder="Search subject, room, presenter or student"

            value={query}

            onChange={(event) => setQuery(event.target.value)}

          />

        </label>



        <label className="classes-filter">

          <span>Subject</span>



          <select

            value={courseFilter}

            onChange={(event) => setCourseFilter(event.target.value)}

          >

            <option>All subjects</option>



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



        {canManage && (

          <button

            className="classes-primary-button classes-create-button"

            type="button"

            onClick={() => openCreateForDate()}

          >

            <span aria-hidden="true">+</span> Create class

          </button>

        )}

      </section>



      <section className="classes-panel" aria-labelledby="classes-list-title">

        <div className="classes-panel__heading">

          <div>

            <h2 id="classes-list-title">Classes and sessions</h2>



            <p>Manage schedules, staff assignments and student enrolments.</p>

          </div>

          <div

            className="classes-display-toggle"

            role="group"

            aria-label="Classes display"

          >

            <button

              type="button"

              aria-pressed={displayMode === "table"}

              className={displayMode === "table" ? "is-active" : ""}

              onClick={() => setDisplayMode("table")}

            >

              Table

            </button>

            <button

              type="button"

              aria-pressed={displayMode === "calendar"}

              className={displayMode === "calendar" ? "is-active" : ""}

              onClick={() => setDisplayMode("calendar")}

            >

              Calendar

            </button>

          </div>

        </div>



        <div className="classes-results" aria-live="polite">

          <span>

            Showing {filteredClasses.length} of {classes.length} classes

          </span>



          {(query ||

            courseFilter !== "All subjects" ||

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



          {displayMode === "table" && (

            <span className="classes-scroll-hint">

              Scroll horizontally to view all columns

            </span>

          )}

        </div>



        {displayMode === "calendar" ? (

          <CalendarView

            sessions={filteredClasses}

            anchorDate={calendarDate}

            view={calendarView}

            onViewChange={setCalendarView}

            onNavigate={navigateCalendar}

            onToday={() =>

              setCalendarDate(parseLocalDate(localDateString(new Date())))

            }

            onSelectSession={setSelectedClass}

            onCreateForDate={openCreateForDate}

            canManage={canManage}

          />

        ) : filteredClasses.length ? (
          <>
          <div
            className="classes-table-wrap"

            role="region"

            aria-label="Class sessions table"

            tabIndex={0}

          >

            <table className="classes-table">

              <thead>

                <tr>

                  <th scope="col">Subject</th>



                  <th scope="col">Date and time</th>



                  <th scope="col">Room</th>



                  <th scope="col">Presenter</th>



                  <th scope="col">Students</th>



                  <th scope="col">Status</th>



                  <th scope="col">

                    <span className="visually-hidden">Actions</span>

                  </th>

                </tr>

              </thead>



              <tbody>

                {pageClasses.map((item) => {

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



                        {canManage && (

                          <button

                            className="classes-edit-button"

                            type="button"

                            onClick={() => openEdit(item)}

                          >

                            Edit

                          </button>

                        )}

                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>
          <nav className="classes-pagination" aria-label="Class table pages">
            <span className="classes-pagination__summary" aria-live="polite">
              Showing {firstVisibleClass}–{lastVisibleClass} of {filteredClasses.length} classes
            </span>
            {totalPages > 1 && (
              <div className="classes-pagination__controls">
                <button
                  className="classes-pagination__button"
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={displayedPage === 1}
                  aria-label="Go to previous page"
                >
                  Previous
                </button>
                <span className="classes-pagination__page" aria-current="page">
                  Page {displayedPage} of {totalPages}
                </span>
                <button
                  className="classes-pagination__button"
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={displayedPage === totalPages}
                  aria-label="Go to next page"
                >
                  Next
                </button>
              </div>
            )}
          </nav>
          </>
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

          initialDate={initialClassDate}

          onClose={() => {

            setDialogOpen(false);



            setEditingClass(null);



            setInitialClassDate("");

          }}

          onSave={saveClass}

          courses={courseOptions}

          staff={Array.isArray(staffRecords.data) ? staffRecords.data : []}

          students={students}

          sessions={classes}

        />

      )}



      {selectedClass && (

        <ClassDetails

          classItem={selectedClass}

          onClose={() => setSelectedClass(null)}

          students={students}

          onEdit={canManage ? () => openEdit(selectedClass) : null}

          onDelete={

            canManage

              ? async () => {

                  if (

                    !window.confirm(

                      "Delete this class session? Sessions with recorded history cannot be deleted.",

                    )

                  )

                    return;



                  try {

                    await api.delete(`/sessions/${selectedClass.id}/`);



                    setSelectedClass(null);



                    records.refresh();

                  } catch (requestError) {

                    setActionError(errorMessage(requestError));

                  }

                }

              : null

          }

        />

      )}

    </main>

  );

}
