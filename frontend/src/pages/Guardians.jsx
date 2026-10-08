import { useMemo, useState } from "react";
import "./Guardians.css";

const studentOptions = [
  "Ava Thompson",
  "Noah Williams",
  "Mia Chen",
  "Oliver Brown",
  "Isla Wilson",
];

const initialGuardians = [
  {
    id: "G-1001",
    firstName: "Sarah",
    lastName: "Thompson",
    relationship: "Mother",
    phone: "0400 000 001",
    email: "sarah.thompson@example.com",
    studentNames: ["Ava Thompson"],
  },
  {
    id: "G-1002",
    firstName: "Michael",
    lastName: "Williams",
    relationship: "Father",
    phone: "0400 000 002",
    email: "michael.williams@example.com",
    studentNames: ["Noah Williams"],
  },
  {
    id: "G-1003",
    firstName: "Linda",
    lastName: "Chen",
    relationship: "Mother",
    phone: "0400 000 003",
    email: "linda.chen@example.com",
    studentNames: ["Mia Chen"],
  },
  {
    id: "G-1004",
    firstName: "James",
    lastName: "Brown",
    relationship: "Father",
    phone: "0400 000 004",
    email: "james.brown@example.com",
    studentNames: ["Oliver Brown"],
  },
  {
    id: "G-1005",
    firstName: "Emily",
    lastName: "Wilson",
    relationship: "Mother",
    phone: "0400 000 005",
    email: "emily.wilson@example.com",
    studentNames: ["Isla Wilson"],
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

function GuardianDetailsDialog({ guardian, onClose }) {
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

function AddGuardianDialog({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    relationship: "",
    phone: "",
    email: "",
    studentNames: [],
  });
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleStudentToggle(studentName) {
    setError("");

    setFormData((current) => {
      const alreadySelected = current.studentNames.includes(studentName);

      return {
        ...current,
        studentNames: alreadySelected
          ? current.studentNames.filter((name) => name !== studentName)
          : [...current.studentNames, studentName],
      };
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (formData.studentNames.length === 0) {
      setError("Select at least one student to link to this guardian.");
      return;
    }

    onAdd({
      ...formData,
      id: `G-${Date.now().toString().slice(-5)}`,
    });
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
            <h2 id="add-guardian-title">Add guardian</h2>
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
              {studentOptions.map((studentName) => (
                <label key={studentName}>
                  <input
                    type="checkbox"
                    checked={formData.studentNames.includes(studentName)}
                    onChange={() => handleStudentToggle(studentName)}
                  />
                  <span>{studentName}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && (
            <p className="guardians-form__error" role="alert">
              {error}
            </p>
          )}

          <p className="guardians-form__note">
            This prototype stores new records in the page only. They will be
            cleared when you refresh.
          </p>

          <div className="guardians-form__actions">
            <button
              className="guardians-secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="guardians-primary-button" type="submit">
              Add guardian
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function Guardians() {
  const [guardians, setGuardians] = useState(initialGuardians);
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

  function handleAddGuardian(guardian) {
    setGuardians((current) => [guardian, ...current]);
    setShowAddDialog(false);
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

        <button
          className="guardians-primary-button"
          type="button"
          onClick={() => setShowAddDialog(true)}
        >
          <span aria-hidden="true">+</span>
          Add guardian
        </button>
      </header>

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
          <span className="guardians-demo-label">Prototype data</span>
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
        />
      )}

      {selectedGuardian && (
        <GuardianDetailsDialog
          guardian={selectedGuardian}
          onClose={() => setSelectedGuardian(null)}
        />
      )}
    </main>
  );
}
