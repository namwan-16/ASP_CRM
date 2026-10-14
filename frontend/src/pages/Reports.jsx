import { useMemo, useState } from "react";
import "./Reports.css";
import useRecords from "../hooks/useRecords";
import RequestState from "../components/RequestState";

const REPORT_TABS = [
  "Student attendance",
  "Absences & late arrivals",
  "Student enrolment",
  "Presenter/class activity",
  "Progress notes",
];

const EMPTY = [];

function asArray(value) {
  return Array.isArray(value) ? value : EMPTY;
}

function relationId(value) {
  if (value && typeof value === "object") {
    return value.id ?? value.pk ?? "";
  }

  return value ?? "";
}

function getStudentName(student) {
  if (!student) return "";

  if (typeof student === "string") return student;

  return (
    student.full_name ||
    student.name ||
    [student.first_name, student.last_name].filter(Boolean).join(" ").trim() ||
    ""
  );
}

function getStudentId(record) {
  return String(
    relationId(
      record.student_details ||
        record.student ||
        record.student_id ||
        record.studentId,
    ) || "",
  );
}

function getSubjectName(record) {
  const course =
    record.course_details ||
    record.course ||
    record.subject_details ||
    record.subject;

  if (typeof course === "string") return course;

  return (
    record.course_name ||
    record.subject_name ||
    course?.name ||
    course?.title ||
    ""
  );
}

