import { useMemo, useState } from "react";
import "./Guardians.css";
import api from "../api/client";
import { errorMessage, guardianRecord } from "../api/crm";
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

function GuardianDetailsDialog({ guardian, onClose, onEdit, onDelete }) {
  if (!guardian) return null;

  return (
    <div
      className="guardians-dialog-backdrop"
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
          <div>
            <dt>Relationship</dt>
            <dd>{guardian.relationship || "Not recorded"}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>
              {guardian.phone ? (
                <a href={`tel:${guardian.phone.replace(/[^\d+]/g, "")}`}>
                  {guardian.phone}
                </a>
              ) : (
                "Not recorded"
              )}
            </dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              {guardian.email ? (
                <a href={`mailto:${guardian.email}`}>{guardian.email}</a>
              ) : (
                "Not recorded"
              )}
            </dd>
          </div>
          <div>
            <dt>Linked student(s)</dt>
            <dd>
              {guardian.studentNames.length
                ? guardian.studentNames.join(", ")
                : "No students linked"}
            </dd>
          </div>
        </dl>

        <div className="guardians-form__actions">
          {onEdit && <button className="guardians-secondary-button" type="button" onClick={onEdit}>Edit</button>}
          {onDelete && <button className="guardians-secondary-button" type="button" onClick={onDelete}>Delete</button>}
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
  const [formData, setFormData] = useState({
    firstName: guardian?.firstName || "",
    lastName: guardian?.lastName || "",
    relationship: guardian?.students[0]?.relationship || "Guardian",
    phone: guardian?.phone || "",
    email: guardian?.email || "",
    studentIds: guardian?.studentIds || [],
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [linkFlags, setLinkFlags] = useState(Object.fromEntries((guardian?.students || []).map((link) => [link.student, link])));

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
    try { await onAdd({ ...formData, linkFlags }); }
    catch (requestError) { setError(errorMessage(requestError)); }
    finally { setSaving(false); }
  }

  return (
    <div
      className="guardians-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="guardians-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-guardian-title"
      >
        <div className="guardians-dialog__heading">
          <div>
            <p className="guardians-dialog__eyebrow">Guardian records</p>
            <h2 id="add-guardian-title">{guardian ? "Edit guardian" : "Add guardian"}</h2>
          </div>

          <button
            className="guardians-icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close add guardian form"
          >
            <CloseIcon />
          </button>
        </div>

        <form className="guardians-form" onSubmit={handleSubmit}>
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

          <label>
            Relationship to student
            <input
              name="relationship"
              value={formData.relationship}
              onChange={handleChange}
              placeholder="For example, mother or father"
              required
            />
          </label>

          <div className="guardians-form__row">
            <label>
              Phone
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                autoComplete="tel"
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                autoComplete="email"
              />
            </label>
          </div>

          <fieldset className="guardians-student-fieldset">
            <legend>Link student(s)</legend>
            <p>Select every student connected to this guardian.</p>

            <div className="guardians-student-options">
              {students.map((student) => (
                <label key={student.id}>
                  <input
                    type="checkbox"
                    checked={formData.studentIds.includes(student.id)}
                    onChange={() => handleStudentToggle(student.id)}
                  />
                  <span>{student.first_name} {student.last_name} (ASP-{student.id})</span>
                </label>
              ))}
            </div>
            {students.filter((student) => formData.studentIds.includes(student.id)).map((student) => <div className="crm-inline-actions" key={`flags-${student.id}`}>
              <span>{student.first_name} {student.last_name}</span>
              <label><input type="checkbox" checked={linkFlags[student.id]?.is_primary_contact || false} onChange={(event) => setLinkFlags((current) => ({ ...current, [student.id]: { ...current[student.id], is_primary_contact: event.target.checked } }))} />Primary contact</label>
              <label><input type="checkbox" checked={linkFlags[student.id]?.is_emergency_contact ?? true} onChange={(event) => setLinkFlags((current) => ({ ...current, [student.id]: { ...current[student.id], is_emergency_contact: event.target.checked } }))} />Emergency contact</label>
            </div>)}
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
            <button className="guardians-primary-button" type="submit" disabled={saving}>
              {saving ? "Saving..." : guardian ? "Save changes" : "Add guardian"}
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
  const guardians = useMemo(() => records.data.map(guardianRecord), [records.data]);
  const { user } = useAuth();
  const canManage = user?.can_manage;
  const [editingGuardian, setEditingGuardian] = useState(null);
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState(null);

  const filteredGuardians = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return guardians;

    return guardians.filter((guardian) => {
      const fullName =
        `${guardian.firstName} ${guardian.lastName}`.toLowerCase();

      return (
        fullName.includes(query) ||
        guardian.phone.toLowerCase().includes(query) ||
        guardian.email.toLowerCase().includes(query) ||
        guardian.relationship.toLowerCase().includes(query) ||
        guardian.studentNames.some((studentName) =>
          studentName.toLowerCase().includes(query),
        )
      );
    });
  }, [guardians, search]);

  async function handleAddGuardian(guardian) {
    const data = { first_name: guardian.firstName, last_name: guardian.lastName, phone: guardian.phone, email: guardian.email,
      links: guardian.studentIds.map((student) => {
        const existing = guardian.linkFlags[student];
        return { student, relationship: guardian.relationship, is_primary_contact: existing?.is_primary_contact || false,
          is_emergency_contact: existing?.is_emergency_contact ?? true };
      }) };
    if (editingGuardian) await api.patch(`/guardians/${editingGuardian.id}/`, data);
    else await api.post("/guardians/", data);
    records.refresh();
    setShowAddDialog(false);
    setEditingGuardian(null);
  }

  async function deleteGuardian() {
    if (!window.confirm(`Delete ${selectedGuardian.firstName} ${selectedGuardian.lastName} and unlink their students?`)) return;
    try { await api.delete(`/guardians/${selectedGuardian.id}/`); setSelectedGuardian(null); records.refresh(); }
    catch (requestError) { setActionError(errorMessage(requestError)); }
  }

  return (
    <main className="guardians-page">
      <header className="guardians-page__heading">
        <div>
          <h1>Guardians</h1>
          <p className="guardians-page__description">
            View guardian contact details and linked students.
          </p>
        </div>

        {canManage && <button
          className="guardians-primary-button"
          type="button"
          onClick={() => { setEditingGuardian(null); setShowAddDialog(true); }}
        >
          <span aria-hidden="true">+</span>
          Add guardian
        </button>}
      </header>
      <RequestState loading={records.loading || studentRecords.loading} error={records.error || studentRecords.error} onRetry={() => { records.refresh(); studentRecords.refresh(); }} />
      {actionError && <p className="crm-message crm-message--error" role="alert">{actionError}</p>}

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
                  <th scope="col">Relationship</th>
                  <th scope="col">Linked student(s)</th>
                  <th scope="col">Phone</th>
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
                    <td>{guardian.relationship || "Not recorded"}</td>
                    <td className="guardian-students">
                      {guardian.studentNames.length
                        ? guardian.studentNames.join(", ")
                        : "No students linked"}
                    </td>
                    <td>
                      {guardian.phone ? (
                        <a
                          href={`tel:${guardian.phone.replace(/[^\d+]/g, "")}`}
                        >
                          {guardian.phone}
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
          students={studentRecords.data}
          guardian={editingGuardian}
        />
      )}

      {selectedGuardian && (
        <GuardianDetailsDialog
          guardian={selectedGuardian}
          onClose={() => setSelectedGuardian(null)}
          onEdit={canManage ? () => { setEditingGuardian(selectedGuardian); setSelectedGuardian(null); setShowAddDialog(true); } : null}
          onDelete={canManage ? deleteGuardian : null}
        />
      )}
    </main>
  );
}
