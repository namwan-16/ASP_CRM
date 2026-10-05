// import { useState } from "react";
// import { Link, Navigate, useNavigate } from "react-router-dom";

// import { useAuth } from "../context/AuthContext";

// export default function LoginPage() {
//   const { login, user } = useAuth();
//   const navigate = useNavigate();
//   const [form, setForm] = useState({ username: "", password: "" });
//   const [error, setError] = useState("");
//   const [submitting, setSubmitting] = useState(false);

//   if (user) return <Navigate to="/dashboard" replace />;

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setError("");
//     setSubmitting(true);
//     try {
//       await login(form.username, form.password);
//       navigate("/dashboard", { replace: true });
//     } catch {
//       setError("The username or password is incorrect.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <main className="auth-layout">
//       <section className="brand-panel">
//         <p className="eyebrow">Class Process Pipeline</p>
//         <h1>ASP CRM</h1>
//         <p>One secure workspace for class operations, presenters, and student support.</p>
//       </section>

//       <section className="auth-card">
//         <div>
//           <p className="eyebrow">Welcome back</p>
//           <h2>Sign in</h2>
//           <p className="muted">Use your ASP CRM account to continue.</p>
//         </div>

//         <form onSubmit={handleSubmit}>
//           <label>
//             Username
//             <input
//               autoComplete="username"
//               required
//               value={form.username}
//               onChange={(event) => setForm({ ...form, username: event.target.value })}
//             />
//           </label>
//           <label>
//             Password
//             <input
//               type="password"
//               autoComplete="current-password"
//               required
//               value={form.password}
//               onChange={(event) => setForm({ ...form, password: event.target.value })}
//             />
//           </label>
//           {error && <p className="error-message">{error}</p>}
//           <button type="submit" disabled={submitting}>
//             {submitting ? "Signing in…" : "Sign in"}
//           </button>
//         </form>

//         <p className="muted">
//           Need an account? <Link to="/register">Create account</Link>
//         </p>
//       </section>
//     </main>
//   );
// }

import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import secureLoginIllustration from "../assets/secure login.svg";
import "./LoginPage.css";

function BrandMark() {
  return (
    <svg
      className="login-page__brand-icon"
      viewBox="0 0 64 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m4 16 28-11 28 11-28 11L4 16Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M14 21v13c10 8 26 8 36 0V21M60 16v16"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(form.username.trim(), form.password);
      navigate("/dashboard", { replace: true });
    } catch {
      setError(
        "We couldn’t sign you in. Check your username and password, then try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-page__art-panel" aria-label="ASP CRM">
        <img
          className="login-page__illustration"
          src={secureLoginIllustration}
          alt=""
        />
        <p className="login-page__art-caption">
          A secure workspace for the After School Program
        </p>
      </section>

      <section className="login-page__content">
        <div className="login-page__form-wrap">
          <div className="login-page__brand">
            <BrandMark />
            <span>ASP CRM</span>
          </div>

          <header className="login-page__heading">
            <p className="login-page__eyebrow">MU After School Program</p>
            <h1>Welcome back</h1>
            <p>Sign in with your authorised ASP account.</p>
          </header>

          <form className="login-page__form" onSubmit={handleSubmit}>
            <label className="login-page__field" htmlFor="login-username">
              <span>Username</span>
              <input
                id="login-username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
                required
                value={form.username}
                onChange={updateField}
                disabled={submitting}
              />
            </label>

            <div className="login-page__field">
              <label htmlFor="login-password">Password</label>

              <span className="login-page__password-wrap">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={updateField}
                  disabled={submitting}
                />

                <button
                  className="login-page__password-toggle"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  disabled={submitting}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </span>
            </div>

            {error && (
              <p className="login-page__error" role="alert">
                {error}
              </p>
            )}

            <button
              className="login-page__submit"
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="login-page__help">
            Forgot your password?{" "}
            <a href="mailto:afterschoolprogram@murdoch.edu.au?subject=ASP%20CRM%20login%20assistance">
              Contact the ASP coordinator
            </a>
          </p>

          <p className="login-page__register">
            Need an ASP CRM account?{" "}
            <Link to="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
