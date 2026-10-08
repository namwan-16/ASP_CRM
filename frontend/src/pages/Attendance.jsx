import { useMemo, useState } from "react";
import "./Attendance.css";

const demoStudents = [
  {
    id: "ASP-1001",
    firstName: "Ava",
    lastName: "Thompson",
    className: "Year 7 Mathematics",
    guardian: "Sarah Thompson",
    permissionToTravelAlone: false,
    arrivalStatus: "present",
    arrivalTime: "16:05",
    guardianCollected: false,
  },
  {
    id: "ASP-1002",
    firstName: "Noah",
    lastName: "Williams",
    className: "Year 7 Mathematics",
    guardian: "Michael Williams",
    permissionToTravelAlone: true,
    arrivalStatus: "present",
    arrivalTime: "16:12",
    guardianCollected: false,
  },
  {
    id: "ASP-1003",
    firstName: "Mia",
    lastName: "Chen",
    className: "Year 7 Mathematics",
    guardian: "Linda Chen",
    permissionToTravelAlone: false,
    arrivalStatus: "not_arrived",
    arrivalTime: "",
    guardianCollected: false,
  },
  {
    id: "ASP-1004",
    firstName: "Oliver",
    lastName: "Brown",
    className: "Year 8 Physical Sciences",
    guardian: "James Brown",
    permissionToTravelAlone: false,
    arrivalStatus: "late",
    arrivalTime: "16:28",
    guardianCollected: false,
  },
  {
    id: "ASP-1005",
    firstName: "Isla",
    lastName: "Wilson",
    className: "Year 8 Physical Sciences",
    guardian: "Emily Wilson",
    permissionToTravelAlone: true,
    arrivalStatus: "absent",
    arrivalTime: "",
    guardianCollected: false,
  },
];

const statusLabels = {
  present: "Present",
  late: "Late",
  not_arrived: "Not arrived",
  absent: "Absent",
};

function getLocalDateValue() {
  const now = new Date();
  const localOffset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - localOffset).toISOString().slice(0, 10);
}

function getLocalTime() {
  return new Intl.DateTimeFormat("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Australia/Perth",
  }).format(new Date());
}

function formatDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Australia/Perth",
  }).format(new Date(`${value}T00:00:00`));
}

