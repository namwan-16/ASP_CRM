import { useMemo, useState } from "react";
import "./Students.css";
import api from "../api/client";
import { errorMessage, studentRecord } from "../api/crm";
import useRecords from "../hooks/useRecords";
import { useAuth } from "../context/AuthContext";
import RequestState from "../components/RequestState";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { notify } from "../utils/notifications";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

function displayValue(value) {
  return value === null || value === undefined || value === ""
    ? "Not recorded"
    : value;
}

function permissionChoice(value) {
  return value === true || value === 1 || value === "Yes" ? "Yes" : "No";
}

function StudentDetailsDialog({
  student,
  onClose,
  onEdit,
  onDelete,
  onToggleActive,
}) {
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
        </div>

        <h3 className="students-details__section-title">Student information</h3>

        <dl className="students-details">
          <div>
            <dt>Student ID</dt>
            <dd>{displayValue(student.studentId ?? student.id)}</dd>
          </div>
          <div>
            <dt>Date of birth</dt>
            <dd>
              {displayValue(student.date_of_birth ?? student.dateOfBirth)}
            </dd>
          </div>
          <div>
            <dt>School</dt>
            <dd>{displayValue(student.school)}</dd>
          </div>
          <div>
            <dt>Year level</dt>
            <dd>{displayValue(student.level)}</dd>
          </div>
          <div>
            <dt>Subject</dt>
            <dd>{displayValue(student.subject)}</dd>
          </div>
          <div>
            <dt>Guardian</dt>
            <dd>{displayValue(student.guardian)}</dd>
          </div>
          <div>
            <dt>Guardian relationship</dt>
            <dd>{displayValue(student.relationship)}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{displayValue(student.email)}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{displayValue(student.phone ?? student.mobilePhone)}</dd>
          </div>
          <div>
            <dt>Permission to travel alone</dt>
            <dd>{permissionChoice(student.permissionToTravelAlone)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{displayValue(student.status)}</dd>
          </div>
          <div>
            <dt>Medical information</dt>
            <dd>
              {displayValue(
                student.medical_information ?? student.medicalInformation,
              )}
            </dd>
          </div>
          <div>
            <dt>Special circumstances</dt>
            <dd>
              {displayValue(
                student.special_circumstances ?? student.specialCircumstances,
              )}
            </dd>
          </div>
        </dl>

        {student.can_delete === false && (
          <p className="crm-history-hint">
            This student has protected history. Deactivate to stop current work
            and reactivate when they return.
          </p>
        )}

        <div className="students-form__actions">
          {onToggleActive && (
            <button
              className="students-primary-button"
              type="button"
              onClick={onToggleActive}
            >
              {student.is_active ? "Deactivate" : "Reactivate"}
            </button>
          )}

          {onDelete && (
            <button
              className="students-secondary-button"
              type="button"
              onClick={onDelete}
              disabled={student.can_delete === false}
            >
              Delete permanently
            </button>
          )}

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

function StudentFormDialog({ student, guardians, subjects, onClose, onSave }) {
  const [formData, setFormData] = useState(() => ({
    firstName: student?.firstName ?? "",
    lastName: student?.lastName ?? "",
    date_of_birth: student?.date_of_birth ?? student?.dateOfBirth ?? "",
    school: student?.school ?? "",
    level: student?.level ?? "",
    subject: student?.subject_id ? String(student.subject_id) : "",
    email: student?.email ?? "",
    phone: student?.phone ?? student?.mobilePhone ?? "",
    guardian: student?.guardianId ?? "",
    relationship: student?.relationship ?? "Guardian",
    permissionToTravelAlone: permissionChoice(student?.permissionToTravelAlone),
    medical_information:
      student?.medical_information ?? student?.medicalInformation ?? "",
    special_circumstances:
      student?.special_circumstances ?? student?.specialCircumstances ?? "",
    status: student?.status ?? "Active",
  }));

  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);

    try {
      await onSave(formData);
    } catch (requestError) {
      notify.error(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="students-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="students-dialog students-dialog--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-form-title"
      >
        <div className="students-dialog__heading">
          <div>
            <h2 id="student-form-title">
              {student ? "Edit student" : "Add student"}
            </h2>
          </div>
        </div>

        <form className="students-form" onSubmit={handleSubmit}>
          <section className="students-form__section">
            <h3>Student information</h3>

            <div className="students-form__grid">
              <label>
                First name
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Last name
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Date of birth
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                School
                <input
                  name="school"
                  value={formData.school}
                  onChange={handleChange}
                />
              </label>

              <label>
                Year level
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a level</option>
                  {[
                    "Year 7",
                    "Year 8",
                    "Year 9",
                    "Year 10",
                    "Year 11",
                    "Year 12",
                  ].map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
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
                  {subjects
                    .filter(
                      (item) =>
                        item.is_active || item.id === student?.subject_id,
                    )
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                        {!item.is_active ? " (archived)" : ""}
                      </option>
                    ))}
                </select>
              </label>
            </div>
          </section>

          <section className="students-form__section">
            <h3>Contact and guardian</h3>

            <div className="students-form__grid">
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </label>

              <label>
                Phone
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </label>

              <label>
                Primary guardian
                <select
                  name="guardian"
                  value={formData.guardian}
                  onChange={handleChange}
                >
                  <option value="">No primary guardian selected</option>
                  {guardians.map((guardian) => (
                    <option key={guardian.id} value={guardian.id}>
                      {guardian.first_name} {guardian.last_name}
                      {guardian.phone ? ` (${guardian.phone})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Relationship
                <input
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleChange}
                />
              </label>
            </div>
          </section>

          <section className="students-form__section">
            <h3>Other information</h3>

            <div className="students-form__grid">
              <label>
                Permission to travel alone
                <select
                  name="permissionToTravelAlone"
                  value={formData.permissionToTravelAlone}
                  onChange={handleChange}
                  required
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </label>

              <label>
                Status
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>

              <label>
                Medical information
                <textarea
                  name="medical_information"
                  value={formData.medical_information}
                  onChange={handleChange}
                  rows="3"
                />
              </label>

              <label>
                Special circumstances
                <textarea
                  name="special_circumstances"
                  value={formData.special_circumstances}
                  onChange={handleChange}
                  rows="3"
                />
              </label>
            </div>
          </section>

          <div className="students-form__actions">
            <button
              className="students-secondary-button"
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              className="students-primary-button"
              type="submit"
              disabled={saving}
            >
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
  const subjectRecords = useRecords("/courses/");
  const { user } = useAuth();

  const students = useMemo(
    () => (Array.isArray(records.data) ? records.data : []).map(studentRecord),
    [records.data],
  );

  const guardians = Array.isArray(guardianRecords.data)
    ? guardianRecords.data
    : [];

  const canManage = Boolean(user?.can_manage);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All levels");
  const [roomFilter, setRoomFilter] = useState("All rooms");
  const [subjectFilter, setSubjectFilter] = useState("All subjects");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const fullName =
        `${student.firstName ?? ""} ${student.lastName ?? ""}`.toLowerCase();
      const studentId = String(
        student.studentId ?? student.id ?? "",
      ).toLowerCase();
      const email = String(student.email ?? "").toLowerCase();
      const phone = String(
        student.mobilePhone ?? student.phone ?? "",
      ).toLowerCase();

      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        studentId.includes(query) ||
        email.includes(query) ||
        phone.includes(query);

      const matchesLevel =
        levelFilter === "All levels" || student.level === levelFilter;
      const matchesRoom =
        roomFilter === "All rooms" || student.room === roomFilter;
      const matchesSubject =
        subjectFilter === "All subjects" || student.subject === subjectFilter;

      return (
        matchesSearch &&
        matchesLevel &&
        matchesRoom &&
        matchesSubject &&
        (statusFilter === "all" ||
          student.is_active === (statusFilter === "active"))
      );
    });
  }, [students, search, levelFilter, roomFilter, subjectFilter, statusFilter]);

  const levelOptions = useMemo(
    () =>
      [
        ...new Set(students.map((student) => student.level).filter(Boolean)),
      ].sort(),
    [students],
  );

  const roomOptions = useMemo(
    () =>
      [
        ...new Set(students.map((student) => student.room).filter(Boolean)),
      ].sort(),
    [students],
  );

  const subjectOptions = useMemo(
    () =>
      [
        ...new Set([
          ...subjectRecords.data.map((item) => item.name),
          ...students.map((item) => item.subject).filter(Boolean),
        ]),
      ].sort(),
    [subjectRecords.data, students],
  );

  const pagination = usePagination(
    filteredStudents,
    JSON.stringify([
      search,
      levelFilter,
      roomFilter,
      subjectFilter,
      statusFilter,
    ]),
  );

  async function toggleStudentActive() {
    const action = selectedStudent.is_active ? "deactivate" : "reactivate";

    if (
      !window.confirm(
        `${
          action === "deactivate" ? "Deactivate" : "Reactivate"
        } ${selectedStudent.firstName} ${
          selectedStudent.lastName
        }? Attendance, enrolments and progress notes will be kept.`,
      )
    ) {
      return;
    }

    try {
      await api.post(`/students/${selectedStudent.apiId}/${action}/`);
      records.refresh();
      setSelectedStudent(null);

      notify.success(
        action === "deactivate"
          ? "Student deactivated. History retained."
          : "Student reactivated. Existing enrolments and history retained.",
      );
    } catch (requestError) {
      notify.error(errorMessage(requestError));
    }
  }

  async function handleSaveStudent(formData) {
    const payload = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      date_of_birth: formData.date_of_birth,
      school: formData.school.trim(),
      year_level: formData.level,
      subject_id: formData.subject ? Number(formData.subject) : null,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      medical_information: formData.medical_information.trim(),
      special_circumstances: formData.special_circumstances.trim(),
      permission_to_travel_alone: formData.permissionToTravelAlone === "Yes",
      is_active: formData.status === "Active",
      guardian_id: formData.guardian ? Number(formData.guardian) : null,
      guardian_relationship: formData.relationship.trim(),
    };

    if (editingStudent) {
      const apiId = editingStudent.apiId ?? editingStudent.id;

      if (apiId === null || apiId === undefined) {
        throw new Error("Could not determine the student ID for this update.");
      }

      await api.patch(`/students/${apiId}/`, payload);
    } else {
      await api.post("/students/", payload);
    }

    await records.refresh();
    setShowForm(false);
    setEditingStudent(null);

    notify.success(
      editingStudent
        ? "Student updated successfully."
        : "Student added successfully.",
    );
  }

  async function handleDeleteStudent() {
    if (!selectedStudent) return;

    const apiId = selectedStudent.apiId ?? selectedStudent.id;

    if (apiId === null || apiId === undefined) {
      notify.error("Could not determine the student ID for deletion.");
      return;
    }

    const confirmed = window.confirm(
      `Permanently delete the unused student ${selectedStudent.firstName} ${selectedStudent.lastName}? This cannot be undone. Use Deactivate to retain their history.`,
    );

    if (!confirmed) return;

    try {
      await api.delete(`/students/${apiId}/`);
      setSelectedStudent(null);
      await records.refresh();
      notify.success("Unused student permanently deleted.");
    } catch (requestError) {
      notify.error(errorMessage(requestError));
    }
  }

  function openEditForm(student) {
    setSelectedStudent(null);
    setEditingStudent(student);
    setShowForm(true);
  }

  function openAddForm() {
    setEditingStudent(null);
    setShowForm(true);
  }

  return (
    <main className="students-page">
      <header className="students-page__heading">
        <div>
          <h1>Student Records</h1>
          <p className="students-page__description">
            View and manage student records.
          </p>
        </div>

        {canManage && (
          <button
            className="students-primary-button"
            type="button"
            onClick={openAddForm}
          >
            <span aria-hidden="true">+</span>
            Add student
          </button>
        )}
      </header>

      <RequestState
        loading={
          records.loading || guardianRecords.loading || subjectRecords.loading
        }
        error={records.error || guardianRecords.error || subjectRecords.error}
        onRetry={() => {
          records.refresh();
          guardianRecords.refresh();
          subjectRecords.refresh();
        }}
      />

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
              placeholder="Search by name, student ID, email or phone"
            />
          </label>

          <label className="students-filter">
            <span>Status</span>
            <select
              aria-label="Filter by student status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All students</option>
            </select>
          </label>

          <label className="students-filter">
            <span>Level</span>
            <select
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
              aria-label="Filter by level"
            >
              <option>All levels</option>
              {levelOptions.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
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
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </label>

          {roomOptions.length > 0 && (
            <label className="students-filter">
              <span>Room</span>
              <select
                value={roomFilter}
                onChange={(event) => setRoomFilter(event.target.value)}
                aria-label="Filter by room"
              >
                <option>All rooms</option>
                {roomOptions.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="students-results" aria-live="polite">
          <span>
            <strong>{filteredStudents.length}</strong>{" "}
            {filteredStudents.length === 1
              ? "matching student"
              : "matching students"}
          </span>
        </div>

        {filteredStudents.length > 0 ? (
          <>
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
                    <th scope="col">Phone</th>
                    <th scope="col">Email</th>
                    <th scope="col" className="student-row-action">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {pagination.rows.map((student) => (
                    <tr key={student.apiId ?? student.id}>
                      <td className="student-id">
                        {displayValue(student.studentId ?? student.id)}
                      </td>
                      <td>
                        <span className="student-name">
                          {student.firstName} {student.lastName}
                        </span>
                      </td>
                      <td>{displayValue(student.level)}</td>
                      <td>{displayValue(student.subject)}</td>
                      <td>
                        {displayValue(student.mobilePhone ?? student.phone)}
                      </td>
                      <td>{displayValue(student.email)}</td>
                      <td className="student-row-action">
                        <div className="students-row-actions">
                          <button
                            className="students-view-button"
                            type="button"
                            onClick={() => setSelectedStudent(student)}
                            aria-label={`View ${student.firstName} ${student.lastName}`}
                          >
                            View
                          </button>

                          {canManage && (
                            <button
                              className="students-edit-button"
                              type="button"
                              onClick={() => openEditForm(student)}
                              aria-label={`Edit ${student.firstName} ${student.lastName}`}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="students-pagination">
              <Pagination
                {...pagination}
                label="Student table pages"
                itemLabel="students"
              />
            </div>
          </>
        ) : (
          <div className="students-empty-state">
            <h2>No students found</h2>
            <p>Try changing your search or filters.</p>
          </div>
        )}
      </section>

      {showForm && canManage && (
        <StudentFormDialog
          student={editingStudent}
          guardians={guardians}
          subjects={subjectRecords.data}
          onClose={() => {
            setShowForm(false);
            setEditingStudent(null);
          }}
          onSave={handleSaveStudent}
        />
      )}

      {selectedStudent && (
        <StudentDetailsDialog
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onEdit={canManage ? () => openEditForm(selectedStudent) : null}
          onDelete={canManage ? handleDeleteStudent : null}
          onToggleActive={canManage ? toggleStudentActive : null}
        />
      )}
    </main>
  );
}
