import { useMemo, useState } from "react";
import "./EmergencyLookup.css";

// Demonstration data only. Replace with the authenticated backend lookup.
const sampleStudents = [
  {
    id: 1,
    studentId: "ASP-1001",
    firstName: "Ava",
    lastName: "Thompson",
    level: "Year 7",
    room: "Room 1",
    guardians: [
      {
        id: 1,
        firstName: "Sarah",
        lastName: "Thompson",
        relationship: "Mother",
        emergencyContact: true,
        mobilePhone: "0400 000 101",
        homePhone: "",
        businessPhone: "",
        email: "sarah.thompson@example.com",
      },
      {
        id: 2,
        firstName: "David",
        lastName: "Thompson",
        relationship: "Father",
        emergencyContact: false,
        mobilePhone: "0400 000 102",
        homePhone: "",
        businessPhone: "",
        email: "david.thompson@example.com",
      },
    ],
  },
  {
    id: 2,
    studentId: "ASP-1002",
    firstName: "Noah",
    lastName: "Williams",
    level: "Year 8",
    room: "Room 2",
    guardians: [
      {
        id: 3,
        firstName: "Michael",
        lastName: "Williams",
        relationship: "Father",
        emergencyContact: true,
        mobilePhone: "0400 000 201",
        homePhone: "08 6000 0201",
        businessPhone: "",
        email: "michael.williams@example.com",
      },
    ],
  },
  {
    id: 3,
    studentId: "ASP-1003",
    firstName: "Mia",
    lastName: "Chen",
    level: "Year 9",
    room: "Room 1",
    guardians: [],
  },
];

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5 2.7 20h18.6L12 3.5Z" />
      <path d="M12 9v5.2M12 17.5v.1" />
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

