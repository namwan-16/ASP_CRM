import { useMemo, useState } from "react";
import "./Students.css";

const initialStudents = [
  {
    id: "ASP-1001",
    firstName: "Ava",
    lastName: "Thompson",
    level: "Year 7",
    subject: "Mathematics",
    guardian: "Sarah Thompson",
    permissionToTravelAlone: "No",
    status: "Active",
  },
  {
    id: "ASP-1002",
    firstName: "Noah",
    lastName: "Williams",
    level: "Year 8",
    subject: "Physical Sciences",
    guardian: "Michael Williams",
    permissionToTravelAlone: "Yes",
    status: "Active",
  },
  {
    id: "ASP-1003",
    firstName: "Mia",
    lastName: "Chen",
    level: "Year 9",
    subject: "Mathematics",
    guardian: "Linda Chen",
    permissionToTravelAlone: "No",
    status: "Active",
  },
  {
    id: "ASP-1004",
    firstName: "Oliver",
    lastName: "Brown",
    level: "Year 10",
    subject: "Physical Sciences",
    guardian: "James Brown",
    permissionToTravelAlone: "No",
    status: "Inactive",
  },
  {
    id: "ASP-1005",
    firstName: "Isla",
    lastName: "Wilson",
    level: "Year 7",
    subject: "Physical Sciences",
    guardian: "Emily Wilson",
    permissionToTravelAlone: "Yes",
    status: "Active",
  },
];

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

