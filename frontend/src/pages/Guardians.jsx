import { useMemo, useState } from "react";
import "./Guardians.css";

// Replace these demo records with records returned by the backend API.
const studentOptions = [
  { id: 101, name: "Ava Thompson" },
  { id: 102, name: "Noah Williams" },
  { id: 103, name: "Mia Chen" },
  { id: 104, name: "Oliver Brown" },
  { id: 105, name: "Isla Wilson" },
];

// Relationship and emergencyContact belong to each student–guardian link,
// matching the separate Students and Guardians table in the client database.
const initialGuardians = [
  {
    id: 1001,
    company: "",
    firstName: "Sarah",
    lastName: "Thompson",
    email: "sarah.thompson@example.com",
    jobTitle: "",
    businessPhone: "",
    homePhone: "",
    mobilePhone: "0400 000 001",
    faxNumber: "",
    address: "",
    city: "",
    stateProvince: "",
    postalCode: "",
    countryRegion: "Australia",
    webPage: "",
    notes: "",
    attachments: [],
    studentLinks: [
      {
        id: 1,
        studentId: 101,
        studentName: "Ava Thompson",
        relationship: "Mother",
        emergencyContact: true,
      },
    ],
  },
  {
    id: 1002,
    company: "",
    firstName: "Michael",
    lastName: "Williams",
    email: "michael.williams@example.com",
    jobTitle: "",
    businessPhone: "",
    homePhone: "",
    mobilePhone: "0400 000 002",
    faxNumber: "",
    address: "",
    city: "",
    stateProvince: "",
    postalCode: "",
    countryRegion: "Australia",
    webPage: "",
    notes: "",
    attachments: [],
    studentLinks: [
      {
        id: 2,
        studentId: 102,
        studentName: "Noah Williams",
        relationship: "Father",
        emergencyContact: true,
      },
    ],
  },
  {
    id: 1003,
    company: "",
    firstName: "Linda",
    lastName: "Chen",
    email: "linda.chen@example.com",
    jobTitle: "",
    businessPhone: "",
    homePhone: "",
    mobilePhone: "0400 000 003",
    faxNumber: "",
    address: "",
    city: "",
    stateProvince: "",
    postalCode: "",
    countryRegion: "Australia",
    webPage: "",
    notes: "",
    attachments: [],
    studentLinks: [
      {
        id: 3,
        studentId: 103,
        studentName: "Mia Chen",
        relationship: "Mother",
        emergencyContact: true,
      },
    ],
  },
  {
    id: 1004,
    company: "",
    firstName: "James",
    lastName: "Brown",
    email: "james.brown@example.com",
    jobTitle: "",
    businessPhone: "",
    homePhone: "",
    mobilePhone: "0400 000 004",
    faxNumber: "",
    address: "",
    city: "",
    stateProvince: "",
    postalCode: "",
    countryRegion: "Australia",
    webPage: "",
    notes: "",
    attachments: [],
    studentLinks: [
      {
        id: 4,
        studentId: 104,
        studentName: "Oliver Brown",
        relationship: "Father",
        emergencyContact: true,
      },
    ],
  },
  {
    id: 1005,
    company: "",
    firstName: "Emily",
    lastName: "Wilson",
    email: "emily.wilson@example.com",
    jobTitle: "",
    businessPhone: "",
    homePhone: "",
    mobilePhone: "0400 000 005",
    faxNumber: "",
    address: "",
    city: "",
    stateProvince: "",
    postalCode: "",
    countryRegion: "Australia",
    webPage: "",
    notes: "",
    attachments: [],
    studentLinks: [
      {
        id: 5,
        studentId: 105,
        studentName: "Isla Wilson",
        relationship: "Mother",
        emergencyContact: true,
      },
    ],
  },
];

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

function displayValue(value) {
  return value?.trim() ? value : "Not recorded";
}

function phoneLink(value) {
  return `tel:${value.replace(/[^\d+]/g, "")}`;
}

