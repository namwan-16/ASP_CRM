import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./EmergencyLookup.css";
import api from "../api/client";
import { errorMessage } from "../api/crm";
import RequestState from "../components/RequestState";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 5;

function getPhoneLink(phone) {
  return `tel:${String(phone).replace(/[^+\d]/g, "")}`;
}

function getStudentName(student) {
  return `${student?.first_name ?? ""} ${student?.last_name ?? ""}`.trim();
}

function getGuardianName(guardian) {
  return `${guardian?.first_name ?? ""} ${guardian?.last_name ?? ""}`.trim();
}

function getGuardianPhones(guardian) {
  const candidates = [
    { label: "Mobile", value: guardian?.mobile_phone || guardian?.mobilePhone },
    { label: "Home", value: guardian?.home_phone || guardian?.homePhone },
    {
      label: "Business",
      value: guardian?.business_phone || guardian?.businessPhone,
    },
    { label: "Phone", value: guardian?.phone },
  ];

  const seenNumbers = new Set();

  return candidates.filter(({ value }) => {
    if (!value) return false;

    const numberKey = String(value).replace(/\D/g, "");
    if (!numberKey || seenNumbers.has(numberKey)) return false;

    seenNumbers.add(numberKey);
    return true;
  });
}

function GuardianCard({ link }) {
  const guardian = link?.guardian_details || {};
  const guardianName = getGuardianName(guardian) || "Guardian name unavailable";
  const phones = getGuardianPhones(guardian);
  const email = guardian.email || "";

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

      {(phones.length > 0 || email) && (
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
      )}

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
          href={getPhoneLink(phones[0].value)}
        >
          Call guardian
        </a>
      )}
    </article>
  );
}

function StudentContactDetails({
  student,
  contacts,
  loading,
  error,
  detailsId,
}) {
  if (loading) {
    return (
      <div className="emergency-contact-loading" role="status" id={detailsId}>
        Loading emergency contact details…
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="emergency-contact-load-error" role="alert" id={detailsId}>
        Contact details could not be loaded. Use the retry control above to try
        again.
      </div>
    );
  }

  const sortedContacts = [...contacts].sort(
    (a, b) =>
      Number(Boolean(b.is_primary_contact)) -
      Number(Boolean(a.is_primary_contact)),
  );

  return (
    <section
      className="emergency-student-card emergency-student-card--inline"
      aria-label={`Emergency contact details for ${
        getStudentName(student) || "selected student"
      }`}
      id={detailsId}
    >
      <div className="emergency-contacts">
        <h3>Emergency contacts</h3>

        {sortedContacts.length > 0 ? (
          <div className="emergency-contacts__grid">
            {sortedContacts.map((link, index) => (
              <GuardianCard
                key={link.id ?? `${student.id}-${index}`}
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

      {student.medical_information && (
        <p className="emergency-medical">
          <strong>Medical information:</strong> {student.medical_information}
        </p>
      )}
    </section>
  );
}

export default function EmergencyLookup() {
  const location = useLocation();

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
    const globalSearch = location.state?.globalSearch;

    if (typeof globalSearch === "string" && globalSearch.trim()) {
      setQuery(globalSearch);
      setPage(1);
      setSelectedStudentId(null);
      setSelectedStudent(null);
      setEmergencyContacts([]);
    }
  }, [location.key, location.state]);

  useEffect(() => {
    const controller = new AbortController();

    if (!query.trim()) {
      setMatches([]);
      setCount(0);
      setSearchLoading(false);
      setError("");
      return () => controller.abort();
    }

    setSearchLoading(true);
    setError("");

    const timer = window.setTimeout(() => {
      api
        .get("/emergency-lookup/", {
          params: {
            search: query.trim(),
            page,
            page_size: PAGE_SIZE,
          },
          signal: controller.signal,
        })
        .then(({ data }) => {
          if (controller.signal.aborted) return;

          const results = Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data)
              ? data
              : [];

          setMatches(results);
          setCount(Number(data?.count) || results.length);
        })
        .catch((requestError) => {
          if (!controller.signal.aborted) {
            setMatches([]);
            setCount(0);
            setError(errorMessage(requestError));
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearchLoading(false);
        });
    }, 200);

    return () => {
      window.clearTimeout(timer);
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
        if (controller.signal.aborted) return;

        setSelectedStudent(data?.student || null);
        setEmergencyContacts(
          Array.isArray(data?.contacts) ? data.contacts : [],
        );
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(errorMessage(requestError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setContactLoading(false);
      });

    return () => controller.abort();
  }, [selectedStudentId, version]);

  function handleSearchChange(event) {
    setQuery(event.target.value);
    setPage(1);
    setMatches([]);
    setCount(0);
    setSelectedStudentId(null);
    setSelectedStudent(null);
    setEmergencyContacts([]);
  }

  function clearSearch() {
    setQuery("");
    setError("");
    setPage(1);
    setMatches([]);
    setCount(0);
    setSelectedStudentId(null);
    setSelectedStudent(null);
    setEmergencyContacts([]);
  }

  function selectStudent(studentId) {
    setSelectedStudentId(studentId);
    setError("");
  }

  function retry() {
    setVersion((current) => current + 1);
  }

  const showPagination = count > PAGE_SIZE;

  return (
    <main className="emergency-lookup-page">
      <header className="emergency-lookup-heading">
        <div>
          <h1>Emergency guardian lookup</h1>
          <p className="emergency-lookup-heading__description">
            Search by student name or ID to view their emergency contact
            details.
          </p>
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
              aria-label="Clear student search"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      <RequestState loading={searchLoading} error={error} onRetry={retry} />

      {!query.trim() && (
        <div className="emergency-initial-state" role="status">
          <strong>Search for a student</strong>
          <span>Enter a student name or ID to begin the lookup.</span>
        </div>
      )}

      {query.trim() && !searchLoading && !error && matches.length > 0 && (
        <section
          className="emergency-search-results"
          aria-labelledby="emergency-results-title"
          aria-live="polite"
          aria-busy={contactLoading}
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
              const studentName = getStudentName(student) || "Unnamed student";
              const detailsId = `emergency-details-${student.id}`;

              return (
                <div className="emergency-student-result-wrap" key={student.id}>
                  <button
                    className={`emergency-student-result${
                      isSelected ? " emergency-student-result--selected" : ""
                    }`}
                    type="button"
                    aria-pressed={isSelected}
                    aria-expanded={isSelected}
                    aria-controls={isSelected ? detailsId : undefined}
                    onClick={() => selectStudent(student.id)}
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

                  {isSelected && (
                    <StudentContactDetails
                      student={selectedStudent}
                      contacts={emergencyContacts}
                      loading={contactLoading}
                      error={error}
                      detailsId={detailsId}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {showPagination && (
            <Pagination
              page={page}
              total={count}
              label="Student search pages"
              disabled={searchLoading || contactLoading}
              setPage={(nextPage) => {
                setSelectedStudentId(null);
                setSelectedStudent(null);
                setEmergencyContacts([]);
                setPage(nextPage);
              }}
            />
          )}
        </section>
      )}

      {query.trim() && !searchLoading && !error && matches.length === 0 && (
        <div className="emergency-empty-state" role="status" aria-live="polite">
          <strong>No matching student found</strong>
          <span>Check the name or ID and try again.</span>
        </div>
      )}
    </main>
  );
}
