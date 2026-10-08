import { useMemo, useState } from "react";
import "./Students.css";

// Sample records for the front-end prototype. Replace these with API data later.
const initialStudents = [
  {
    id: "record-1001",
    studentId: "ASP-1001",
    firstName: "Ava",
    lastName: "Thompson",
    email: "ava.thompson@example.com",
    level: "Year 7",
    room: "Room 1",
    dateOfBirth: "2013-04-12",
    idNumber: "",
    homePhone: "",
    mobilePhone: "0400 000 101",
    address: "",
    city: "",
    stateProvince: "WA",
    postalCode: "",
    countryRegion: "Australia",
    webPage: "",
    notes: "",
    specialCircumstances: "",
    physicianName: "",
    physicianPhoneNumber: "",
    allergies: "",
    medications: "",
    insuranceCarrier: "",
    insuranceNumber: "",
    attachments: [],
  },
  {
    id: "record-1002",
    studentId: "ASP-1002",
    firstName: "Noah",
    lastName: "Williams",
    email: "noah.williams@example.com",
    level: "Year 8",
    room: "Room 2",
    dateOfBirth: "2012-08-03",
    idNumber: "",
    homePhone: "",
    mobilePhone: "0400 000 102",
    address: "",
    city: "",
    stateProvince: "WA",
    postalCode: "",
    countryRegion: "Australia",
    webPage: "",
    notes: "",
    specialCircumstances: "",
    physicianName: "",
    physicianPhoneNumber: "",
    allergies: "",
    medications: "",
    insuranceCarrier: "",
    insuranceNumber: "",
    attachments: [],
  },
  {
    id: "record-1003",
    studentId: "ASP-1003",
    firstName: "Mia",
    lastName: "Chen",
    email: "mia.chen@example.com",
    level: "Year 9",
    room: "Room 1",
    dateOfBirth: "2011-11-20",
    idNumber: "",
    homePhone: "",
    mobilePhone: "0400 000 103",
    address: "",
    city: "",
    stateProvince: "WA",
    postalCode: "",
    countryRegion: "Australia",
    webPage: "",
    notes: "",
    specialCircumstances: "",
    physicianName: "",
    physicianPhoneNumber: "",
    allergies: "",
    medications: "",
    insuranceCarrier: "",
    insuranceNumber: "",
    attachments: [],
  },
];