function GuardianDetailsDialog({ guardian, onClose, onEdit }) {
  if (!guardian) return null;

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
          {guardian.studentLinks.length ? (
            <ul>
              {guardian.studentLinks.map((link) => (
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
          <button
            className="guardians-secondary-button"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="guardians-primary-button"
            type="button"
            onClick={() => onEdit(guardian)}
          >
            Edit guardian
          </button>
        </div>
      </section>
    </div>
  );
}

function GuardianFormDialog({ guardian, onClose, onSave }) {
  const isEditing = Boolean(guardian);
  const [formData, setFormData] = useState(() =>
    guardian
      ? {
          ...emptyGuardian,
          ...guardian,
          studentLinks: guardian.studentLinks.map((link) => ({ ...link })),
        }
      : { ...emptyGuardian },
  );
  const [newFiles, setNewFiles] = useState([]);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleStudentToggle(student) {
    setError("");
    setFormData((current) => {
      const found = current.studentLinks.find(
        (link) => link.studentId === student.id,
      );
      return {
        ...current,
        studentLinks: found
          ? current.studentLinks.filter((link) => link.studentId !== student.id)
          : [
              ...current.studentLinks,
              {
                id: `new-${student.id}`,
                studentId: student.id,
                studentName: student.name,
                relationship: "",
                emergencyContact: false,
              },
            ],
      };
    });
  }

  function updateStudentLink(studentId, field, value) {
    setFormData((current) => ({
      ...current,
      studentLinks: current.studentLinks.map((link) =>
        link.studentId === studentId ? { ...link, [field]: value } : link,
      ),
    }));
  }

  function handleFilesChange(event) {
    setNewFiles(Array.from(event.target.files || []));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!formData.studentLinks.length) {
      setError("Select at least one student to link to this guardian.");
      return;
    }
    if (formData.studentLinks.some((link) => !link.relationship.trim())) {
      setError("Enter the relationship for every linked student.");
      return;
    }

    const attachments = [
      ...(formData.attachments || []),
      ...newFiles.map((file) => file.name),
    ];
    onSave({ ...formData, attachments });
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
            <h2 id="guardian-form-title">
              {isEditing ? "Edit guardian" : "Add guardian"}
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

          <label>
            Attachments
            <input type="file" multiple onChange={handleFilesChange} />
            {(formData.attachments.length > 0 || newFiles.length > 0) && (
              <span className="guardians-attachment-list">
                {[
                  ...formData.attachments,
                  ...newFiles.map((file) => file.name),
                ].join(", ")}
              </span>
            )}
          </label>

          <fieldset className="guardians-student-fieldset">
            <legend>Student links</legend>
            <p>
              Choose the students linked to this guardian, then record the
              relationship and emergency-contact status for each student.
            </p>
            <div className="guardians-student-options">
              {studentOptions.map((student) => {
                const link = formData.studentLinks.find(
                  (item) => item.studentId === student.id,
                );
                return (
                  <div className="guardians-student-option" key={student.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={Boolean(link)}
                        onChange={() => handleStudentToggle(student)}
                      />
                      <span>{student.name}</span>
                    </label>
                    {link && (
                      <div className="guardians-student-link-fields">
                        <label>
                          Relationship to {student.name.split(" ")[0]}
                          <input
                            value={link.relationship}
                            onChange={(event) =>
                              updateStudentLink(
                                student.id,
                                "relationship",
                                event.target.value,
                              )
                            }
                            placeholder="For example, mother"
                            required
                          />
                        </label>
                        <label className="guardians-emergency-checkbox">
                          <input
                            type="checkbox"
                            checked={link.emergencyContact}
                            onChange={(event) =>
                              updateStudentLink(
                                student.id,
                                "emergencyContact",
                                event.target.checked,
                              )
                            }
                          />
                          Emergency contact
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>

          {error && (
            <p className="guardians-form__error" role="alert">
              {error}
            </p>
          )}
          <p className="guardians-form__note">
            This prototype keeps changes in page state only. File names are
            recorded, but files are not uploaded until backend storage is
            connected.
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
              {isEditing ? "Save changes" : "Add guardian"}
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
  const [formGuardian, setFormGuardian] = useState(undefined);
  const [selectedGuardian, setSelectedGuardian] = useState(null);

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
        ...guardian.studentLinks.flatMap((link) => [
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

  function handleSaveGuardian(guardianData) {
    if (guardianData.id) {
      setGuardians((current) =>
        current.map((item) =>
          item.id === guardianData.id ? guardianData : item,
        ),
      );
    } else {
      setGuardians((current) => [
        { ...guardianData, id: Date.now() },
        ...current,
      ]);
    }
    setFormGuardian(undefined);
    setSelectedGuardian(null);
  }

  function handleEditGuardian(guardian) {
    setSelectedGuardian(null);
    setFormGuardian(guardian);
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
        <button
          className="guardians-primary-button"
          type="button"
          onClick={() => setFormGuardian(null)}
        >
          <span aria-hidden="true">+</span> Add guardian
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

      {formGuardian !== undefined && (
        <GuardianFormDialog
          guardian={formGuardian}
          onClose={() => setFormGuardian(undefined)}
          onSave={handleSaveGuardian}
        />
      )}

      {selectedGuardian && (
        <GuardianDetailsDialog
          guardian={selectedGuardian}
          onClose={() => setSelectedGuardian(null)}
          onEdit={handleEditGuardian}
        />
      )}
    </main>
  );
}
