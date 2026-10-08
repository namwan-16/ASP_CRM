import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import "./Reports.css";

// ---- Sample data: replace with your API data -------------------------------
const CLASSES = ["Year 3 Maths", "Year 5 Reading", "Year 6 Science"];

const SESSIONS = [
  { date: "2026-09-08", cls: "Year 3 Maths", present: 15, total: 16, late: 1 },
  { date: "2026-09-15", cls: "Year 3 Maths", present: 14, total: 16, late: 2 },
  { date: "2026-09-22", cls: "Year 3 Maths", present: 16, total: 16, late: 0 },
  { date: "2026-09-10", cls: "Year 5 Reading", present: 17, total: 19, late: 3 },
  { date: "2026-09-24", cls: "Year 5 Reading", present: 18, total: 19, late: 1 },
  { date: "2026-09-12", cls: "Year 6 Science", present: 12, total: 14, late: 2 },
  { date: "2026-10-03", cls: "Year 6 Science", present: 13, total: 14, late: 0 },
];

const LATE = [
  { date: "2026-09-15", student: "Liam Nguyen", cls: "Year 3 Maths", minutes: 12 },
  { date: "2026-09-10", student: "Amelia Carter", cls: "Year 5 Reading", minutes: 8 },
  { date: "2026-09-12", student: "Zoe Patel", cls: "Year 6 Science", minutes: 15 },
];

const ENROLMENT = [
  { cls: "Year 3 Maths", enrolled: 16, capacity: 20 },
  { cls: "Year 5 Reading", enrolled: 19, capacity: 20 },
  { cls: "Year 6 Science", enrolled: 14, capacity: 18 },
];

const ACTIVITY = [
  { date: "2026-10-05", user: "TD", action: "Added a progress note for Amelia Carter" },
  { date: "2026-10-03", user: "MA", action: "Recorded attendance for Year 6 Science" },
  { date: "2026-10-01", user: "TD", action: "Uploaded registrations CSV" },
];
// -----------------------------------------------------------------------------

const TABS = ["Attendance", "Late arrivals", "Enrolment", "Activity"];
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const fmt = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

function csvDownload(name, columns, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [columns.map((c) => esc(c.label)).join(",")];
  rows.forEach((r) => lines.push(columns.map((c) => esc(r[c.key])).join(",")));
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [tab, setTab] = useState("Attendance");
  const [from, setFrom] = useState("2026-09-01");
  const [to, setTo] = useState("2026-10-06");
  const [cls, setCls] = useState("All");

  const report = useMemo(() => {
    const inRange = (r) => r.date >= from && r.date <= to && (cls === "All" || r.cls === cls);

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
      const avg = rows.length ? Math.round(rows.reduce((n, r) => n + r.minutes, 0) / rows.length) : 0;
      return {
        stats: [
          { n: rows.length, l: "Late arrivals" },
          { n: `${avg} min`, l: "Average lateness" },
          { n: new Set(rows.map((r) => r.student)).size, l: "Students affected" },
        ],
        columns: [
          { key: "student", label: "Student" },
          { key: "cls", label: "Class" },
          { key: "when", label: "Date" },
          { key: "minutes", label: "Minutes late" },
        ],
        rows,
      };
    }

    if (tab === "Enrolment") {
      const rows = ENROLMENT.filter((r) => cls === "All" || r.cls === cls).map((r) => ({
        ...r,
        rate: pct(r.enrolled, r.capacity),
      }));
      const enrolled = rows.reduce((n, r) => n + r.enrolled, 0);
      const capacity = rows.reduce((n, r) => n + r.capacity, 0);
      return {
        stats: [
          { n: enrolled, l: "Students enrolled" },
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

    const rows = ACTIVITY.filter((r) => r.date >= from && r.date <= to).map((r) => ({ ...r, when: fmt(r.date) }));
    return {
      stats: [
        { n: rows.length, l: "Actions logged" },
        { n: new Set(rows.map((r) => r.user)).size, l: "Active users" },
        { n: rows[0] ? rows[0].when : "–", l: "Latest activity" },
      ],
      columns: [
        { key: "when", label: "Date" },
        { key: "user", label: "User" },
        { key: "action", label: "Action" },
      ],
      rows,
    };
  }, [tab, from, to, cls]);

  const hideClass = tab === "Activity";
  const cols = `repeat(${report.columns.length}, minmax(0, 1fr))`;

  return (
    <main className="rp-page">
      <div className="rp-top">
        <div>
          <h1>Reports</h1>
          <p>View attendance, late arrivals, enrolment and activity.</p>
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