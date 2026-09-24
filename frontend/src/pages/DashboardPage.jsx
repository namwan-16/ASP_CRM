import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
const cards = [
  ["Students", "Registration, guardian links, and class allocation"],
  ["Attendance", "Track attendance and late notifications"],
  ["Progress notes", "Secure presenter notes and student history"],
  ["Payments", "Imports, refunds, and approval workflow"],
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const displayName = `${user.first_name} ${user.last_name}`.trim() || user.username;

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">ASP Class Process Pipeline</p>
          <h1>Dashboard</h1>
        </div>
        <button className="secondary-button" onClick={logout}>Sign out</button>
      </header>

      <section className="welcome-panel">
        <div>
          <p className="eyebrow">Authenticated through Django REST API</p>
          <h2>Welcome, {displayName}</h2>
          <p>Your frontend and backend are connected successfully.</p>
        </div>
        <span className="role-badge">{user.role}</span>
      </section>

      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Next modules</p>
            <h2>CRM workspace</h2>
          </div>
          <p className="muted">Starter placeholders ready for your project requirements.</p>
        </div>
        <div className="card-grid">
          {cards.map(([title, description]) => (
            <article className="module-card" key={title}>
              <span className="module-icon">{title.charAt(0)}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="coming-soon">Ready to build</span>
            </article>
          ))}
        </div>
      </section>
      <Link
  className="card-link"
  to="/students/import"
>
  Import students from Excel
</Link>
    </main>
  );
}

