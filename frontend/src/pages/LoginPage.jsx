import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function GraduationCapIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M4 17 24 8l20 9-20 9L4 17Z" />
      <path d="M11 22v11c6 6 20 6 26 0V22" />
      <path d="M44 17v13" />
    </svg>
  );
}

function SecurityIllustration() {
  return (
    <svg
      className="login-security-illustration"
      viewBox="0 0 720 680"
      role="img"
      aria-label="A student working securely on a laptop"
    >
      <circle cx="376" cy="298" r="214" fill="#dce3e6" />

      <g opacity="0.28" fill="none" stroke="#5f7890" strokeWidth="3">
        <path d="M102 205v-13a12 12 0 0 1 24 0v13" />
        <rect x="97" y="205" width="34" height="31" rx="4" />
        <path d="M589 358v-13a12 12 0 0 1 24 0v13" />
        <rect x="584" y="358" width="34" height="31" rx="4" />
        <path d="M526 98V87a9 9 0 0 1 18 0v11" />
        <rect x="522" y="98" width="26" height="25" rx="4" />
      </g>

      <g>
        <rect x="173" y="135" width="376" height="292" rx="9" fill="#f9fbfb" />
        <rect x="173" y="135" width="376" height="35" rx="9" fill="#263b49" />
        <rect x="173" y="161" width="376" height="9" fill="#263b49" />
        <circle cx="518" cy="152" r="4" fill="#f9fbfb" />
        <circle cx="533" cy="152" r="4" fill="#f9fbfb" />
        <circle cx="503" cy="152" r="4" fill="#f9fbfb" />

        <g fill="#e0e4e5">
          <rect x="193" y="194" width="72" height="39" />
          <rect x="282" y="194" width="72" height="39" />
          <rect x="447" y="194" width="80" height="39" />
          <rect x="193" y="252" width="44" height="39" />
          <rect x="466" y="252" width="61" height="39" />
          <rect x="193" y="310" width="71" height="39" />
          <rect x="283" y="310" width="61" height="39" />
          <rect x="453" y="310" width="74" height="39" />
          <rect x="193" y="368" width="48" height="38" />
          <rect x="468" y="368" width="59" height="38" />
        </g>

        <rect x="289" y="206" width="158" height="168" rx="8" fill="#ffffff" stroke="#183f63" strokeWidth="3" />
        <rect x="303" y="220" width="130" height="114" rx="5" fill="#f3f6f7" />
        <path d="M345 273v-17a23 23 0 0 1 46 0v17" fill="none" stroke="#183f63" strokeWidth="6" />
        <rect x="337" y="271" width="62" height="54" rx="5" fill="#183f63" />
        <circle cx="368" cy="291" r="6" fill="#ffffff" />
        <path d="M368 296v13" stroke="#ffffff" strokeWidth="4" />
        <rect x="306" y="343" width="124" height="18" rx="9" fill="#dce3e6" />
        <g fill="#183f63">
          <circle cx="320" cy="352" r="3" />
          <circle cx="333" cy="352" r="3" />
          <circle cx="346" cy="352" r="3" />
          <circle cx="359" cy="352" r="3" />
          <circle cx="372" cy="352" r="3" />
          <circle cx="385" cy="352" r="3" />
          <circle cx="398" cy="352" r="3" />
          <circle cx="411" cy="352" r="3" />
        </g>
      </g>

      <g>
        <path d="M160 600c12-110 10-164-33-233" fill="none" stroke="#0f2c47" strokeWidth="5" />
        <path d="M136 495c-45-42-56-86-28-114 43 37 51 75 28 114Z" fill="#102f4b" />
        <path d="M151 538c-18-56-8-97 27-109 21 49 12 86-27 109Z" fill="#315d78" />
        <path d="M125 451c-32-32-36-64-13-82 29 29 34 56 13 82Z" fill="#315d78" />
        <path d="M157 576c-43-23-62-54-46-80 40 19 55 47 46 80Z" fill="#102f4b" />
        <rect x="117" y="575" width="71" height="48" rx="4" fill="#102f4b" />
      </g>

      <g>
        <path d="M243 470c-58-12-112 21-130 81-9 30-5 57 5 77h116c-14-66 4-110 53-134l-44-24Z" fill="#f3f6f7" />
        <path d="M178 541c13-61 38-96 80-102 42-6 74 22 84 78l-49 18c-8-30-20-43-39-39-21 5-30 31-32 75l-44-30Z" fill="#142f49" />
        <circle cx="289" cy="414" r="38" fill="#f3f6f7" />
        <path d="M256 413c-5-42 15-67 50-62 23 3 34 18 38 35-19-9-35-8-47 3-10 10-24 18-41 24Z" fill="#142f49" />
        <path d="M318 444c-5 20-16 30-34 31l5 33 49-6-20-58Z" fill="#f3f6f7" />
        <path d="M296 538c57 8 92 0 125-24l15 20c-33 38-81 52-146 45l6-41Z" fill="#f3f6f7" />
        <path d="M275 501c42 8 70 33 87 72l-71 17-52-42 36-47Z" fill="#183f63" />
        <path d="M233 578c36 3 69 16 99 40l-19 25H199l34-65Z" fill="#142f49" />
      </g>

      <g>
        <rect x="335" y="526" width="211" height="19" rx="4" fill="#dce3e6" stroke="#173b5a" strokeWidth="3" />
        <path d="M365 526h150l-26-75H389l-24 75Z" fill="#f7f9fa" stroke="#173b5a" strokeWidth="4" />
        <path d="M401 511h77" stroke="#a4b2ba" strokeWidth="4" />
        <rect x="322" y="545" width="249" height="18" rx="4" fill="#f7f9fa" stroke="#173b5a" strokeWidth="3" />
        <path d="M348 563v88M545 563v88" stroke="#f7f9fa" strokeWidth="8" />
        <path d="M378 563 363 651M515 563l16 88" stroke="#6e8495" strokeWidth="4" />
        <rect x="374" y="574" width="144" height="44" rx="4" fill="none" stroke="#6e8495" strokeWidth="3" />
      </g>

      <g>
        <path d="M503 501h48l-4 43h-40l-4-43Z" fill="#f3f6f7" stroke="#173b5a" strokeWidth="3" />
        <path d="M527 499c-1-25 7-40 25-51M528 496c-13-19-16-35-8-48" fill="none" stroke="#173b5a" strokeWidth="4" />
        <path d="M549 461c-17 2-24-6-22-23 17-1 25 7 22 23ZM519 465c-15-7-18-18-10-32 15 7 18 18 10 32Z" fill="#315d78" />
      </g>

      <path d="M76 652h556" stroke="#102f4b" strokeWidth="4" opacity="0.7" />
    </svg>
  );
}

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
    <main className="login-page">
      <section className="login-art-panel" aria-hidden="true">
        <SecurityIllustration />
      </section>

      <section className="login-form-panel">
        <div className="login-card">
          <div className="login-brand">
            <GraduationCapIcon />
            <span>ASP CRM</span>
          </div>

          <div className="login-heading">
            <h1>Welcome back</h1>
            <p>Sign in with your authorised ASP account.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="login-username">
              Username
              <input
                id="login-username"
                name="username"
                autoComplete="username"
                placeholder="Enter your username"
                required
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
              />
            </label>

            <label htmlFor="login-password">
              Password
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
            </label>

            <button
              className="forgot-password-link"
              type="button"
              onClick={() => setError("Please contact the ASP coordinator to reset your password.")}
            >
              Forgot password?
            </button>

            {error && <p className="login-message">{error}</p>}

            <button className="login-submit" type="submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="login-support">
            <span>Need help?</span>
            <span>Contact the ASP coordinator.</span>
          </div>

          <p className="login-register">
            Need an account? <Link to="/register">Create account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