function getPhoneLink(phone) {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

function GuardianContact({ guardian }) {
  const hasPhone =
    guardian.mobilePhone || guardian.homePhone || guardian.businessPhone;

  return (
    <article className="emergency-contact-card">
      <div className="emergency-contact-card__heading">
        <div>
          <h3>
            {guardian.firstName} {guardian.lastName}
          </h3>
          <p>{guardian.relationship || "Guardian"}</p>
        </div>
        <span className="emergency-contact-card__badge">Emergency contact</span>
      </div>

      <dl className="emergency-contact-card__details">
        {guardian.mobilePhone && (
          <div>
            <dt>Mobile</dt>
            <dd>
              <a href={getPhoneLink(guardian.mobilePhone)}>
                {guardian.mobilePhone}
              </a>
            </dd>
          </div>
        )}
        {guardian.homePhone && (
          <div>
            <dt>Home</dt>
            <dd>
              <a href={getPhoneLink(guardian.homePhone)}>
                {guardian.homePhone}
              </a>
            </dd>
          </div>
        )}
        {guardian.businessPhone && (
          <div>
            <dt>Business</dt>
            <dd>
              <a href={getPhoneLink(guardian.businessPhone)}>
                {guardian.businessPhone}
              </a>
            </dd>
          </div>
        )}
        {guardian.email && (
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${guardian.email}`}>{guardian.email}</a>
            </dd>
          </div>
        )}
      </dl>

      {hasPhone && (
        <a
          className="emergency-contact-card__call"
          href={getPhoneLink(
            guardian.mobilePhone ||
              guardian.homePhone ||
              guardian.businessPhone,
          )}
        >
          Call guardian
        </a>
      )}
    </article>
  );
}

export default function EmergencyLookup() {
  const [query, setQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const matches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];

    return sampleStudents.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      return (
        fullName.includes(normalizedQuery) ||
        student.studentId.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query]);

  const selectedStudent = sampleStudents.find(
    (student) => student.id === selectedStudentId,
  );

  function handleSearchChange(event) {
    setQuery(event.target.value);
    setSelectedStudentId(null);
  }

  return (
    <main className="emergency-lookup-page">
      <header className="emergency-lookup-heading">
        <div>
          <h1>Emergency guardian lookup</h1>
          <p className="emergency-lookup-heading__description">
            Find a student and quickly view their designated emergency contact.
          </p>
        </div>
        <div className="emergency-lookup-heading__icon" aria-hidden="true">
          <AlertIcon />
        </div>
      </header>

      <section className="emergency-lookup-panel" aria-label="Find a student">
        <label htmlFor="emergency-student-search">
          Search by student name or ID
        </label>
        <div className="emergency-search">
          <span className="emergency-search__icon" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            id="emergency-student-search"
            type="search"
            value={query}
            onChange={handleSearchChange}
            placeholder="For example, Ava Thompson or ASP-1001"
            autoComplete="off"
          />
          {query && (
            <button
              className="emergency-search__clear"
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedStudentId(null);
              }}
            >
              Clear
            </button>
          )}
        </div>
        <p className="emergency-lookup-panel__hint">
          Enter a name or student ID, then select the correct student.
        </p>

        <div className="emergency-search-results" aria-live="polite">
          {query.trim().length > 0 && matches.length === 0 && (
            <div className="emergency-empty-state">
              <strong>No matching student found</strong>
              <span>Check the spelling or student ID and try again.</span>
            </div>
          )}

          {matches.length > 0 && !selectedStudent && (
            <div className="emergency-student-results">
              <p className="emergency-student-results__label">
                Matching students ({matches.length})
              </p>
              {matches.map((student) => (
                <button
                  className="emergency-student-result"
                  key={student.id}
                  type="button"
                  onClick={() => setSelectedStudentId(student.id)}
                >
                  <span className="emergency-student-result__name">
                    {student.firstName} {student.lastName}
                  </span>
                  <span className="emergency-student-result__meta">
                    {student.studentId} · {student.level} · {student.room}
                  </span>
                  <span
                    className="emergency-student-result__arrow"
                    aria-hidden="true"
                  >
                    ›
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedStudent && (
        <section
          className="emergency-student-card"
          aria-labelledby="selected-student-title"
        >
          <div className="emergency-student-card__heading">
            <div>
              <p className="emergency-lookup-eyebrow">Selected student</p>
              <h2 id="selected-student-title">
                {selectedStudent.firstName} {selectedStudent.lastName}
              </h2>
            </div>
            <div className="emergency-student-card__meta">
              <span>{selectedStudent.studentId}</span>
              <span>{selectedStudent.level}</span>
              <span>{selectedStudent.room}</span>
            </div>
          </div>

          {selectedStudent.guardians.some(
            (guardian) => guardian.emergencyContact,
          ) ? (
            <div className="emergency-contacts">
              <h3>Designated emergency contact(s)</h3>
              <div className="emergency-contacts__grid">
                {selectedStudent.guardians
                  .filter((guardian) => guardian.emergencyContact)
                  .map((guardian) => (
                    <GuardianContact key={guardian.id} guardian={guardian} />
                  ))}
              </div>
            </div>
          ) : (
            <div className="emergency-warning" role="alert">
              <strong>No guardian is marked as an emergency contact.</strong>
              <span>
                Contact the ASP coordinator to verify the correct contact.
              </span>
            </div>
          )}

          {selectedStudent.guardians.some(
            (guardian) => !guardian.emergencyContact,
          ) && (
            <details className="emergency-other-guardians">
              <summary>View other linked guardian(s)</summary>
              <ul>
                {selectedStudent.guardians
                  .filter((guardian) => !guardian.emergencyContact)
                  .map((guardian) => (
                    <li key={guardian.id}>
                      <strong>
                        {guardian.firstName} {guardian.lastName}
                      </strong>
                      <span>{guardian.relationship || "Guardian"}</span>
                      {guardian.mobilePhone && (
                        <a href={getPhoneLink(guardian.mobilePhone)}>
                          {guardian.mobilePhone}
                        </a>
                      )}
                    </li>
                  ))}
              </ul>
            </details>
          )}
        </section>
      )}
    </main>
  );
}