function getPresenterName(record) {
  const presenter =
    record.presenter_details ||
    record.presenter ||
    record.author_details ||
    record.author;

  if (typeof presenter === "string") return presenter;

  return (
    record.presenter_name ||
    record.author_name ||
    [presenter?.first_name, presenter?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    presenter?.username ||
    "Not assigned"
  );
}

function getDate(record) {
  const value =
    record.date ||
    record.session_date ||
    record.registered_at ||
    record.registration_date ||
    record.created_at ||
    "";

  return String(value).split("T")[0];
}

function formatDate(value) {
  if (!value) return "—";

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function getSessionId(record) {
  return String(
    relationId(record.session_details || record.session || record.session_id) ||
      "",
  );
}

function getSessionLabel(session) {
  const date = getDate(session);
  const subject = getSubjectName(session);
  const room = session.room || session.location || "";

  return (
    [subject, date ? formatDate(date) : "", room].filter(Boolean).join(" · ") ||
    `Session ${session.id}`
  );
}

function getAttendanceStatus(record) {
  const value = String(record.status || record.attendance_status || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  if (["present", "attended"].includes(value)) return "present";
  if (["late", "arrived_late"].includes(value)) return "late";
  if (["absent", "did_not_attend"].includes(value)) return "absent";
  if (["excused", "excused_absence"].includes(value)) return "excused";

  return "not_recorded";
}

function formatStatus(value) {
  const labels = {
    present: "Present",
    late: "Late",
    absent: "Absent",
    excused: "Excused",
    not_recorded: "Not recorded",
    active: "Active",
    inactive: "Inactive",
  };

  return labels[value] || value || "—";
}

function getNoteText(note) {
  if (note.text || note.comment || note.comments) {
    return note.text || note.comment || note.comments;
  }

  const parts = [];

  if (note.answers_checked != null) {
    parts.push(`Answers checked: ${note.answers_checked ? "Yes" : "No"}`);
  }

  if (note.achievement) {
    parts.push(`Achievement: ${note.achievement}`);
  }

  if (note.student_feedback) {
    parts.push(`Student feedback: ${note.student_feedback}`);
  }

  if (note.presenter_comments) {
    parts.push(note.presenter_comments);
  }

  return parts.join(" · ") || "—";
}

function matchesStudent(record, studentId) {
  if (studentId === "All") return true;
  return String(record.studentId || "") === studentId;
}

function getRoster(session) {
  if (Array.isArray(session.students)) return session.students;
  if (Array.isArray(session.roster)) return session.roster;
  return [];
}

function getPersonFromRosterItem(item, students) {
  const id = String(relationId(item) || "");
  const embeddedStudent =
    item && typeof item === "object"
      ? item.student_details || item.student || item
      : null;

  const foundStudent = students.find((student) => String(student.id) === id);

  const student = embeddedStudent || foundStudent || null;

  return {
    id: String(student?.id ?? id),
    name: getStudentName(student) || (id ? `Student ${id}` : "Unknown student"),
  };
}

function attendanceMatchesStudent(mark, student) {
  const markStudentId = getStudentId(mark);

  if (markStudentId && student.id) {
    return markStudentId === student.id;
  }

  const markName = getStudentName(
    mark.student_details || mark.student || mark,
  ).toLowerCase();

  return Boolean(markName && markName === student.name.toLowerCase());
}

export default function Reports() {
  const sessionsRecord = useRecords("/sessions/");
  const attendanceRecord = useRecords("/attendance/");
  const registrationsRecord = useRecords("/registrations/");
  const notesRecord = useRecords("/progress-notes/");
  const studentsRecord = useRecords("/students/");

  const sessions = asArray(sessionsRecord.data);
  const attendance = asArray(attendanceRecord.data);
  const registrations = asArray(registrationsRecord.data);
  const notes = asArray(notesRecord.data);
  const students = asArray(studentsRecord.data);

  const [tab, setTab] = useState(REPORT_TABS[0]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [studentFilter, setStudentFilter] = useState("All");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All");
  const [presenterFilter, setPresenterFilter] = useState("All");

  const sessionRows = useMemo(() => {
    return sessions.flatMap((session) => {
      const sessionId = String(session.id);
      const sessionAttendance = attendance.filter(
        (mark) => getSessionId(mark) === sessionId,
      );
      const roster = getRoster(session);
      const usedMarks = new Set();

      const expectedRows = roster.map((rosterItem) => {
        const person = getPersonFromRosterItem(rosterItem, students);
        const markIndex = sessionAttendance.findIndex(
          (mark, index) =>
            !usedMarks.has(index) && attendanceMatchesStudent(mark, person),
        );

        const mark = markIndex >= 0 ? sessionAttendance[markIndex] : null;

        if (markIndex >= 0) usedMarks.add(markIndex);

        return {
          key: `${sessionId}-${person.id || person.name}`,
          sessionId,
          date: getDate(session),
          subject: getSubjectName(session),
          className: getSessionLabel(session),
          presenter: getPresenterName(session),
          studentId: person.id,
          student: person.name,
          status: mark ? getAttendanceStatus(mark) : "not_recorded",
          attendanceNotes: mark?.notes || mark?.comments || "",
        };
      });

      const additionalMarks = sessionAttendance
        .filter((_, index) => !usedMarks.has(index))
        .map((mark, index) => {
          const studentId = getStudentId(mark);
          const student = students.find(
            (item) => String(item.id) === studentId,
          );
          const studentName =
            mark.student_name ||
            getStudentName(mark.student_details || mark.student) ||
            getStudentName(student) ||
            "Unknown student";

          return {
            key: `${sessionId}-additional-${studentId || index}`,
            sessionId,
            date: getDate(session) || getDate(mark),
            subject: getSubjectName(session),
            className: getSessionLabel(session),
            presenter: getPresenterName(session),
            studentId,
            student: studentName,
            status: getAttendanceStatus(mark),
            attendanceNotes: mark.notes || mark.comments || "",
          };
        });

      // If the API does not include a roster, show the attendance records
      // available for that session without inventing unrecorded students.
      if (roster.length === 0) {
        return additionalMarks;
      }

      return [...expectedRows, ...additionalMarks];
    });
  }, [sessions, attendance, students]);

  const enrolmentRows = useMemo(
    () =>
      registrations.map((registration, index) => {
        const studentId = getStudentId(registration);
        const student = students.find((item) => String(item.id) === studentId);

        const active =
          registration.is_active !== false &&
          String(registration.status || "").toLowerCase() !== "inactive";

        return {
          key: registration.id ?? `registration-${index}`,
          date: getDate(registration),
          studentId,
          student:
            registration.student_name ||
            getStudentName(
              registration.student_details || registration.student,
            ) ||
            getStudentName(student) ||
            "Unknown student",
          subject: getSubjectName(registration),
          active,
        };
      }),
    [registrations, students],
  );

  const progressNoteRows = useMemo(
    () =>
      notes.map((note, index) => {
        const studentId = getStudentId(note);
        const student = students.find((item) => String(item.id) === studentId);

        return {
          key: note.id ?? `note-${index}`,
          date: getDate(note),
          sessionId: getSessionId(note),
          studentId,
          student:
            note.student_name ||
            getStudentName(note.student_details || note.student) ||
            getStudentName(student) ||
            "Unknown student",
          subject: getSubjectName(note),
          presenter: getPresenterName(note),
          text: getNoteText(note),
        };
      }),
    [notes, students],
  );

  const activityRows = useMemo(() => {
    return sessions.map((session) => {
      const sessionId = String(session.id);
      const rows = sessionRows.filter((row) => row.sessionId === sessionId);
      const expected = getRoster(session).length || rows.length;
      const sessionNotes = notes.filter(
        (note) => getSessionId(note) === sessionId,
      );

      return {
        key: session.id,
        sessionId,
        date: getDate(session),
        subject: getSubjectName(session),
        className: getSessionLabel(session),
        presenter: getPresenterName(session),
        expected,
        marked: rows.filter((row) => row.status !== "not_recorded").length,
        late: rows.filter((row) => row.status === "late").length,
        absent: rows.filter((row) => row.status === "absent").length,
        notes: sessionNotes.length,
      };
    });
  }, [sessions, sessionRows, notes]);

  const studentOptions = useMemo(
    () =>
      students
        .map((student) => ({
          id: String(student.id),
          name: getStudentName(student) || `Student ${student.id}`,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [students],
  );

  const subjects = useMemo(() => {
    const values = [
      ...sessions.map(getSubjectName),
      ...registrations.map(getSubjectName),
      ...notes.map(getSubjectName),
    ];

    return [...new Set(values.filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    );
  }, [sessions, registrations, notes]);

  const classOptions = useMemo(
    () =>
      sessions
        .map((session) => ({
          id: String(session.id),
          label: getSessionLabel(session),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [sessions],
  );

  const presenterOptions = useMemo(() => {
    const values = [
      ...sessions.map(getPresenterName),
      ...notes.map(getPresenterName),
    ].filter((name) => name && name !== "Not assigned");

    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }, [sessions, notes]);

  const report = useMemo(() => {
    const dateMatches = (date) => {
      if (from && (!date || date < from)) return false;
      if (to && (!date || date > to)) return false;
      return true;
    };

    const filterRows = (
      rows,
      { includeClass = true, includePresenter = true } = {},
    ) =>
      rows.filter((row) => {
        if (!dateMatches(row.date)) return false;

        if (subjectFilter !== "All" && row.subject !== subjectFilter) {
          return false;
        }

        if (!matchesStudent(row, studentFilter)) return false;

        if (
          includeClass &&
          classFilter !== "All" &&
          row.sessionId !== classFilter
        ) {
          return false;
        }

        if (
          includePresenter &&
          presenterFilter !== "All" &&
          row.presenter !== presenterFilter
        ) {
          return false;
        }

        return true;
      });

    if (tab === "Student attendance") {
      const rows = filterRows(sessionRows).sort(
        (a, b) =>
          b.date.localeCompare(a.date) || a.student.localeCompare(b.student),
      );

      const count = (status) =>
        rows.filter((row) => row.status === status).length;

      const attended = count("present") + count("late");
      const marked = attended + count("absent");
      const attendanceRate = marked
        ? `${Math.round((attended / marked) * 100)}%`
        : "—";

      return {
        stats: [
          { value: attendanceRate, label: "Attendance rate" },
          { value: rows.length, label: "Expected student sessions" },
          { value: count("not_recorded"), label: "Not recorded" },
        ],
        columns: [
          { key: "date", label: "Date", format: formatDate },
          { key: "student", label: "Student" },
          { key: "subject", label: "Subject" },
          { key: "className", label: "Class / session" },
          { key: "presenter", label: "Presenter" },
          { key: "status", label: "Attendance", format: formatStatus },
        ],
        rows,
      };
    }

    if (tab === "Absences & late arrivals") {
      const rows = filterRows(sessionRows)
        .filter((row) => ["absent", "late"].includes(row.status))
        .sort((a, b) => b.date.localeCompare(a.date));

      const absent = rows.filter((row) => row.status === "absent").length;
      const late = rows.filter((row) => row.status === "late").length;
      const studentsAffected = new Set(
        rows.map((row) => row.studentId || row.student),
      ).size;

      return {
        stats: [
          { value: absent, label: "Absences" },
          { value: late, label: "Late arrivals" },
          { value: studentsAffected, label: "Students affected" },
        ],
        columns: [
          { key: "date", label: "Date", format: formatDate },
          { key: "student", label: "Student" },
          { key: "subject", label: "Subject" },
          { key: "className", label: "Class / session" },
          { key: "presenter", label: "Presenter" },
          { key: "status", label: "Status", format: formatStatus },
          { key: "attendanceNotes", label: "Notes" },
        ],
        rows,
      };
    }

    if (tab === "Student enrolment") {
      const rows = filterRows(enrolmentRows, {
        includeClass: false,
        includePresenter: false,
      }).sort((a, b) => a.student.localeCompare(b.student));

      const activeRows = rows.filter((row) => row.active);

      return {
        stats: [
          { value: activeRows.length, label: "Active enrolments" },
          {
            value: new Set(
              activeRows.map((row) => row.studentId || row.student),
            ).size,
            label: "Students enrolled",
          },
          {
            value: new Set(activeRows.map((row) => row.subject).filter(Boolean))
              .size,
            label: "Subjects",
          },
        ],
        columns: [
          { key: "student", label: "Student" },
          { key: "subject", label: "Subject" },
          {
            key: "active",
            label: "Status",
            format: (value) => (value ? "Active" : "Inactive"),
          },
          { key: "date", label: "Registered", format: formatDate },
        ],
        rows,
      };
    }

    if (tab === "Presenter/class activity") {
      const rows = filterRows(activityRows).sort((a, b) =>
        b.date.localeCompare(a.date),
      );

      return {
        stats: [
          { value: rows.length, label: "Class sessions" },
          {
            value: new Set(
              rows
                .map((row) => row.presenter)
                .filter((name) => name !== "Not assigned"),
            ).size,
            label: "Presenters",
          },
          {
            value: rows.reduce((total, row) => total + row.expected, 0),
            label: "Expected student sessions",
          },
        ],
        columns: [
          { key: "date", label: "Date", format: formatDate },
          { key: "subject", label: "Subject" },
          { key: "className", label: "Class / session" },
          { key: "presenter", label: "Presenter" },
          { key: "expected", label: "Roster" },
          { key: "marked", label: "Attendance recorded" },
          { key: "late", label: "Late" },
          { key: "absent", label: "Absent" },
          { key: "notes", label: "Progress notes" },
        ],
        rows,
      };
    }

    const rows = filterRows(progressNoteRows, {
      includeClass: false,
    }).sort((a, b) => b.date.localeCompare(a.date));

    return {
      stats: [
        { value: rows.length, label: "Progress notes" },
        {
          value: new Set(rows.map((row) => row.presenter)).size,
          label: "Note authors",
        },
        {
          value: rows.length ? formatDate(rows[0].date) : "—",
          label: "Latest note",
        },
      ],
      columns: [
        { key: "date", label: "Date", format: formatDate },
        { key: "student", label: "Student" },
        { key: "presenter", label: "Presenter" },
        { key: "text", label: "Progress note" },
      ],
      rows,
    };
  }, [
    tab,
    from,
    to,
    studentFilter,
    subjectFilter,
    classFilter,
    presenterFilter,
    sessionRows,
    enrolmentRows,
    activityRows,
    progressNoteRows,
  ]);

  const hideClassFilter =
    tab === "Student enrolment" || tab === "Progress notes";

  const hidePresenterFilter = tab === "Student enrolment";

  const isLoading =
    sessionsRecord.loading ||
    attendanceRecord.loading ||
    registrationsRecord.loading ||
    notesRecord.loading ||
    studentsRecord.loading;

  const loadError =
    sessionsRecord.error ||
    attendanceRecord.error ||
    registrationsRecord.error ||
    notesRecord.error ||
    studentsRecord.error;

  const columnsTemplate = `repeat(${report.columns.length}, minmax(0, 1fr))`;
  const tableMinWidth = report.columns.length >= 7 ? "1050px" : "700px";

  function clearFilters() {
    setFrom("");
    setTo("");
    setStudentFilter("All");
    setSubjectFilter("All");
    setClassFilter("All");
    setPresenterFilter("All");
  }

  function retryLoading() {
    sessionsRecord.refresh();
    attendanceRecord.refresh();
    registrationsRecord.refresh();
    notesRecord.refresh();
    studentsRecord.refresh();
  }

  return (
    <main className="rp-page">
      <header className="rp-top">
        <div>
          <p className="rp-eyebrow">ASP CLASS PROCESS</p>
          <h1>Reports</h1>
          <p>Review attendance, enrolment, and presenter and class activity.</p>
        </div>
      </header>

      <RequestState
        loading={isLoading}
        error={loadError}
        onRetry={retryLoading}
      />

      <div className="rp-tabs" role="tablist" aria-label="Report type">
        {REPORT_TABS.map((reportTab) => (
          <button
            key={reportTab}
            id={`tab-${REPORT_TABS.indexOf(reportTab)}`}
            type="button"
            role="tab"
            aria-selected={tab === reportTab}
            className={`rp-tab${tab === reportTab ? " is-active" : ""}`}
            onClick={() => setTab(reportTab)}
          >
            {reportTab}
          </button>
        ))}
      </div>

      <section className="rp-filters" aria-label="Report filters">
        <label>
          From
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>

        <label>
          To
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>

        <label>
          Student
          <select
            value={studentFilter}
            onChange={(event) => setStudentFilter(event.target.value)}
          >
            <option value="All">All students</option>
            {studentOptions.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Subject
          <select
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
          >
            <option value="All">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </label>

        {!hideClassFilter && (
          <label>
            Class / session
            <select
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
            >
              <option value="All">All classes</option>
              {classOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {!hidePresenterFilter && (
          <label>
            {tab === "Progress notes" ? "Note author" : "Presenter"}
            <select
              value={presenterFilter}
              onChange={(event) => setPresenterFilter(event.target.value)}
            >
              <option value="All">
                All {tab === "Progress notes" ? "authors" : "presenters"}
              </option>
              {presenterOptions.map((presenter) => (
                <option key={presenter} value={presenter}>
                  {presenter}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          className="rp-btn rp-btn--secondary"
          type="button"
          onClick={clearFilters}
        >
          Clear filters
        </button>
      </section>

      {from && to && from > to && (
        <p className="rp-message rp-message--warning" role="alert">
          The start date must be before the end date.
        </p>
      )}

      <section
        className="rp-stats"
        aria-label="Report summary"
        aria-live="polite"
      >
        {report.stats.map((stat) => (
          <article className="rp-stat" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section
        className="rp-results"
        role="tabpanel"
        aria-label={`${tab} report`}
      >
        <div className="rp-results__heading">
          <div>
            <h2>{tab}</h2>
            <p>
              {report.rows.length}{" "}
              {report.rows.length === 1 ? "record" : "records"}
            </p>
          </div>
        </div>

        <div
          className="rp-table"
          role="region"
          aria-label={`${tab} results`}
          tabIndex={0}
        >
          <div
            className="rp-tr rp-th"
            style={{
              gridTemplateColumns: columnsTemplate,
              minWidth: tableMinWidth,
            }}
          >
            {report.columns.map((column) => (
              <span key={column.key}>{column.label}</span>
            ))}
          </div>

          {report.rows.map((row, index) => (
            <div
              className="rp-tr"
              style={{
                gridTemplateColumns: columnsTemplate,
                minWidth: tableMinWidth,
              }}
              key={row.key ?? index}
            >
              {report.columns.map((column) => {
                const value = row[column.key];
                const displayValue = column.format
                  ? column.format(value)
                  : value == null || value === ""
                    ? "—"
                    : value;

                return <span key={column.key}>{displayValue}</span>;
              })}
            </div>
          ))}

          {report.rows.length === 0 && !isLoading && (
            <p className="rp-empty">No results for these filters.</p>
          )}
        </div>
      </section>
    </main>
  );
}
