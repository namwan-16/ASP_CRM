import { useMemo, useState } from "react";
import { Search, Plus, X } from "lucide-react";
import "./ProgressNotes.css";
import api from "../api/client";
import { errorMessage } from "../api/crm";
import useRecords from "../hooks/useRecords";
import { useAuth } from "../context/AuthContext";
import RequestState from "../components/RequestState";


const fmt = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

export default function ProgressNotes() {
  const records = useRecords("/progress-notes/");
  const students = useRecords("/students/");
  const notes = useMemo(() => records.data.map((note) => ({ ...note, student: note.student_name })), [records.data]);
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
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

  async function save(e) {
    e.preventDefault();
    if (!student || !text.trim()) return;
    setError("");
    setSaving(true);
    try {
      if (editing) await api.patch(`/progress-notes/${editing}/`, { text: text.trim() });
      else await api.post("/progress-notes/", { student: Number(student), text: text.trim() });
      records.refresh(); setStudent(""); setText(""); setAdding(false); setEditing(null);
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setSaving(false); }
  }

  return (
    <main className="pn-page">
      <div className="pn-top">
        <div>
          <h1>Progress notes</h1>
          <p>Record and review student interactions.</p>
        </div>
        <button className="pn-btn" type="button" onClick={() => { setAdding(!adding); setEditing(null); setStudent(""); setText(""); }}>
          {adding ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add note</>}
        </button>
      </div>
      <RequestState loading={records.loading || students.loading} error={records.error || students.error} onRetry={() => { records.refresh(); students.refresh(); }} />
      {error && <p className="crm-message crm-message--error" role="alert">{error}</p>}

      {adding && (
        <form className="pn-form" onSubmit={save}>
          <select aria-label="Student" required disabled={Boolean(editing)} value={student} onChange={(e) => setStudent(e.target.value)}>
            <option value="">Select a student</option>
            {students.data.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} (ASP-{s.id})</option>)}
          </select>
          <textarea
            rows={3}
            required
            maxLength={10000}
            aria-label="Progress note"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a note..."
          />
          <button className="pn-btn" type="submit" disabled={saving}>{saving ? "Saving..." : "Save note"}</button>
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
            <small>{n.author_name || "Former staff member"}</small>
            {(user?.can_manage || n.author === user?.id) && <div className="crm-inline-actions">
              <button type="button" onClick={() => { setEditing(n.id); setStudent(String(records.data.find((item) => item.id === n.id).student)); setText(n.text); setAdding(true); }}>Edit</button>
              <button type="button" onClick={async () => {
                if (!window.confirm("Delete this progress note?")) return;
                try { await api.delete(`/progress-notes/${n.id}/`); records.refresh(); }
                catch (requestError) { setError(errorMessage(requestError)); }
              }}>Delete</button>
            </div>}
          </li>
        ))}
        {visible.length === 0 && <li className="pn-empty">No notes found.</li>}
      </ul>
    </main>
  );
}
