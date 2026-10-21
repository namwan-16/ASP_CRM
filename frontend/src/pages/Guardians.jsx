import { useMemo, useState } from "react";
import "./Guardians.css";
import api from "../api/client";
import { errorMessage, guardianRecord } from "../api/crm";
import useRecords from "../hooks/useRecords";
import { useAuth } from "../context/AuthContext";
import RequestState from "../components/RequestState";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { notify } from "../utils/notifications";
import ConfirmDialog from "../components/ConfirmDialog";

const emptyGuardian = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  studentIds: [],
};

function displayValue(value) {
  return value === null || value === undefined || value === ""
    ? "Not recorded"
    : value;
}

function tableValue(value) {
  return value === null || value === undefined || String(value).trim() === ""
    ? "—"
    : value;
}

function phoneLink(value) {
  return `tel:${String(value).replace(/[^+\d]/g, "")}`;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

function GuardianDetailsDialog({ guardian, onClose, onDelete }) {
  if (!guardian) return null;

  const studentLinks = Array.isArray(guardian.studentLinks)
    ? guardian.studentLinks
    : [];

  const details = [
    ["Email Address", guardian.email],
    ["Mobile Phone", guardian.mobilePhone],
  ];

  return (
    <div
      className="guardians-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="guardians-dialog"
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
        </div>

        <dl className="guardians-details">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                {label === "Email Address" && value ? (
                  <a href={`mailto:${value}`}>{value}</a>
                ) : label === "Mobile Phone" && value ? (
                  <a href={phoneLink(value)}>{value}</a>
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

        {studentLinks.length > 0 && (
          <p className="crm-history-hint">
            To remove a contact for one student, edit the student links. A
            linked guardian cannot be permanently deleted.
          </p>
        )}

        <div className="guardians-form__actions">
          {onDelete && (
            <button
              className="guardians-secondary-button"
              type="button"
              onClick={onDelete}
              disabled={
                guardian.can_delete === false || studentLinks.length > 0
              }
            >
              Delete permanently
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
    phone: guardian?.phone || guardian?.mobilePhone || "",
    email: guardian?.email || "",
    studentIds: guardianStudentLinks
      .map((link) => link.studentId ?? link.student)
      .filter((id) => id !== undefined && id !== null),
  }));

  const [saving, setSaving] = useState(false);
  const [pendingLinkRemoval, setPendingLinkRemoval] = useState(null);

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

  async function saveGuardian(payload) {
    setSaving(true);

    try {
      await onAdd(payload);
      setPendingLinkRemoval(null);
    } catch (requestError) {
      notify.error(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = { ...formData, linkFlags };
    const removed = guardianStudentLinks.filter((link) => {
      const linkedStudentId = link.studentId ?? link.student;
      return !formData.studentIds.includes(linkedStudentId);
    });

    if (removed.length) {
      setPendingLinkRemoval({ links: removed, payload });
      return;
    }

    await saveGuardian(payload);
  }

  const textFields = [
    ["email", "Email address", "email"],
    ["phone", "Phone number", "tel"],
  ];

  const removedStudentNames =
    pendingLinkRemoval?.links
      .map((link) => link.studentName)
      .filter(Boolean)
      .join(", ") || "the selected students";

  return (
    <>
      <div
        className="guardians-dialog-backdrop"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) onClose();
        }}
      >
        <section
          className="guardians-dialog guardians-dialog--form"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guardian-form-title"
        >
          <div className="guardians-dialog__heading">
            <div>
              <p className="guardians-dialog__eyebrow">Guardian records</p>
              <h2 id="guardian-form-title">
                {guardian ? "Edit guardian" : "Add guardian"}
              </h2>
            </div>
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
                  autoComplete="family-name"
                  required
                />
              </label>
            </div>

            <div className="guardians-form__row">
              {textFields.map(([name, label, type]) => (
                <label key={name}>
                  {label}
                  <input
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    required={name === "phone"}
                  />
                </label>
              ))}
            </div>

            <fieldset className="guardians-student-fieldset">
              <legend>Student links</legend>
              <p>
                Choose the students linked to this guardian, then record the
                relationship and emergency-contact status for each student.
              </p>

              <div className="guardians-student-options">
                {students.map((student) => {
                  const selected = formData.studentIds.includes(student.id);

                  return (
                    <div
                      className={`guardians-student-option${
                        selected ? " guardians-student-option--selected" : ""
                      }`}
                      key={student.id}
                    >
                      <label className="guardians-student-option__choice">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => handleStudentToggle(student.id)}
                        />
                        <span>
                          {student.first_name} {student.last_name} (ASP-
                          {student.id})
                        </span>
                      </label>

                      {selected && (
                        <div className="guardians-student-link-fields">
                          <label>
                            Relationship
                            <input
                              value={
                                linkFlags[student.id]?.relationship ??
                                "Guardian"
                              }
                              required
                              maxLength={50}
                              onChange={(event) =>
                                setLinkFlags((current) => ({
                                  ...current,
                                  [student.id]: {
                                    ...current[student.id],
                                    relationship: event.target.value,
                                  },
                                }))
                              }
                            />
                          </label>

                          <label className="guardians-emergency-checkbox">
                            <input
                              type="checkbox"
                              checked={
                                linkFlags[student.id]?.is_primary_contact ||
                                false
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
                            <span>Primary contact</span>
                          </label>

                          <label className="guardians-emergency-checkbox">
                            <input
                              type="checkbox"
                              checked={
                                linkFlags[student.id]?.is_emergency_contact ??
                                true
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
                            <span>Emergency contact</span>
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <div className="guardians-form__actions">
              <button
                className="guardians-secondary-button"
                type="button"
                onClick={onClose}
                disabled={saving}
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

      <ConfirmDialog
        open={Boolean(pendingLinkRemoval)}
        title="Remove student links?"
        message={`Remove this guardian’s contact links for ${removedStudentNames}? Other student links and the guardian record will be kept.`}
        confirmLabel="Remove links and save"
        cancelLabel="Cancel"
        variant="danger"
        busy={saving}
        onConfirm={() => {
          if (pendingLinkRemoval) {
            saveGuardian(pendingLinkRemoval.payload);
          }
        }}
        onCancel={() => {
          if (!saving) setPendingLinkRemoval(null);
        }}
      />
    </>
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
  const [search, setSearch] = useState("");
  const [selectedGuardian, setSelectedGuardian] = useState(null);
  const [guardianToDelete, setGuardianToDelete] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

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
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      );
    });
  }, [guardians, search]);

  const pagination = usePagination(filteredGuardians, search);

  function handleEditGuardian(guardian) {
    setSelectedGuardian(null);
    setEditingGuardian(guardian);
    setShowAddDialog(true);
  }

  async function handleAddGuardian(guardian) {
    const data = {
      first_name: guardian.firstName.trim(),
      last_name: guardian.lastName.trim(),
      phone: guardian.phone.trim(),
      email: guardian.email.trim(),
      links: guardian.studentIds.map((student) => {
        const existing = guardian.linkFlags?.[student];

        return {
          student,
          relationship: existing?.relationship?.trim() || "Guardian",
          is_primary_contact: existing?.is_primary_contact || false,
          is_emergency_contact: existing?.is_emergency_contact ?? true,
        };
      }),
    };

    if (editingGuardian) {
      await api.patch(`/guardians/${editingGuardian.id}/`, data);
    } else {
      await api.post("/guardians/", data);
    }

    records.refresh();
    studentRecords.refresh();

    notify.success(
      editingGuardian
        ? "Guardian details and student links updated."
        : "Guardian added.",
    );

    setShowAddDialog(false);
    setEditingGuardian(null);
  }

  function requestGuardianDelete() {
    if (!selectedGuardian) return;

    setGuardianToDelete(selectedGuardian);
  }

  async function deleteGuardian() {
    if (!guardianToDelete) return;

    setDeleteBusy(true);

    try {
      await api.delete(`/guardians/${guardianToDelete.id}/`);
      setSelectedGuardian(null);
      setGuardianToDelete(null);
      records.refresh();
      notify.success("Unused guardian permanently deleted.");
    } catch (requestError) {
      notify.error(errorMessage(requestError));
    } finally {
      setDeleteBusy(false);
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
                  <th scope="col">Email address</th>
                  <th scope="col" className="guardian-row-action">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {pagination.rows.map((guardian) => (
                  <tr key={guardian.id}>
                    <td>
                      <span className="guardian-name">
                        {guardian.firstName} {guardian.lastName}
                      </span>
                    </td>

                    <td className="guardian-students">
                      {guardian.studentLinks.length ? (
                        <ul className="guardian-student-list">
                          {guardian.studentLinks.map((link) => (
                            <li
                              key={
                                link.id ??
                                link.studentId ??
                                link.student ??
                                link.studentName
                              }
                            >
                              {link.studentName || "Unnamed student"}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="guardian-students__empty">
                          No students linked
                        </span>
                      )}
                    </td>

                    <td>
                      {guardian.mobilePhone ? (
                        <a href={phoneLink(guardian.mobilePhone)}>
                          {guardian.mobilePhone}
                        </a>
                      ) : (
                        tableValue(guardian.mobilePhone)
                      )}
                    </td>

                    <td>
                      {guardian.email ? (
                        <a href={`mailto:${guardian.email}`}>
                          {guardian.email}
                        </a>
                      ) : (
                        tableValue(guardian.email)
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

                      {canManage && (
                        <button
                          className="guardians-view-button"
                          type="button"
                          onClick={() => handleEditGuardian(guardian)}
                          aria-label={`Edit ${guardian.firstName} ${guardian.lastName}`}
                        >
                          Edit
                        </button>
                      )}
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

        <Pagination {...pagination} label="Guardian table pages" />
      </section>

      {showAddDialog && (
        <AddGuardianDialog
          onClose={() => {
            setShowAddDialog(false);
            setEditingGuardian(null);
          }}
          onAdd={handleAddGuardian}
          students={students}
          guardian={editingGuardian}
        />
      )}

      {selectedGuardian && (
        <GuardianDetailsDialog
          guardian={selectedGuardian}
          onClose={() => setSelectedGuardian(null)}
          onDelete={canManage ? requestGuardianDelete : null}
        />
      )}

      <ConfirmDialog
        open={Boolean(guardianToDelete)}
        title="Delete guardian permanently?"
        message={
          guardianToDelete
            ? `Permanently delete the unused guardian ${guardianToDelete.firstName} ${guardianToDelete.lastName}? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete permanently"
        cancelLabel="Cancel"
        variant="danger"
        busy={deleteBusy}
        onConfirm={deleteGuardian}
        onCancel={() => {
          if (!deleteBusy) setGuardianToDelete(null);
        }}
      />
    </main>
  );
}
