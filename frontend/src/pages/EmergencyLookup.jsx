import { useMemo, useState } from "react";
import "./EmergencyLookup.css";
import useRecords from "../hooks/useRecords";
import RequestState from "../components/RequestState";

const EMPTY_STUDENTS = [];

function getPhoneLink(phone) {
  return `tel:${String(phone).replace(/[^+\d]/g, "")}`;
}

export default function EmergencyLookup() {
  const records = useRecords("/students/");
  const [query, setQuery] = useState("");
  const students = Array.isArray(records.data) ? records.data : EMPTY_STUDENTS;

  const results = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return [];

    return students
      .filter((student) => {
        const fullName = `${student.first_name ?? ""} ${student.last_name ?? ""}`
          .trim()
          .toLowerCase();

        return fullName.includes(search);
      })
      .flatMap((student) => {
        const studentGuardians = Array.isArray(student.guardians)
          ? student.guardians
          : [];

        const emergencyContacts = studentGuardians
          .filter((link) => link.is_emergency_contact)
          .sort(
            (a, b) =>
              Number(Boolean(b.is_primary_contact)) -
              Number(Boolean(a.is_primary_contact)),
          );

        const studentInfo = {
          studentName: `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim(),
          level: student.year_level || "",
          medicalInformation: student.medical_information || "",
        };

        if (emergencyContacts.length === 0) {
          return [
            {
              id: `${student.id}-no-emergency-contact`,
              ...studentInfo,
              guardianName: "No emergency contact recorded",
              relationship: "",
              phone: "",
              mobilePhone: "",
              homePhone: "",
              businessPhone: "",
              email: "",
              hasEmergencyContact: false,
            },
          ];
        }

        return emergencyContacts.map((link) => {
          const guardian = link.guardian_details || {};

          return {
            id: `${student.id}-${link.id}`,
            ...studentInfo,
            guardianName: `${guardian.first_name ?? ""} ${guardian.last_name ?? ""}`.trim(),
            relationship: link.relationship || "Guardian",
            phone: guardian.phone || "",
            mobilePhone: guardian.mobile_phone || guardian.mobilePhone || "",
            homePhone: guardian.home_phone || guardian.homePhone || "",
            businessPhone:
              guardian.business_phone || guardian.businessPhone || "",
            email: guardian.email || "",
            hasEmergencyContact: true,
          };
        });
      });
  }, [query, students]);

  return (
    <main className="emergency-lookup-page">
      <header className="emergency-lookup-heading">
        <div>
          <h1>Emergency guardian lookup</h1>
          <p className="emergency-lookup-heading__description">
            Search for a student to view their designated emergency contact.
          </p>
        </div>
      </header>

      <section className="emergency-lookup-panel" aria-label="Find a student">
        <label htmlFor="emergency-student-search">
          Search by student name
        </label>

        <div className="emergency-search">
          <input
            id="emergency-student-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Enter the student's name"
            autoComplete="off"
          />

          {query && (
            <button type="button" onClick={() => setQuery("")}>
              Clear
            </button>
          )}
        </div>
      </section>

      <RequestState
        loading={records.loading}
        error={records.error}
        onRetry={records.refresh}
      />

      {query.trim() && !records.loading && !records.error && results.length === 0 && (
        <div className="emergency-empty-state" role="status">
          <strong>No matching student found</strong>
          <span>Check the spelling and try again.</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="el-results" aria-live="polite">
          {results.map((result) => (
            <article className="el-result" key={result.id}>
              <div>
                <h2>{result.studentName}</h2>
                {result.level && <small>{result.level}</small>}
                <p>
                  Guardian: {result.guardianName}
                  {result.relationship && ` (${result.relationship})`}
                </p>
              </div>

              {result.hasEmergencyContact ? (
                <div className="el-contact">
                  {result.phone && (
                    <a href={getPhoneLink(result.phone)}>
                      Phone: {result.phone}
                    </a>
                  )}

                  {result.mobilePhone && (
                    <a href={getPhoneLink(result.mobilePhone)}>
                      Mobile: {result.mobilePhone}
                    </a>
                  )}

                  {result.homePhone && (
                    <a href={getPhoneLink(result.homePhone)}>
                      Home: {result.homePhone}
                    </a>
                  )}

                  {result.businessPhone && (
                    <a href={getPhoneLink(result.businessPhone)}>
                      Business: {result.businessPhone}
                    </a>
                  )}

                  {result.email && (
                    <a href={`mailto:${result.email}`}>{result.email}</a>
                  )}

                  {!result.phone &&
                    !result.mobilePhone &&
                    !result.homePhone &&
                    !result.businessPhone &&
                    !result.email && (
                      <span>No contact details recorded</span>
                    )}
                </div>
              ) : (
                <div className="emergency-warning" role="alert">
                  <strong>No guardian is marked as an emergency contact.</strong>
                  <span>
                    Contact the ASP coordinator to verify the correct contact.
                  </span>
                </div>
              )}

              {result.medicalInformation && (
                <p className="el-medical">
                  Medical information: {result.medicalInformation}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}