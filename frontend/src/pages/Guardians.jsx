import { useMemo, useState } from "react";

import "./Guardians.css";

import api from "../api/client";

import { errorMessage, guardianRecord } from "../api/crm";

import useRecords from "../hooks/useRecords";

import { useAuth } from "../context/AuthContext";

import RequestState from "../components/RequestState";

const emptyGuardian = {
  company: "",

  firstName: "",

  lastName: "",

  email: "",

  jobTitle: "",

  businessPhone: "",

  homePhone: "",

  mobilePhone: "",

  faxNumber: "",

  address: "",

  city: "",

  stateProvince: "",

  postalCode: "",

  countryRegion: "",

  webPage: "",

  notes: "",

  attachments: [],

  studentLinks: [],
};

function displayValue(value) {
  return value === null || value === undefined || value === ""
    ? "Not recorded"
    : value;
}

function phoneLink(value) {
  return `tel:${String(value).replace(/[^+\d]/g, "")}`;
}

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

function GuardianDetailsDialog({ guardian, onClose, onEdit, onDelete }) {
  if (!guardian) return null;

  const studentLinks = Array.isArray(guardian.studentLinks)
    ? guardian.studentLinks
    : [];

  const details = [
    ["Company", guardian.company],

    ["Job Title", guardian.jobTitle],

    ["Email Address", guardian.email],

    ["Business Phone", guardian.businessPhone],

    ["Home Phone", guardian.homePhone],

    ["Mobile Phone", guardian.mobilePhone],

    ["Fax Number", guardian.faxNumber],

    ["Address", guardian.address],

    ["City", guardian.city],

    ["State/Province", guardian.stateProvince],

    ["ZIP/Postal Code", guardian.postalCode],

    ["Country/Region", guardian.countryRegion],

    ["Web Page", guardian.webPage],
  ];

  return (
    <div
      className="guardians-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="guardians-dialog"
        style={{ maxHeight: "calc(100vh - 2rem)", overflowY: "auto" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guardian-details-title"
      >
        <div className="guardians-dialog__heading">
          <div>
            <p className="guardians-dialog__eyebrow">Guardian record</p>

            <h2 id="guardian-details-title">
              {guardian.firstName} {guardian.lastName}
            </h2>
          </div>

          <button
            className="guardians-icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close guardian details"
          >
            <CloseIcon />
          </button>
        </div>

        <dl className="guardians-details">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>

              <dd>
                {label === "Email Address" && value ? (
                  <a href={`mailto:${value}`}>{value}</a>
                ) : label.includes("Phone") && value ? (
                  <a href={phoneLink(value)}>{value}</a>
                ) : label === "Web Page" && value ? (
                  <a href={value} target="_blank" rel="noreferrer">
                    {value}
                  </a>
                ) : (
                  displayValue(value)
                )}
              </dd>
            </div>
          ))}
        </dl>

        <section className="guardians-details-section">
          <h3>Linked students</h3>

          {studentLinks.length ? (
            <ul>
              {studentLinks.map((link) => (
                <li key={link.id ?? link.studentId}>
                  <strong>{link.studentName}</strong> —{" "}
                  {displayValue(link.relationship)}
                  {link.emergencyContact && <span> · Emergency contact</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p>No students linked</p>
          )}
        </section>

        <section className="guardians-details-section">
          <h3>Notes</h3>

          <p className="guardians-notes">{displayValue(guardian.notes)}</p>
        </section>

        <section className="guardians-details-section">
          <h3>Attachments</h3>

          {guardian.attachments?.length ? (
            <ul>
              {guardian.attachments.map((name, index) => (
                <li key={`${name}-${index}`}>{name}</li>
              ))}
            </ul>
          ) : (
            <p>No attachments</p>
          )}
        </section>

        <div className="guardians-form__actions">
          {onEdit && (
            <button
              className="guardians-secondary-button"
              type="button"
              onClick={onEdit}
            >
              Edit
            </button>
          )}

          {onDelete && (
            <button
              className="guardians-secondary-button"
              type="button"
              onClick={onDelete}
            >
              Delete
            </button>
          )}

          <button
            className="guardians-secondary-button"
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

function AddGuardianDialog({ onClose, onAdd, students, guardian }) {
  const guardianStudentLinks = Array.isArray(guardian?.studentLinks)
    ? guardian.studentLinks
    : [];
  const [formData, setFormData] = useState(() => ({
    ...emptyGuardian,
    firstName: guardian?.firstName || "",
    lastName: guardian?.lastName || "",
    relationship: guardianStudentLinks[0]?.relationship || "Guardian",
    phone: guardian?.phone || guardian?.mobilePhone || "",
    email: guardian?.email || "",
    notes: guardian?.notes || "",
    studentIds: guardianStudentLinks
      .map((link) => link.studentId ?? link.student)
      .filter((id) => id !== undefined && id !== null),
  }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [linkFlags, setLinkFlags] = useState(() =>
    Object.fromEntries(
      guardianStudentLinks.map((link) => [
        link.studentId ?? link.student,
        link,
      ]),
    ),
  );

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleStudentToggle(studentId) {
    setError("");

    setFormData((current) => {
      const alreadySelected = current.studentIds.includes(studentId);

      return {
        ...current,

        studentIds: alreadySelected
          ? current.studentIds.filter((id) => id !== studentId)
          : [...current.studentIds, studentId],
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    setSaving(true);

    try {
      await onAdd({ ...formData, linkFlags });
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  const textFields = [
    ["company", "Company"],

    ["jobTitle", "Job Title"],

    ["email", "Email Address", "email"],

    ["businessPhone", "Business Phone", "tel"],

    ["homePhone", "Home Phone", "tel"],

    ["mobilePhone", "Mobile Phone", "tel"],

    ["faxNumber", "Fax Number", "tel"],

    ["address", "Address"],

    ["city", "City"],

    ["stateProvince", "State/Province"],

    ["postalCode", "ZIP/Postal Code"],

    ["countryRegion", "Country/Region"],

    ["webPage", "Web Page", "url"],
  ];

  return (
    <div
      className="guardians-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="guardians-dialog guardians-dialog--form"
        style={{ maxHeight: "calc(100vh - 2rem)", overflowY: "auto" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guardian-form-title"
      >
        <div className="guardians-dialog__heading">
          <div>
            <p className="guardians-dialog__eyebrow">Guardian records</p>

            <h2 id="add-guardian-title">
              {guardian ? "Edit guardian" : "Add guardian"}
            </h2>
          </div>

          <button
            className="guardians-icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close guardian form"
          >
            <CloseIcon />
          </button>
        </div>

        <form className="guardians-form" onSubmit={handleSubmit}>
          <h3>Guardian details</h3>

          <div className="guardians-form__row">
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

          <div className="guardians-form__row">
            {textFields.slice(0, 2).map(([name, label]) => (
              <label key={name}>
                {label}

                <input
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                />
              </label>
            ))}
          </div>

          <div className="guardians-form__row">
            {textFields.slice(2, 4).map(([name, label, type = "text"]) => (
              <label key={name}>
                {label}

                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  autoComplete={name === "email" ? "email" : undefined}
                />
              </label>
            ))}
          </div>

          <div className="guardians-form__row">
            {textFields.slice(4, 6).map(([name, label, type = "text"]) => (
              <label key={name}>
                {label}

                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                />
              </label>
            ))}
          </div>

          <div className="guardians-form__row">
            {textFields.slice(6, 8).map(([name, label, type = "text"]) => (
              <label key={name}>
                {label}

                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                />
              </label>
            ))}
          </div>

          <div className="guardians-form__row">
            {textFields.slice(8, 10).map(([name, label, type = "text"]) => (
              <label key={name}>
                {label}

                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                />
              </label>
            ))}
          </div>

          <div className="guardians-form__row">
            {textFields.slice(10).map(([name, label, type = "text"]) => (
              <label key={name}>
                {label}

                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                />
              </label>
            ))}
          </div>

          <label>
            Notes
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Add relevant notes"
            />
          </label>

          <p className="guardians-form__note">
            Guardian file uploads are not connected to the backend yet.
          </p>

          <fieldset className="guardians-student-fieldset">
            <legend>Student links</legend>

            <p>
              Choose the students linked to this guardian, then record the
              relationship and emergency-contact status for each student.
            </p>

            <div className="guardians-student-options">
              {students.map((student) => (
                <label key={student.id}>
                  <input
                    type="checkbox"
                    checked={formData.studentIds.includes(student.id)}
                    onChange={() => handleStudentToggle(student.id)}
                  />

                  <span>
                    {student.first_name} {student.last_name} (ASP-{student.id})
                  </span>
                </label>
              ))}
            </div>

            {students
              .filter((student) => formData.studentIds.includes(student.id))
              .map((student) => (
                <div className="crm-inline-actions" key={`flags-${student.id}`}>
                  <span>
                    {student.first_name} {student.last_name}
                  </span>

                  <label>
                    <input
                      type="checkbox"
                      checked={
                        linkFlags[student.id]?.is_primary_contact || false
                      }
                      onChange={(event) =>
                        setLinkFlags((current) => ({
                          ...current,
                          [student.id]: {
                            ...current[student.id],
                            is_primary_contact: event.target.checked,
                          },
                        }))
                      }
                    />
                    Primary contact
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      checked={
                        linkFlags[student.id]?.is_emergency_contact ?? true
                      }
                      onChange={(event) =>
                        setLinkFlags((current) => ({
                          ...current,
                          [student.id]: {
                            ...current[student.id],
                            is_emergency_contact: event.target.checked,
                          },
                        }))
                      }
                    />
                    Emergency contact
                  </label>
                </div>
              ))}
          </fieldset>

          {error && (
            <p className="guardians-form__error" role="alert">
              {error}
            </p>
          )}

          <div className="guardians-form__actions">
            <button
              className="guardians-secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="guardians-primary-button"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : guardian
                  ? "Save changes"
                  : "Add guardian"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function Guardians() {
  const records = useRecords("/guardians/");

  const studentRecords = useRecords("/students/");

  const guardians = useMemo(
    () =>
      (Array.isArray(records.data) ? records.data : []).map((record) => {
        const guardian = guardianRecord(record);
        return {
          ...guardian,
          studentLinks: Array.isArray(guardian.studentLinks)
            ? guardian.studentLinks
            : [],
          attachments: Array.isArray(guardian.attachments)
            ? guardian.attachments
            : [],
        };
      }),
    [records.data],
  );

  const { user } = useAuth();

  const canManage = user?.can_manage;

  const [showAddDialog, setShowAddDialog] = useState(false);

  const [editingGuardian, setEditingGuardian] = useState(null);

  const [actionError, setActionError] = useState("");

  const [search, setSearch] = useState("");

  const [selectedGuardian, setSelectedGuardian] = useState(null);
  const students = Array.isArray(studentRecords.data)
    ? studentRecords.data
    : [];

  const filteredGuardians = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return guardians;

    return guardians.filter((guardian) => {
      const searchableValues = [
        guardian.firstName,

        guardian.lastName,

        guardian.company,

        guardian.jobTitle,

        guardian.email,

        guardian.businessPhone,

        guardian.homePhone,

        guardian.mobilePhone,

        guardian.faxNumber,

        guardian.address,

        guardian.city,

        guardian.stateProvince,

        guardian.postalCode,

        guardian.countryRegion,

        guardian.webPage,

        guardian.notes,

        ...(Array.isArray(guardian.studentLinks)
          ? guardian.studentLinks
          : []
        ).flatMap((link) => [
          link.studentName,

          link.relationship,

          link.emergencyContact ? "emergency contact" : "",
        ]),
      ];

      return searchableValues.some((value) =>
        value?.toLowerCase().includes(query),
      );
    });
  }, [guardians, search]);

  function handleEditGuardian(guardian) {
    setActionError("");
    setSelectedGuardian(null);
    setEditingGuardian(guardian);
    setShowAddDialog(true);
  }

  async function handleAddGuardian(guardian) {
    const data = {
      first_name: guardian.firstName,
      last_name: guardian.lastName,
      phone: guardian.phone || guardian.mobilePhone,
      email: guardian.email,

      links: guardian.studentIds.map((student) => {
        const existing = guardian.linkFlags?.[student];

        return {
          student,
          relationship: guardian.relationship,
          is_primary_contact: existing?.is_primary_contact || false,

          is_emergency_contact: existing?.is_emergency_contact ?? true,
        };
      }),
    };

    if (editingGuardian)
      await api.patch(`/guardians/${editingGuardian.id}/`, data);
    else await api.post("/guardians/", data);

    records.refresh();

    setShowAddDialog(false);

    setEditingGuardian(null);
  }

  async function deleteGuardian() {
    if (
      !window.confirm(
        `Delete ${selectedGuardian.firstName} ${selectedGuardian.lastName} and unlink their students?`,
      )
    )
      return;

    try {
      await api.delete(`/guardians/${selectedGuardian.id}/`);
      setSelectedGuardian(null);
      records.refresh();
    } catch (requestError) {
      setActionError(errorMessage(requestError));
    }
  }

  return (
    <main className="guardians-page">
      <header className="guardians-page__heading">
        <div>
          <h1>Guardians</h1>

          <p className="guardians-page__description">
            View and manage guardian details and student links.
          </p>
        </div>

        {canManage && (
          <button
            className="guardians-primary-button"
            type="button"
            onClick={() => {
              setEditingGuardian(null);
              setShowAddDialog(true);
            }}
          >
            <span aria-hidden="true">+</span>
            Add guardian
          </button>
        )}
      </header>

      <RequestState
        loading={records.loading || studentRecords.loading}
        error={records.error || studentRecords.error}
        onRetry={() => {
          records.refresh();
          studentRecords.refresh();
        }}
      />

      {actionError && (
        <p className="crm-message crm-message--error" role="alert">
          {actionError}
        </p>
      )}

      <section className="guardians-panel" aria-label="Guardian records">
        <div className="guardians-toolbar">
          <label className="guardians-search">
            <span className="guardians-search__icon">
              <SearchIcon />
            </span>

            <span className="visually-hidden">Search guardians</span>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search guardian, student, phone or email"
            />
          </label>
        </div>

        <div className="guardians-results">
          <span>
            Showing <strong>{filteredGuardians.length}</strong> of{" "}
            <strong>{guardians.length}</strong> guardians
          </span>
        </div>

        {filteredGuardians.length > 0 ? (
          <div
            className="guardians-table-wrap"
            role="region"
            aria-label="Guardian list. Scroll horizontally to see all columns."
            tabIndex={0}
          >
            <table className="guardians-table">
              <thead>
                <tr>
                  <th scope="col">Guardian</th>

                  <th scope="col">Linked student(s)</th>

                  <th scope="col">Mobile phone</th>

                  <th scope="col">Email</th>

                  <th scope="col" className="guardian-row-action">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredGuardians.map((guardian) => (
                  <tr key={guardian.id}>
                    <td>
                      <span className="guardian-name">
                        {guardian.firstName} {guardian.lastName}
                      </span>
                    </td>

                    <td className="guardian-students">
                      {guardian.studentLinks.length
                        ? guardian.studentLinks

                            .map(
                              (link) =>
                                `${link.studentName} (${link.relationship || "Relationship not recorded"}${link.emergencyContact ? ", emergency contact" : ""})`,
                            )

                            .join("; ")
                        : "No students linked"}
                    </td>

                    <td>
                      {guardian.mobilePhone ? (
                        <a href={phoneLink(guardian.mobilePhone)}>
                          {guardian.mobilePhone}
                        </a>
                      ) : (
                        "Not recorded"
                      )}
                    </td>

                    <td>
                      {guardian.email ? (
                        <a href={`mailto:${guardian.email}`}>
                          {guardian.email}
                        </a>
                      ) : (
                        "Not recorded"
                      )}
                    </td>

                    <td className="guardian-row-action">
                      <button
                        className="guardians-view-button"
                        type="button"
                        onClick={() => setSelectedGuardian(guardian)}
                        aria-label={`View ${guardian.firstName} ${guardian.lastName}`}
                      >
                        View
                      </button>

                      <button
                        className="guardians-view-button"
                        type="button"
                        onClick={() => handleEditGuardian(guardian)}
                        aria-label={`Edit ${guardian.firstName} ${guardian.lastName}`}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="guardians-empty-state">
            <h2>No guardians found</h2>

            <p>Try another name, student, phone number or email address.</p>
          </div>
        )}
      </section>

      {showAddDialog && (
        <AddGuardianDialog
          onClose={() => setShowAddDialog(false)}
          onAdd={handleAddGuardian}
          students={students}
          guardian={editingGuardian}
        />
      )}

      {selectedGuardian && (
        <GuardianDetailsDialog
          guardian={selectedGuardian}
          onClose={() => setSelectedGuardian(null)}
          onEdit={
            canManage
              ? () => {
                  setEditingGuardian(selectedGuardian);
                  setSelectedGuardian(null);
                  setShowAddDialog(true);
                }
              : null
          }
          onDelete={canManage ? deleteGuardian : null}
        />
      )}
    </main>
  );
}
