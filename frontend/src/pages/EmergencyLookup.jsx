import { useEffect, useState } from "react";
import "./EmergencyLookup.css";
import api from "../api/client";
import { errorMessage } from "../api/crm";
import RequestState from "../components/RequestState";
import Pagination from "../components/Pagination";

function getPhoneLink(phone) {
  return `tel:${String(phone).replace(/[^+\d]/g, "")}`;
}

function getStudentName(student) {
  return `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim();
}

function getGuardianName(guardian) {
  return `${guardian?.first_name ?? ""} ${guardian?.last_name ?? ""}`.trim();
}

function getGuardianPhones(guardian) {
  return [
    { label: "Mobile", value: guardian.mobile_phone || guardian.mobilePhone },
    { label: "Home", value: guardian.home_phone || guardian.homePhone },
    {
      label: "Business",
      value: guardian.business_phone || guardian.businessPhone,
    },
    { label: "Phone", value: guardian.phone },
  ].filter((item) => item.value);
}

function GuardianCard({ link }) {
  const guardian = link.guardian_details || {};
  const guardianName = getGuardianName(guardian) || "Guardian name unavailable";
  const phones = getGuardianPhones(guardian);
  const email = guardian.email || "";
  const preferredPhone =
    phones.find((phone) => phone.label === "Mobile")?.value || phones[0]?.value;

  return (
    <article className="emergency-contact-card">
      <div className="emergency-contact-card__heading">
        <div>
          <h3>{guardianName}</h3>
          <p>{link.relationship || "Guardian"}</p>
        </div>

        <div className="emergency-contact-card__badges">
          {link.is_primary_contact && (
            <span className="emergency-contact-card__badge">Primary</span>
          )}
          <span className="emergency-contact-card__badge">
            Emergency contact
          </span>
        </div>
      </div>

      <dl className="emergency-contact-card__details">
        {phones.map(({ label, value }) => (
          <div key={`${label}-${value}`}>
            <dt>{label}</dt>
            <dd>
              <a href={getPhoneLink(value)}>{value}</a>
            </dd>
          </div>
        ))}

        {email && (
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${email}`}>{email}</a>
            </dd>
          </div>
        )}
      </dl>

      {phones.length === 0 && (
        <p className="emergency-contact-card__missing" role="status">
          No phone number is recorded for this emergency contact.
          {email
            ? " You can email the guardian above."
            : " Contact the ASP coordinator."}
        </p>
      )}

      {phones.length > 0 && (
        <a
          className="emergency-contact-card__call"
          href={getPhoneLink(preferredPhone)}
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
  const [matches, setMatches] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    if (!query.trim()) {
      setMatches([]);
      setCount(0);
      setSearchLoading(false);
      return () => controller.abort();
    }
    setSearchLoading(true);
    setError("");
    const timer = setTimeout(() => {
      api
        .get("/emergency-lookup/", {
          params: { search: query.trim(), page, page_size: 5 },
          signal: controller.signal,
        })
        .then(({ data }) => {
          if (!controller.signal.aborted) {
            setMatches(data.results);
            setCount(data.count);
          }
        })
        .catch((e) => {
          if (!controller.signal.aborted) setError(errorMessage(e));
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearchLoading(false);
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, page, version]);
  useEffect(() => {
    const controller = new AbortController();
    setSelectedStudent(null);
    setEmergencyContacts([]);
    if (!selectedStudentId) {
      setContactLoading(false);
      return () => controller.abort();
    }
    setContactLoading(true);
    setError("");
    api
      .get(`/students/${selectedStudentId}/emergency-contacts/`, {
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (!controller.signal.aborted) {
          setSelectedStudent(data.student);
          setEmergencyContacts(data.contacts);
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setContactLoading(false);
      });
    return () => controller.abort();
  }, [selectedStudentId, version]);
  const records = {
    loading: searchLoading || contactLoading,
    error,
    refresh: () => setVersion((v) => v + 1),
  };
  function handleSearchChange(event) {
    setQuery(event.target.value);
    setPage(1);
    setMatches([]);
    setSelectedStudentId(null);
  }

  function clearSearch() {
    setQuery("");
    setError("");
    setPage(1);
    setSelectedStudentId(null);
  }

  return (
    <main className="emergency-lookup-page">
      <header className="emergency-lookup-heading">
        <div>
          <p className="emergency-lookup-eyebrow">ASP quick access</p>
          <h1>Emergency guardian lookup</h1>
          <p className="emergency-lookup-heading__description">
            Search by student name or ID to view their emergency contact
            details.
          </p>
        </div>

        <div className="emergency-lookup-heading__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 8v5m0 3h.01M10.3 3.8 2.9 17a2 2 0 0 0 1.8 3h14.6a2 2 0 0 0 1.8-3l-7.4-13.2a2 2 0 0 0-3.4 0Z" />
          </svg>
        </div>
      </header>

      <section className="emergency-lookup-panel" aria-label="Find a student">
        <label htmlFor="emergency-student-search">Student name or ID</label>

        <div className="emergency-search">
          <span className="emergency-search__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 4.5 4.5" />
            </svg>
          </span>

          <input
            id="emergency-student-search"
            type="search"
            value={query}
            onChange={handleSearchChange}
            placeholder="Enter a student name or ID"
            autoComplete="off"
            aria-describedby="emergency-search-hint"
          />

          {query && (
            <button
              className="emergency-search__clear"
              type="button"
              onClick={clearSearch}
            >
              Clear
            </button>
          )}
        </div>

        <p className="emergency-lookup-panel__hint" id="emergency-search-hint">
          Select a student from the results to view their contact information.
        </p>
      </section>

      <RequestState
        loading={records.loading}
        error={records.error}
        onRetry={records.refresh}
      />

      {query.trim() &&
        !records.loading &&
        !records.error &&
        matches.length > 0 && (
          <section
            className="emergency-search-results"
            aria-labelledby="emergency-results-title"
          >
            <div className="emergency-results-heading">
              <div>
                <h2 id="emergency-results-title">Matching students</h2>
                <p>
                  {count} matching {count === 1 ? "student" : "students"}
                </p>
              </div>
            </div>

            <div className="emergency-student-results">
              {matches.map((student) => {
                const isSelected =
                  String(student.id) === String(selectedStudentId);
                const studentName =
                  getStudentName(student) || "Unnamed student";

                return (
                  <button
                    className={`emergency-student-result${
                      isSelected ? " emergency-student-result--selected" : ""
                    }`}
                    type="button"
                    key={student.id}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedStudentId(student.id)}
                  >
                    <span className="emergency-student-result__name">
                      {studentName}
                    </span>

                    <span className="emergency-student-result__meta">
                      ASP-{student.id}
                      {student.year_level ? ` · ${student.year_level}` : ""}
                      {student.is_active === false ? " · Inactive record" : ""}
                    </span>

                    <span
                      className="emergency-student-result__arrow"
                      aria-hidden="true"
                    >
                      {isSelected ? "✓" : "›"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

      {query.trim() &&
        !records.loading &&
        !records.error &&
        matches.length === 0 && (
          <div className="emergency-empty-state" role="status">
            <strong>No matching student found</strong>
            <span>Check the name or ID and try again.</span>
          </div>
        )}

      {query.trim() && !searchLoading && <Pagination page={page} total={count} label="Student search pages" setPage={(next) => { setSelectedStudentId(null); setPage(next); }} />}
      {selectedStudent && (
        <section
          className="emergency-student-card"
          aria-labelledby="selected-student-name"
        >
          <header className="emergency-student-card__heading">
            <div>
              <p className="emergency-student-card__eyebrow">
                Selected student
              </p>
              <h2 id="selected-student-name">
                {getStudentName(selectedStudent) || "Unnamed student"}
              </h2>
            </div>

            <div className="emergency-student-card__meta">
              <span>ASP-{selectedStudent.id}</span>
              {selectedStudent.year_level && (
                <span>{selectedStudent.year_level}</span>
              )}
              {selectedStudent.is_active === false && (
                <span>Inactive record</span>
              )}
            </div>
          </header>

          <div className="emergency-contacts">
            <h3>Emergency contacts</h3>

            {emergencyContacts.length > 0 ? (
              <div className="emergency-contacts__grid">
                {emergencyContacts.map((link, index) => (
                  <GuardianCard
                    key={link.id ?? `${selectedStudent.id}-${index}`}
                    link={link}
                  />
                ))}
              </div>
            ) : (
              <div className="emergency-warning" role="alert">
                <strong>No guardian is marked as an emergency contact.</strong>
                <span>
                  Contact the ASP coordinator to verify the correct contact.
                </span>
              </div>
            )}
          </div>

          {selectedStudent.medical_information && (
            <p className="emergency-medical">
              <strong>Medical information:</strong>{" "}
              {selectedStudent.medical_information}
            </p>
          )}
        </section>
      )}
    </main>
  );
}