function StudentDetailsDialog({ student, onClose }) {
  if (!student) return null;

  return (
    <div
      className="students-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="students-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-details-title"
      >
        <div className="students-dialog__heading">
          <div>
            <p className="students-page__eyebrow">Student record</p>
            <h2 id="student-details-title">
              {student.firstName} {student.lastName}
            </h2>
          </div>

          <button
            className="students-icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close student details"
          >
            <CloseIcon />
          </button>
        </div>

        <dl className="students-details">
          <div>
            <dt>Student ID</dt>
            <dd>{student.id}</dd>
          </div>
          <div>
            <dt>Level</dt>
            <dd>{student.level}</dd>
          </div>
          <div>
            <dt>Subject</dt>
            <dd>{student.subject}</dd>
          </div>
          <div>
            <dt>Guardian</dt>
            <dd>{student.guardian}</dd>
          </div>
          <div>
            <dt>Permission to travel alone</dt>
            <dd>{student.permissionToTravelAlone}</dd>
          </div>
          <div>
            <dt>Enrolment status</dt>
            <dd>
              <span
                className={`students-status students-status--${student.status.toLowerCase()}`}
              >
                {student.status}
              </span>
            </dd>
          </div>
        </dl>

        <div className="students-form__actions">
          <button
            className="students-secondary-button"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}

function AddStudentDialog({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    level: "",
    subject: "",
    guardian: "",
    permissionToTravelAlone: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const newStudent = {
      ...formData,
      id: `ASP-${Date.now().toString().slice(-5)}`,
      status: "Active",
    };

    onAdd(newStudent);
  }

  return (
    <div
      className="students-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="students-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-student-title"
      >
        <div className="students-dialog__heading">
          <div>
            <p className="students-page__eyebrow">Student records</p>
            <h2 id="add-student-title">Add student</h2>
          </div>

          <button
            className="students-icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close add student form"
          >
            <CloseIcon />
          </button>
        </div>

        <form className="students-form" onSubmit={handleSubmit}>
          <div className="students-form__row">
            <label>
              First name
              <input
                autoFocus
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
                autoComplete="given-name"
                required
              />
            </label>

            <label>
              Last name
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter last name"
                autoComplete="family-name"
                required
              />
            </label>
          </div>

          <div className="students-form__row">
            <label>
              Level
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                required
              >
                <option value="">Select a level</option>
                <option value="Year 7">Year 7</option>
                <option value="Year 8">Year 8</option>
                <option value="Year 9">Year 9</option>
                <option value="Year 10">Year 10</option>
                <option value="Year 11">Year 11</option>
                <option value="Year 12">Year 12</option>
              </select>
            </label>

            <label>
              Subject
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              >
                <option value="">Select a subject</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physical Sciences">Physical Sciences</option>
              </select>
            </label>
          </div>

          <label>
            Guardian name
            <input
              name="guardian"
              value={formData.guardian}
              onChange={handleChange}
              placeholder="Enter guardian name"
              required
            />
          </label>

          <label>
            Permission to travel alone
            <select
              name="permissionToTravelAlone"
              value={formData.permissionToTravelAlone}
              onChange={handleChange}
              required
            >
              <option value="">Select an option</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </label>

          <p className="students-form__note">
            This prototype stores new records in the page only. They will be
            cleared when you refresh.
          </p>

          <div className="students-form__actions">
            <button
              className="students-secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="students-primary-button" type="submit">
              Add student
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function Students() {
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All levels");
  const [subjectFilter, setSubjectFilter] = useState("All subjects");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();

      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        student.id.toLowerCase().includes(query) ||
        student.guardian.toLowerCase().includes(query);

      const matchesLevel =
        levelFilter === "All levels" || student.level === levelFilter;

      const matchesSubject =
        subjectFilter === "All subjects" || student.subject === subjectFilter;

      const matchesStatus =
        statusFilter === "All statuses" || student.status === statusFilter;

      return matchesSearch && matchesLevel && matchesSubject && matchesStatus;
    });
  }, [students, search, levelFilter, subjectFilter, statusFilter]);

  function handleAddStudent(student) {
    setStudents((current) => [student, ...current]);
    setShowAddDialog(false);
  }

  return (
    <main className="students-page">
      <header className="students-page__heading">
        <div>
          <h1>Students</h1>
          <p className="students-page__description">
            View and manage student records.
          </p>
        </div>

        <button
          className="students-primary-button"
          type="button"
          onClick={() => setShowAddDialog(true)}
        >
          <span aria-hidden="true">+</span>
          Add student
        </button>
      </header>

      <section className="students-panel" aria-label="Student records">
        <div className="students-toolbar">
          <label className="students-search">
            <span className="students-search__icon">
              <SearchIcon />
            </span>
            <span className="visually-hidden">Search students</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by student name, ID or guardian"
            />
          </label>

          <label className="students-filter">
            <span>Level</span>
            <select
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
              aria-label="Filter by level"
            >
              <option>All levels</option>
              <option>Year 7</option>
              <option>Year 8</option>
              <option>Year 9</option>
              <option>Year 10</option>
              <option>Year 11</option>
              <option>Year 12</option>
            </select>
          </label>

          <label className="students-filter">
            <span>Subject</span>
            <select
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
              aria-label="Filter by subject"
            >
              <option>All subjects</option>
              <option>Mathematics</option>
              <option>Physical Sciences</option>
            </select>
          </label>

          <label className="students-filter">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by enrolment status"
            >
              <option>All statuses</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </label>
        </div>

        <div className="students-results">
          <span>
            Showing <strong>{filteredStudents.length}</strong> of{" "}
            <strong>{students.length}</strong> students
          </span>
          <span className="students-demo-label">Prototype data</span>
        </div>

        {filteredStudents.length > 0 ? (
          <div
            className="students-table-wrap"
            role="region"
            aria-label="Student list. Scroll horizontally to see all columns."
            tabIndex={0}
          >
            <table className="students-table">
              <thead>
                <tr>
                  <th scope="col">Student ID</th>
                  <th scope="col">Student</th>
                  <th scope="col">Level</th>
                  <th scope="col">Subject</th>
                  <th scope="col">Guardian</th>
                  <th scope="col">Travel permission</th>
                  <th scope="col">Enrolment status</th>
                  <th scope="col" className="student-row-action">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="student-id">{student.id}</td>
                    <td>
                      <span className="student-name">
                        {student.firstName} {student.lastName}
                      </span>
                    </td>
                    <td>{student.level}</td>
                    <td>{student.subject}</td>
                    <td>{student.guardian}</td>
                    <td>{student.permissionToTravelAlone || "Not recorded"}</td>
                    <td>
                      <span
                        className={`students-status students-status--${student.status.toLowerCase()}`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="student-row-action">
                      <button
                        className="students-view-button"
                        type="button"
                        onClick={() => setSelectedStudent(student)}
                        aria-label={`View ${student.firstName} ${student.lastName}`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="students-empty-state">
            <h2>No students found</h2>
            <p>Try changing your search or filters.</p>
          </div>
        )}
      </section>

      {showAddDialog && (
        <AddStudentDialog
          onClose={() => setShowAddDialog(false)}
          onAdd={handleAddStudent}
        />
      )}

      {selectedStudent && (
        <StudentDetailsDialog
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </main>
  );
}
