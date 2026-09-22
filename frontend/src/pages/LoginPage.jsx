import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form.username, form.password);
      navigate("/dashboard", { replace: true });
    } catch {
      setError("The username or password is incorrect.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-layout">
      <section className="brand-panel">
        <p className="eyebrow">Class Process Pipeline</p>
        <h1>ASP CRM</h1>
        <p>One secure workspace for class operations, presenters, and student support.</p>
      </section>

      <section className="auth-card">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h2>Sign in</h2>
          <p className="muted">Use your ASP CRM account to continue.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Username
            <input
              autoComplete="username"
              required
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </label>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="muted">
          Need an account? <Link to="/register">Create account</Link>
        </p>
      </section>
    </main>
  );
}

