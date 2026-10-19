import { useState } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import secureLoginIllustration from "../assets/Secure login.svg";
import "./LoginPage.css";
import { LogIn, Eye, EyeOff, User, Lock } from "lucide-react";
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
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
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

    if (!form.email.trim() || !form.password) {
      setError("Please enter both email and password.");
      return;
    }

    setSubmitting(true);

    try {
      await login(form.email.trim(), form.password);
      navigate("/dashboard", { replace: true });
    } catch {
      setError(
        "We couldn’t sign you in. Check your email and password, then try again.",
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
            <label className="login-page__field" htmlFor="login-email">
              <span>Email address</span>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                required
                value={form.email}
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

            {location.state?.message && (
              <p className="crm-message crm-message--success" role="status">
                {location.state.message}
              </p>
            )}
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
              {submitting ? "Signing in…" : <>Sign in  <LogIn size={18} /> </>}
              
            </button>
          </form>
          <div className="login-page__divider">
            <span>OR</span>
          </div>
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
