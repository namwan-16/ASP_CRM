import { useMemo, useState } from "react";
import { Search, Plus, X } from "lucide-react";
import "./ProgressNotes.css";

// Replace with real data (API, context, props...)
const STUDENTS = ["Amelia Carter", "Liam Nguyen", "Zoe Patel"];
const SEED_NOTES = [
  { id: 1, student: "Amelia Carter", date: "2026-10-05", text: "Finished the fractions worksheet without help. Ready for the next level." },
  { id: 2, student: "Liam Nguyen", date: "2026-10-03", text: "Quiet at pick-up. Said he was tired. Follow up on Thursday." },
  { id: 3, student: "Zoe Patel", date: "2026-10-01", text: "Spoke with Priya about the new pick-up time. Confirmed by phone." },
];

const fmt = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

export default function ProgressNotes() {
  const [notes, setNotes] = useState(SEED_NOTES);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [student, setStudent] = useState("");
  const [text, setText] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes
      .filter((n) => !q || n.student.toLowerCase().includes(q) || n.text.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  }, [notes, query]);

  function save(e) {
    e.preventDefault();
    if (!student || !text.trim()) return;
    const date = new Date().toISOString().slice(0, 10);
    setNotes([{ id: Date.now(), student, date, text: text.trim() }, ...notes]);
    setStudent("");
    setText("");
    setAdding(false);
  }

  return (
    <main className="pn-page">
      <div className="pn-top">
        <div>
          <h1>Progress notes</h1>
          <p>Record and review student interactions.</p>
        </div>
        <button className="pn-btn" type="button" onClick={() => setAdding(!adding)}>
          {adding ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add note</>}
        </button>
      </div>

      {adding && (
        <form className="pn-form" onSubmit={save}>
          <select value={student} onChange={(e) => setStudent(e.target.value)}>
            <option value="">Select a student</option>
            {STUDENTS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a note..."
          />
          <button className="pn-btn" type="submit">Save note</button>
        </form>
      )}

      <label className="pn-search">
        <Search size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes..."
        />
      </label>

      <ul className="pn-list">
        {visible.map((n) => (
          <li key={n.id}>
            <div className="pn-row">
              <strong>{n.student}</strong>
              <span>{fmt(n.date)}</span>
            </div>
            <p>{n.text}</p>
          </li>
        ))}
        {visible.length === 0 && <li className="pn-empty">No notes found.</li>}
      </ul>
    </main>
  );
}