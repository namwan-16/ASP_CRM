import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const emptyForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  password_confirm: "",
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      navigate("/login", { replace: true });
    } catch (requestError) {
      const data = requestError.response?.data;
      const firstMessage = data && Object.values(data).flat()[0];
      setError(firstMessage || "The account could not be created.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-layout">
      <section className="brand-panel">
        <p className="eyebrow">Secure onboarding</p>
        <h1>Join ASP CRM</h1>
        <p>New registrations start with assistant access. An administrator can update your role.</p>
      </section>

      <section className="auth-card register-card">
        <div>
          <p className="eyebrow">New account</p>
          <h2>Create your profile</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              First name
              <input name="first_name" required value={form.first_name} onChange={update} />
            </label>
            <label>
              Last name
              <input name="last_name" required value={form.last_name} onChange={update} />
            </label>
          </div>
          <label>
            Username
            <input name="username" required value={form.username} onChange={update} />
          </label>
          <label>
            Email
            <input name="email" type="email" required value={form.email} onChange={update} />
          </label>
          <div className="form-grid">
            <label>
              Password
              <input name="password" type="password" required value={form.password} onChange={update} />
            </label>
            <label>
              Confirm password
              <input name="password_confirm" type="password" required value={form.password_confirm} onChange={update} />
            </label>
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="muted">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}