const studentFields = [
  { name: "studentId", label: "Student ID", required: true },
  { name: "firstName", label: "First name", required: true },
  { name: "lastName", label: "Last name", required: true },
  { name: "dateOfBirth", label: "Date of birth", type: "date" },
  { name: "idNumber", label: "ID number" },
  { name: "level", label: "Level" },
  { name: "room", label: "Room" },
  { name: "email", label: "Email", type: "email" },
  { name: "homePhone", label: "Home phone", type: "tel" },
  { name: "mobilePhone", label: "Mobile phone", type: "tel" },
  { name: "address", label: "Address" },
  { name: "city", label: "City" },
  { name: "stateProvince", label: "State/Province" },
  { name: "postalCode", label: "ZIP/Postal code" },
  { name: "countryRegion", label: "Country/Region" },
  { name: "webPage", label: "Web page", type: "url" },
  { name: "physicianName", label: "Physician name" },
  {
    name: "physicianPhoneNumber",
    label: "Physician phone number",
    type: "tel",
  },
  { name: "insuranceCarrier", label: "Insurance carrier" },
  { name: "insuranceNumber", label: "Insurance number" },
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

function Field({ field, value, onChange }) {
  return (
    <label>
      {field.label}
      <input
        autoComplete={field.autoComplete}
        type={field.type || "text"}
        name={field.name}
        value={value || ""}
        onChange={onChange}
        required={field.required}
      />
    </label>
  );
}

function Detail({ label, value }) {
  const displayValue = Array.isArray(value)
    ? value.length
      ? value.join(", ")
      : "Not recorded"
    : value || "Not recorded";

  return (
    <div>
      <dt>{label}</dt>
      <dd>{displayValue}</dd>
    </div>
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

        <h3 className="students-details__section-title">Student information</h3>
        <dl className="students-details">
          <Detail label="Student ID" value={student.studentId} />
          <Detail label="First name" value={student.firstName} />
          <Detail label="Last name" value={student.lastName} />
          <Detail label="Level" value={student.level} />
          <Detail label="Room" value={student.room} />
          <Detail label="Date of birth" value={student.dateOfBirth} />
          <Detail label="ID number" value={student.idNumber} />
        </dl>

        <h3 className="students-details__section-title">Contact and address</h3>
        <dl className="students-details">
          <Detail label="Email" value={student.email} />
          <Detail label="Home phone" value={student.homePhone} />
          <Detail label="Mobile phone" value={student.mobilePhone} />
          <Detail label="Address" value={student.address} />
          <Detail label="City" value={student.city} />
          <Detail label="State/Province" value={student.stateProvince} />
          <Detail label="ZIP/Postal code" value={student.postalCode} />
          <Detail label="Country/Region" value={student.countryRegion} />
          <Detail label="Web page" value={student.webPage} />
        </dl>

        <h3 className="students-details__section-title">Notes and support</h3>
        <dl className="students-details">
          <Detail label="Notes" value={student.notes} />
          <Detail
            label="Special circumstances"
            value={student.specialCircumstances}
          />
        </dl>

        <h3 className="students-details__section-title">
          Health and insurance
        </h3>
        <dl className="students-details">
          <Detail label="Physician name" value={student.physicianName} />
          <Detail
            label="Physician phone number"
            value={student.physicianPhoneNumber}
          />
          <Detail label="Allergies" value={student.allergies} />
          <Detail label="Medications" value={student.medications} />
          <Detail label="Insurance carrier" value={student.insuranceCarrier} />
          <Detail label="Insurance number" value={student.insuranceNumber} />
          <Detail label="Attachments" value={student.attachments} />
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

function StudentFormDialog({ student, onClose, onSave }) {
  const isEditing = Boolean(student);
  const [formData, setFormData] = useState(() => ({
    studentId: student?.studentId ?? "",
    firstName: student?.firstName ?? "",
    lastName: student?.lastName ?? "",
    email: student?.email ?? "",
    level: student?.level ?? "",
    room: student?.room ?? "",
    dateOfBirth: student?.dateOfBirth ?? "",
    idNumber: student?.idNumber ?? "",
    homePhone: student?.homePhone ?? "",
    mobilePhone: student?.mobilePhone ?? "",
    address: student?.address ?? "",
    city: student?.city ?? "",
    stateProvince: student?.stateProvince ?? "",
    postalCode: student?.postalCode ?? "",
    countryRegion: student?.countryRegion ?? "",
    webPage: student?.webPage ?? "",
    notes: student?.notes ?? "",
    specialCircumstances: student?.specialCircumstances ?? "",
    physicianName: student?.physicianName ?? "",
    physicianPhoneNumber: student?.physicianPhoneNumber ?? "",
    allergies: student?.allergies ?? "",
    medications: student?.medications ?? "",
    insuranceCarrier: student?.insuranceCarrier ?? "",
    insuranceNumber: student?.insuranceNumber ?? "",
    attachments: student?.attachments ?? [],
  }));

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleAttachmentChange(event) {
    const selectedNames = Array.from(event.target.files || []).map(
      (file) => file.name,
    );
    setFormData((current) => ({
      ...current,
      attachments: [...current.attachments, ...selectedNames],
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave({
      ...formData,
      id: student?.id ?? `record-${Date.now()}`,
    });
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
            <p className="students-page__eyebrow">Student records</p>
            <h2 id="student-form-title">
              {isEditing ? "Edit student" : "Add student"}
            </h2>
          </div>
          <button
            className="students-icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close student form"
          >
            <CloseIcon />
          </button>
        </div>

        <form className="students-form" onSubmit={handleSubmit}>
          <section className="students-form__section">
            <h3>Student information</h3>
            <div className="students-form__grid">
              {studentFields.slice(0, 7).map((field) => (
                <Field
                  key={field.name}
                  field={field}
                  value={formData[field.name]}
                  onChange={handleChange}
                />
              ))}
            </div>
          </section>

          <section className="students-form__section">
            <h3>Contact and address</h3>
            <div className="students-form__grid">
              {studentFields.slice(7, 16).map((field) => (
                <Field
                  key={field.name}
                  field={field}
                  value={formData[field.name]}
                  onChange={handleChange}
                />
              ))}
            </div>
          </section>

          <section className="students-form__section">
            <h3>Notes and support</h3>
            <label>
              Notes
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
              />
            </label>
            <label>
              Special circumstances
              <textarea
                name="specialCircumstances"
                value={formData.specialCircumstances}
                onChange={handleChange}
                rows="3"
              />
            </label>
          </section>

          <section className="students-form__section">
            <h3>Health and insurance</h3>
            <div className="students-form__grid">
              {studentFields.slice(16).map((field) => (
                <Field
                  key={field.name}
                  field={field}
                  value={formData[field.name]}
                  onChange={handleChange}
                />
              ))}
              <label>
                Allergies
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  rows="2"
                />
              </label>
              <label>
                Medications
                <textarea
                  name="medications"
                  value={formData.medications}
                  onChange={handleChange}
                  rows="2"
                />
              </label>
            </div>
          </section>

          <section className="students-form__section">
            <h3>Attachments</h3>
            <label>
              Add files
              <input type="file" multiple onChange={handleAttachmentChange} />
            </label>
            <p className="students-form__note">
              {formData.attachments.length
                ? `Selected: ${formData.attachments.join(", ")}`
                : "No files selected. This prototype stores file names only; backend file storage is not connected."}
            </p>
          </section>

          <p className="students-form__note">
            This prototype stores records in page state only. Changes will be
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
              {isEditing ? "Save changes" : "Add student"}
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
  const [roomFilter, setRoomFilter] = useState("All rooms");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        student.studentId.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.mobilePhone.toLowerCase().includes(query);
      const matchesLevel =
        levelFilter === "All levels" || student.level === levelFilter;
      const matchesRoom =
        roomFilter === "All rooms" || student.room === roomFilter;

      return matchesSearch && matchesLevel && matchesRoom;
    });
  }, [students, search, levelFilter, roomFilter]);

  const roomOptions = useMemo(
    () =>
      [
        ...new Set(students.map((student) => student.room).filter(Boolean)),
      ].sort(),
    [students],
  );

  function handleAddStudent(student) {
    setStudents((current) => [student, ...current]);
    setShowAddDialog(false);
  }

  function handleUpdateStudent(updatedStudent) {
    setStudents((current) =>
      current.map((student) =>
        student.id === updatedStudent.id ? updatedStudent : student,
      ),
    );
    setEditingStudent(null);
    setSelectedStudent(null);
  }

  function openEditDialog(student) {
    setSelectedStudent(null);
    setEditingStudent(student);
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
              placeholder="Search by name, student ID, email or mobile"
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
                  <th scope="col">Room</th>
                  <th scope="col">Mobile phone</th>
                  <th scope="col">Email</th>
                  <th scope="col" className="student-row-action">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="student-id">{student.studentId}</td>
                    <td>
                      <span className="student-name">
                        {student.firstName} {student.lastName}
                      </span>
                    </td>
                    <td>{student.level || "Not recorded"}</td>
                    <td>{student.room || "Not recorded"}</td>
                    <td>{student.mobilePhone || "Not recorded"}</td>
                    <td>{student.email || "Not recorded"}</td>
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
                        <button
                          className="students-view-button"
                          type="button"
                          onClick={() => openEditDialog(student)}
                          aria-label={`Edit ${student.firstName} ${student.lastName}`}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="students-empty-state">
            <h2>No students found</h2>
            <p>Try changing your search or level filter.</p>
          </div>
        )}
      </section>

      {showAddDialog && (
        <StudentFormDialog
          onClose={() => setShowAddDialog(false)}
          onSave={handleAddStudent}
        />
      )}

      {editingStudent && (
        <StudentFormDialog
          key={editingStudent.id}
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSave={handleUpdateStudent}
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
