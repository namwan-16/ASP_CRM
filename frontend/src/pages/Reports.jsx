import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import "./Reports.css";
import useRecords from "../hooks/useRecords";
import RequestState from "../components/RequestState";


const TABS = ["Attendance", "Late arrivals", "Enrolment", "Progress notes"];
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const fmt = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

function csvDownload(name, columns, rows) {
  const esc = (v) => {
    let value = String(v ?? "");
    if (/^[\s]*[=+@-]/.test(value)) value = "'" + value;
    return `"${value.replace(/"/g, '""')}"`;
  };
  const lines = [columns.map((c) => esc(c.label)).join(",")];
  rows.forEach((r) => lines.push(columns.map((c) => esc(r[c.key])).join(",")));
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const sessions = useRecords("/sessions/");
  const attendance = useRecords("/attendance/");
  const notes = useRecords("/progress-notes/");
  const CLASSES = [...new Set(sessions.data.map((item) => item.course_name))];
  const SESSIONS = sessions.data.map((item) => {
    const marked = attendance.data.filter((row) => row.session === item.id);
    return { date: item.date, cls: item.course_name, present: marked.filter((row) => ["present", "late"].includes(row.status)).length,
      total: marked.length, late: marked.filter((row) => row.status === "late").length };
  });
  const LATE = attendance.data.filter((row) => row.status === "late").map((row) => ({ date: row.session_date, cls: row.course_name, student: row.student_name, notes: row.notes }));
  const ENROLMENT = sessions.data.map((row) => ({ cls: row.course_name, date: row.date, enrolled: row.students.length, capacity: row.capacity }));
  const ACTIVITY = notes.data.map((row) => ({ date: row.date, user: row.author_name || "Former staff", action: `${row.student_name}: ${row.text}` }));
  const [tab, setTab] = useState("Attendance");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cls, setCls] = useState("All");

  const report = useMemo(() => {
    const inRange = (r) => (!from || r.date >= from) && (!to || r.date <= to) && (cls === "All" || r.cls === cls);

    if (tab === "Attendance") {
      const s = SESSIONS.filter(inRange);
      const rows = CLASSES.filter((c) => cls === "All" || c === cls)
        .map((c) => {
          const x = s.filter((r) => r.cls === c);
          const present = x.reduce((n, r) => n + r.present, 0);
          const total = x.reduce((n, r) => n + r.total, 0);
          return { cls: c, sessions: x.length, present, rate: pct(present, total) };
        })
        .filter((r) => r.sessions > 0);
      const present = s.reduce((n, r) => n + r.present, 0);
      const total = s.reduce((n, r) => n + r.total, 0);
      return {
        stats: [
          { n: `${pct(present, total)}%`, l: "Average attendance" },
          { n: present, l: "Student check-ins" },
          { n: s.reduce((n, r) => n + r.late, 0), l: "Late arrivals" },
        ],
        columns: [
          { key: "cls", label: "Class" },
          { key: "sessions", label: "Sessions" },
          { key: "present", label: "Present" },
          { key: "rate", label: "Attendance", bar: true },
        ],
        rows,
      };
    }

    if (tab === "Late arrivals") {
      const rows = LATE.filter(inRange).map((r) => ({ ...r, when: fmt(r.date) }));
      return {
        stats: [
          { n: rows.length, l: "Late arrivals" },
          { n: new Set(rows.map((r) => r.student)).size, l: "Students affected" },
        ],
        columns: [
          { key: "student", label: "Student" },
          { key: "cls", label: "Class" },
          { key: "when", label: "Date" },
          { key: "notes", label: "Notes" },
        ],
        rows,
      };
    }

    if (tab === "Enrolment") {
      const rows = ENROLMENT.filter(inRange).map((r) => ({
        ...r,
        rate: pct(r.enrolled, r.capacity),
      }));
      const enrolled = rows.reduce((n, r) => n + r.enrolled, 0);
      const capacity = rows.reduce((n, r) => n + r.capacity, 0);
      return {
        stats: [
          { n: enrolled, l: "Session places filled" },
          { n: capacity - enrolled, l: "Spots available" },
          { n: `${pct(enrolled, capacity)}%`, l: "Capacity filled" },
        ],
        columns: [
          { key: "cls", label: "Class" },
          { key: "enrolled", label: "Enrolled" },
          { key: "capacity", label: "Capacity" },
          { key: "rate", label: "Filled", bar: true },
        ],
        rows,
      };
    }

    const rows = ACTIVITY.filter((r) => (!from || r.date >= from) && (!to || r.date <= to)).map((r) => ({ ...r, when: fmt(r.date) }));
    return {
      stats: [
        { n: rows.length, l: "Progress notes" },
        { n: new Set(rows.map((r) => r.user)).size, l: "Note authors" },
        { n: rows[0] ? rows[0].when : "–", l: "Latest note" },
      ],
      columns: [
        { key: "when", label: "Date" },
        { key: "user", label: "User" },
        { key: "action", label: "Note" },
      ],
      rows,
    };
  }, [tab, from, to, cls, sessions.data, attendance.data, notes.data]);

  const hideClass = tab === "Progress notes";
  const cols = `repeat(${report.columns.length}, minmax(0, 1fr))`;

  return (
    <main className="rp-page">
      <div className="rp-top">
        <div>
          <h1>Reports</h1>
          <p>View recorded attendance, late arrivals, enrolment and progress notes.</p>
        </div>
        <button
          className="rp-btn"
          type="button"
          disabled={report.rows.length === 0}
          onClick={() => csvDownload(`${tab.toLowerCase().replace(/\s/g, "-")}-report.csv`, report.columns, report.rows)}
        >
          <Download size={16} /> Export CSV
        </button>
      </div>
      <RequestState loading={sessions.loading || attendance.loading || notes.loading} error={sessions.error || attendance.error || notes.error} onRetry={() => { sessions.refresh(); attendance.refresh(); notes.refresh(); }} />

      <div className="rp-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`rp-tab${tab === t ? " is-active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rp-filters">
        <label>From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label>To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        {!hideClass && (
          <label>
            Class
            <select value={cls} onChange={(e) => setCls(e.target.value)}>
              <option value="All">All classes</option>
              {CLASSES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="rp-stats">
        {report.stats.map((s) => (
          <div className="rp-stat" key={s.l}>
            <strong>{s.n}</strong>
            <span>{s.l}</span>
          </div>
        ))}
      </div>

      <div className="rp-table">
        <div className="rp-tr rp-th" style={{ gridTemplateColumns: cols }}>
          {report.columns.map((c) => <span key={c.key}>{c.label}</span>)}
        </div>
        {report.rows.map((r, i) => (
          <div className="rp-tr" style={{ gridTemplateColumns: cols }} key={i}>
            {report.columns.map((c) => (
              <span key={c.key}>
                {c.bar ? (
                  <>
                    {r[c.key]}%
                    <i className="rp-bar"><b style={{ width: `${r[c.key]}%` }} /></i>
                  </>
                ) : (
                  r[c.key]
                )}
              </span>
            ))}
          </div>
        ))}
        {report.rows.length === 0 && <p className="rp-empty">No results for these filters.</p>}
      </div>
    </main>
  );
}
