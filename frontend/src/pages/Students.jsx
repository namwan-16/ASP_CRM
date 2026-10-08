import { useMemo, useState } from "react";
import "./Students.css";
import api from "../api/client";
import { errorMessage, studentRecord } from "../api/crm";
import useRecords from "../hooks/useRecords";
import { useAuth } from "../context/AuthContext";
import RequestState from "../components/RequestState";


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

function StudentDetailsDialog({ student, onClose, onEdit, onDelete }) {
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
          <div><dt>Date of birth</dt><dd>{student.date_of_birth}</dd></div>
          <div><dt>School</dt><dd>{student.school || "Not recorded"}</dd></div>
          <div><dt>Medical information</dt><dd>{student.medical_information || "Not recorded"}</dd></div>
          <div><dt>Special circumstances</dt><dd>{student.special_circumstances || "Not recorded"}</dd></div>
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
          {onEdit && <button className="students-secondary-button" type="button" onClick={onEdit}>Edit</button>}
          {onDelete && <button className="students-secondary-button" type="button" onClick={onDelete}>Delete</button>}
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

function AddStudentDialog({ onClose, onAdd, guardians, student }) {
  const [formData, setFormData] = useState({
    firstName: student?.firstName || "",
    lastName: student?.lastName || "",
    level: student?.level || "",
    subject: student?.subject || "",
    guardian: student?.guardianId || "",
    permissionToTravelAlone: student?.permissionToTravelAlone || "No",
    date_of_birth: student?.date_of_birth || "",
    school: student?.school || "",
    email: student?.email || "",
    phone: student?.phone || "",
    medical_information: student?.medical_information || "",
    special_circumstances: student?.special_circumstances || "",
    relationship: student?.relationship || "Guardian",
    status: student?.status || "Active",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try { await onAdd(formData); }
    catch (requestError) { setError(errorMessage(requestError)); }
    finally { setSaving(false); }
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
            <h2 id="add-student-title">{student ? "Edit student" : "Add student"}</h2>
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
                aria-label="Level"
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
                aria-label="Subject"
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

          <div className="students-form__row">
            <label>Date of birth<input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required /></label>
            <label>School<input name="school" value={formData.school} onChange={handleChange} /></label>
          </div>
          <div className="students-form__row">
            <label>Email<input type="email" name="email" value={formData.email} onChange={handleChange} /></label>
            <label>Phone<input type="tel" name="phone" value={formData.phone} onChange={handleChange} /></label>
          </div>
          <label>
            Primary guardian
            <select
              name="guardian"
              value={formData.guardian}
              onChange={handleChange}
            >
              <option value="">No primary guardian selected</option>
              {guardians.map((guardian) => <option key={guardian.id} value={guardian.id}>{guardian.first_name} {guardian.last_name} ({guardian.phone})</option>)}
            </select>
          </label>
          <label>Relationship<input name="relationship" value={formData.relationship} onChange={handleChange} /></label>

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

          <label>Medical information<textarea name="medical_information" value={formData.medical_information} onChange={handleChange} /></label>
          <label>Special circumstances<textarea name="special_circumstances" value={formData.special_circumstances} onChange={handleChange} /></label>
          <label>Status<select name="status" value={formData.status} onChange={handleChange}><option>Active</option><option>Inactive</option></select></label>
          {error && <p className="crm-message crm-message--error" role="alert">{error}</p>}

          <div className="students-form__actions">
            <button
              className="students-secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="students-primary-button" type="submit" disabled={saving}>
              {saving ? "Saving..." : student ? "Save changes" : "Add student"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function Students() {
  const records = useRecords("/students/");
  const guardianRecords = useRecords("/guardians/");
  const students = useMemo(() => records.data.map(studentRecord), [records.data]);
  const { user } = useAuth();
  const canManage = user?.can_manage;
  const [editingStudent, setEditingStudent] = useState(null);
  const [actionError, setActionError] = useState("");
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

  async function handleAddStudent(student) {
    const data = { first_name: student.firstName, last_name: student.lastName, date_of_birth: student.date_of_birth,
      school: student.school, year_level: student.level, subject: student.subject, email: student.email, phone: student.phone,
      medical_information: student.medical_information, special_circumstances: student.special_circumstances,
      permission_to_travel_alone: student.permissionToTravelAlone === "Yes", is_active: student.status === "Active",
      guardian_id: student.guardian ? Number(student.guardian) : null, guardian_relationship: student.relationship };
    if (editingStudent) await api.patch(`/students/${editingStudent.apiId}/`, data);
    else await api.post("/students/", data);
    records.refresh();
    setShowAddDialog(false);
    setEditingStudent(null);
  }

  async function deleteStudent() {
    if (!window.confirm(`Delete ${selectedStudent.firstName} ${selectedStudent.lastName}?`)) return;
    try {
      await api.delete(`/students/${selectedStudent.apiId}/`);
      setSelectedStudent(null);
      records.refresh();
    } catch (requestError) { setActionError(errorMessage(requestError)); }
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

        {canManage && <button
          className="students-primary-button"
          type="button"
          onClick={() => { setEditingStudent(null); setShowAddDialog(true); }}
        >
          <span aria-hidden="true">+</span>
          Add student
        </button>}
      </header>
      <RequestState loading={records.loading || guardianRecords.loading} error={records.error || guardianRecords.error} onRetry={() => { records.refresh(); guardianRecords.refresh(); }} />
      {actionError && <p className="crm-message crm-message--error" role="alert">{actionError}</p>}

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
          guardians={guardianRecords.data}
          student={editingStudent}
        />
      )}

      {selectedStudent && (
        <StudentDetailsDialog
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onEdit={canManage ? () => { setEditingStudent(selectedStudent); setSelectedStudent(null); setShowAddDialog(true); } : null}
          onDelete={canManage ? deleteStudent : null}
        />
      )}
    </main>
  );
}