export default function Attendance() {
  const [students, setStudents] = useState(demoStudents);
  const [selectedClass, setSelectedClass] = useState("All classes");
  const [selectedDate, setSelectedDate] = useState(getLocalDateValue());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const classOptions = useMemo(
    () => [...new Set(students.map((student) => student.className))],
    [students],
  );

  const classStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          selectedClass === "All classes" ||
          student.className === selectedClass,
      ),
    [students, selectedClass],
  );

  const visibleStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return classStudents.filter((student) => {
      const matchesSearch =
        !query ||
        `${student.firstName} ${student.lastName}`
          .toLowerCase()
          .includes(query) ||
        student.guardian.toLowerCase().includes(query) ||
        student.id.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || student.arrivalStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [classStudents, searchTerm, statusFilter]);

  const counts = useMemo(
    () => ({
      expected: classStudents.length,
      present: classStudents.filter(
        (student) => student.arrivalStatus === "present",
      ).length,
      late: classStudents.filter((student) => student.arrivalStatus === "late")
        .length,
      notArrived: classStudents.filter(
        (student) => student.arrivalStatus === "not_arrived",
      ).length,
      absent: classStudents.filter(
        (student) => student.arrivalStatus === "absent",
      ).length,
    }),
    [classStudents],
  );

  function updateArrivalStatus(studentId, arrivalStatus) {
    setStudents((currentStudents) =>
      currentStudents.map((student) => {
        if (student.id !== studentId) return student;

        return {
          ...student,
          arrivalStatus,
          arrivalTime:
            arrivalStatus === "present" || arrivalStatus === "late"
              ? student.arrivalTime || getLocalTime()
              : "",
          guardianCollected:
            arrivalStatus === "present" || arrivalStatus === "late"
              ? student.guardianCollected
              : false,
        };
      }),
    );
  }

  function toggleGuardianCollection(studentId) {
    setStudents((currentStudents) =>
      currentStudents.map((student) =>
        student.id === studentId
          ? { ...student, guardianCollected: !student.guardianCollected }
          : student,
      ),
    );
  }

  return (
    <main className="attendance-page">
      <header className="attendance-heading">
        <div>
          <h1>Attendance</h1>
          <p className="attendance-description">
            Record student arrivals and guardian collection for class sessions.
          </p>
        </div>

        <span className="attendance-demo-badge">Demo data</span>
      </header>

      {/* <section className="attendance-notice" aria-label="Notification schedule">
        <div className="attendance-notice__icon" aria-hidden="true">i</div>
        <p>
          <strong>Automated email checks:</strong> student non-arrival at{" "}
          <strong>4:40 pm</strong> and guardian non-arrival at{" "}
          <strong>6:40 pm</strong> on class days. Only students without
          permission to travel alone are included. Email sending will be
          connected with the backend.
        </p>
      </section> */}

      <section className="attendance-summary" aria-label="Attendance summary">
        <article className="attendance-summary-card">
          <span className="attendance-summary-card__label">Expected</span>
          <strong>{counts.expected}</strong>
          <span className="attendance-summary-card__detail">
            Students today
          </span>
        </article>

        <article className="attendance-summary-card attendance-summary-card--present">
          <span className="attendance-summary-card__label">Present</span>
          <strong>{counts.present}</strong>
          <span className="attendance-summary-card__detail">Checked in</span>
        </article>

        <article className="attendance-summary-card attendance-summary-card--late">
          <span className="attendance-summary-card__label">Late</span>
          <strong>{counts.late}</strong>
          <span className="attendance-summary-card__detail">Arrived late</span>
        </article>

        <article className="attendance-summary-card attendance-summary-card--waiting">
          <span className="attendance-summary-card__label">Not arrived</span>
          <strong>{counts.notArrived}</strong>
          <span className="attendance-summary-card__detail">
            Awaiting arrival
          </span>
        </article>

        <article className="attendance-summary-card attendance-summary-card--absent">
          <span className="attendance-summary-card__label">Absent</span>
          <strong>{counts.absent}</strong>
          <span className="attendance-summary-card__detail">Marked absent</span>
        </article>
      </section>

      <section
        className="attendance-panel"
        aria-labelledby="attendance-list-title"
      >
        <div className="attendance-panel__heading">
          <div>
            <h2 id="attendance-list-title">Class register</h2>
            <p>{formatDate(selectedDate)}</p>
          </div>
        </div>

        <div className="attendance-toolbar">
          <label className="attendance-control">
            <span>Class</span>
            <select
              value={selectedClass}
              onChange={(event) => setSelectedClass(event.target.value)}
            >
              <option>All classes</option>
              {classOptions.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </label>

          <label className="attendance-control">
            <span>Date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>

          <label className="attendance-control attendance-control--search">
            <span>Search</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Student, guardian or ID"
            />
          </label>

          <label className="attendance-control">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="not_arrived">Not arrived</option>
              <option value="absent">Absent</option>
            </select>
          </label>
        </div>

        <div className="attendance-results">
          <span>
            Showing {visibleStudents.length} of {classStudents.length} students
          </span>
          <span className="attendance-results__hint">
            Scroll horizontally to see all columns
          </span>
        </div>

        <div className="attendance-table-wrap">
          <table className="attendance-table">
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Guardian</th>
                <th scope="col">Travel permission</th>
                <th scope="col">Arrival status</th>
                <th scope="col">Arrival time</th>
                <th scope="col">Guardian collection</th>
              </tr>
            </thead>

            <tbody>
              {visibleStudents.map((student) => {
                const canRecordCollection =
                  !student.permissionToTravelAlone &&
                  ["present", "late"].includes(student.arrivalStatus);

                return (
                  <tr key={student.id}>
                    <td>
                      <div className="attendance-student">
                        <strong>
                          {student.firstName} {student.lastName}
                        </strong>
                        <span>{student.id}</span>
                      </div>
                    </td>

                    <td>{student.guardian}</td>

                    <td>
                      <span
                        className={`attendance-permission ${
                          student.permissionToTravelAlone
                            ? "attendance-permission--yes"
                            : "attendance-permission--no"
                        }`}
                      >
                        {student.permissionToTravelAlone
                          ? "May travel alone"
                          : "Guardian required"}
                      </span>
                    </td>

                    <td>
                      <label
                        className="visually-hidden"
                        htmlFor={`status-${student.id}`}
                      >
                        Arrival status for {student.firstName}{" "}
                        {student.lastName}
                      </label>
                      <select
                        id={`status-${student.id}`}
                        className={`attendance-status-select attendance-status-select--${student.arrivalStatus}`}
                        value={student.arrivalStatus}
                        onChange={(event) =>
                          updateArrivalStatus(student.id, event.target.value)
                        }
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>{student.arrivalTime || "—"}</td>

                    <td>
                      {student.permissionToTravelAlone ? (
                        <span className="attendance-collection attendance-collection--not-required">
                          Not required
                        </span>
                      ) : canRecordCollection ? (
                        <button
                          type="button"
                          className={`attendance-collection-button ${
                            student.guardianCollected
                              ? "attendance-collection-button--done"
                              : ""
                          }`}
                          onClick={() => toggleGuardianCollection(student.id)}
                        >
                          {student.guardianCollected
                            ? "Collected"
                            : "Mark collected"}
                        </button>
                      ) : (
                        <span className="attendance-collection">
                          Awaiting student
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {visibleStudents.length === 0 && (
                <tr>
                  <td className="attendance-empty" colSpan="6">
                    No students match your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
