import { useMemo, useState } from "react";
import { ShieldAlert, Search, Users, Phone, Mail } from "lucide-react";
import "./EmergencyLookup.css";
import useRecords from "../hooks/useRecords";
import RequestState from "../components/RequestState";


export default function EmergencyLookup() {
  const records = useRecords("/students/");
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return records.data.filter((s) => `${s.first_name} ${s.last_name}`.toLowerCase().includes(q)).flatMap((student) => {
      const contacts = student.guardians.filter((link) => link.is_emergency_contact).sort((a, b) => Number(b.is_primary_contact) - Number(a.is_primary_contact));
      const base = { name: `${student.first_name} ${student.last_name}`, class: student.year_level, medical: student.medical_information };
      if (!contacts.length) return [{ ...base, id: `${student.id}-none`, guardian: "No emergency contact recorded", relation: "", phone: "", email: "" }];
      return contacts.map((link) => ({ ...base, id: `${student.id}-${link.id}`, guardian: `${link.guardian_details.first_name} ${link.guardian_details.last_name}`,
        relation: link.relationship, phone: link.guardian_details.phone, email: link.guardian_details.email }));
    });
  }, [query, records.data]);

  const hasQuery = query.trim().length > 0;

  return (
    <section className="el-panel">
      <div className="el-title">
        <ShieldAlert size={26} color="#e5484d" />
        <h2>Emergency Guardian Lookup</h2>
      </div>
      <p className="el-sub">Search by student name for immediate guardian contact details.</p>
      <RequestState loading={records.loading} error={records.error} onRetry={records.refresh} />

      <label className="el-search">
        <Search size={20} />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a student's name..."
        />
      </label>

      {!hasQuery && (
        <div className="el-empty">
          <Users size={30} />
          <span>Start typing to search all registered students</span>
        </div>
      )}

      {hasQuery && results.length === 0 && (
        <div className="el-empty">
          <Users size={30} />
          <span>No students found for "{query.trim()}"</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="el-results">
          {results.map((s) => (
            <div className="el-result" key={s.id}>
              <div>
                <h3>{s.name}</h3>
                <small>{s.class} &bull; Guardian: {s.guardian} ({s.relation})</small>
              </div>
              <div className="el-contact">
                {s.phone && <a href={`tel:${s.phone.replace(/\s/g, "")}`}><Phone size={14} /> {s.phone}</a>}
                {s.email && <a href={`mailto:${s.email}`}><Mail size={14} /> {s.email}</a>}
              </div>
              {s.medical && <p>Medical information: {s.medical}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
