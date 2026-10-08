import { useMemo, useState } from "react";
import { ShieldAlert, Search, Users, Phone, Mail } from "lucide-react";
import "./EmergencyLookup.css";

// Replace with your real data (props, API call, context, etc.)
const STUDENTS = [
  { id: 1, name: "Amelia Carter", class: "Year 5", guardian: "Sarah Carter", relation: "Mother", phone: "0412 345 678", email: "sarah.carter@example.com" },
  { id: 2, name: "Liam Nguyen", class: "Year 3", guardian: "Minh Nguyen", relation: "Father", phone: "0423 456 789", email: "minh.nguyen@example.com" },
  { id: 3, name: "Zoe Patel", class: "Year 6", guardian: "Priya Patel", relation: "Mother", phone: "0434 567 890", email: "priya.patel@example.com" },
];

export default function EmergencyLookup({ students = STUDENTS }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return students.filter((s) => s.name.toLowerCase().includes(q));
  }, [query, students]);

  const hasQuery = query.trim().length > 0;

  return (
    <section className="el-panel">
      <div className="el-title">
        <ShieldAlert size={26} color="#e5484d" />
        <h2>Emergency Guardian Lookup</h2>
      </div>
      <p className="el-sub">Search by student name for immediate guardian contact details.</p>

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
                <a href={`tel:${s.phone.replace(/\s/g, "")}`}><Phone size={14} /> {s.phone}</a>
                <a href={`mailto:${s.email}`}><Mail size={14} /> {s.email}</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}