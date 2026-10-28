// import { useState } from "react";
// import { Navigate, useNavigate, useLocation } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import secureLoginIllustration from "../assets/Secure login.svg";
// import "./LoginPage.css";
// import { LogIn, Eye, EyeOff, User, Lock } from "lucide-react";
// function BrandMark() {
//   return (
//     <svg
//       className="login-page__brand-icon"
//       viewBox="0 0 64 48"
//       fill="none"
//       aria-hidden="true"
//     >
//       <path
//         d="m4 16 28-11 28 11-28 11L4 16Z"
//         stroke="currentColor"
//         strokeWidth="3"
//         strokeLinejoin="round"
//       />
//       <path
//         d="M14 21v13c10 8 26 8 36 0V21M60 16v16"
//         stroke="currentColor"
//         strokeWidth="3"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//       />
//     </svg>
//   );
// }

// export default function LoginPage() {
//   const { login, user } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [form, setForm] = useState({ email: "", password: "" });
//   const [fieldErrors, setFieldErrors] = useState({});
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState("");
//   const [submitting, setSubmitting] = useState(false);

//   if (user) {
//     return <Navigate to="/dashboard" replace />;
//   }

//   function updateField(event) {
//     const { name, value } = event.target;

//     setForm((current) => ({ ...current, [name]: value }));
//     setFieldErrors((current) => ({ ...current, [name]: "" }));
//     setError("");
//   }

//   async function handleSubmit(event) {
//     event.preventDefault();
//     setError("");

//     const email = form.email.trim();
//     const nextErrors = {};

//     if (!email) {
//       nextErrors.email = "Enter your email address.";
//     } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//       nextErrors.email = "Enter a valid email address.";
//     }

//     if (!form.password) {
//       nextErrors.password = "Enter your password.";
//     }

//     setFieldErrors(nextErrors);

//     if (Object.keys(nextErrors).length > 0) {
//       return;
//     }

//     setSubmitting(true);

//     try {
//       await login(email, form.password);
//       navigate("/dashboard", { replace: true });
//     } catch {
//       setError(
//         "We couldn’t sign you in. Check your email and password, then try again.",
//       );
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   return (
//     <main className="login-page">
//       <section className="login-page__art-panel" aria-label="ASP CRM">
//         <img
//           className="login-page__illustration"
//           src={secureLoginIllustration}
//           alt=""
//         />
//         <p className="login-page__art-caption">
//           A secure workspace for the After School Program
//         </p>
//       </section>

//       <section className="login-page__content">
//         <div className="login-page__form-wrap">
//           <div className="login-page__brand">
//             <BrandMark />
//             <span>ASP CRM</span>
//           </div>

//           <header className="login-page__heading">
//             <p className="login-page__eyebrow">MU After School Program</p>
//             <h1>Welcome back</h1>
//             <p>Sign in with your authorised ASP account.</p>
//           </header>

//           <form className="login-page__form" onSubmit={handleSubmit} noValidate>
//             <label className="login-page__field" htmlFor="login-email">
//               <span>Email address</span>
//               <input
//                 id="login-email"
//                 name="email"
//                 type="email"
//                 autoComplete="email"
//                 autoCapitalize="none"
//                 spellCheck="false"
//                 required
//                 value={form.email}
//                 onChange={updateField}
//                 disabled={submitting}
//                 aria-invalid={Boolean(fieldErrors.email)}
//                 aria-describedby={
//                   fieldErrors.email ? "login-email-error" : undefined
//                 }
//               />
//               {fieldErrors.email && (
//                 <span
//                   className="login-page__field-error"
//                   id="login-email-error"
//                   role="alert"
//                 >
//                   {fieldErrors.email}
//                 </span>
//               )}
//             </label>

//             <div className="login-page__field">
//               <label htmlFor="login-password">Password</label>

//               <span className="login-page__password-wrap">
//                 <input
//                   id="login-password"
//                   name="password"
//                   type={showPassword ? "text" : "password"}
//                   autoComplete="current-password"
//                   required
//                   value={form.password}
//                   onChange={updateField}
//                   disabled={submitting}
//                   aria-invalid={Boolean(fieldErrors.password)}
//                   aria-describedby={
//                     fieldErrors.password ? "login-password-error" : undefined
//                   }
//                 />

//                 <button
//                   className="login-page__password-toggle"
//                   type="button"
//                   onClick={() => setShowPassword((visible) => !visible)}
//                   aria-label={showPassword ? "Hide password" : "Show password"}
//                   aria-pressed={showPassword}
//                   disabled={submitting}
//                 >
//                   {showPassword ? "Hide" : "Show"}
//                 </button>
//               </span>

//               {fieldErrors.password && (
//                 <span
//                   className="login-page__field-error"
//                   id="login-password-error"
//                   role="alert"
//                 >
//                   {fieldErrors.password}
//                 </span>
//               )}
//             </div>

//             {location.state?.message && (
//               <p className="crm-message crm-message--success" role="status">
//                 {location.state.message}
//               </p>
//             )}

//             {error && (
//               <p className="login-page__error" role="alert">
//                 {error}
//               </p>
//             )}

//             <button
//               className="login-page__submit"
//               type="submit"
//               disabled={submitting}
//               aria-busy={submitting}
//             >
//               {submitting ? "Signing in…" : <>Sign in  <LogIn size={18} /> </>}
              
//             </button>
//           </form>
          
//           <p className="login-page__help">
//             Forgot your password?{" "}
//             <a href="mailto:afterschoolprogram@murdoch.edu.au?subject=ASP%20CRM%20login%20assistance">
//               Contact the ASP coordinator
//             </a>
//           </p>

//           {/* <p className="login-page__register">
//             Need an ASP CRM account?{" "}
//             <Link to="/register">Create an account</Link>
//           </p> */}
//         </div>
//       </section>
//     </main>
//   );
// }

import { useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import secureLoginIllustration from "../assets/Secure login.svg";
import "./LoginPage.css";
import { LogIn, Eye, EyeOff, User, Lock , Mail} from "lucide-react";

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

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [name]: "",
    }));

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const email = form.email.trim();
    const nextErrors = {};

    if (!email) {
      nextErrors.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Enter your password.";
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      await login(email, form.password);
      navigate("/dashboard", { replace: true });
    } catch {
      setError(
        "We couldn’t sign you in. Check your email and password, then try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      {/* LEFT SIDE */}
      <section className="login-page__art-panel" aria-label="ASP CRM">
        <div className="login-page__decor login-page__decor--one" />
        <div className="login-page__decor login-page__decor--two" />
        <div className="login-page__decor login-page__decor--three" />

        <div className="login-page__art-content">
          <div className="login-page__art-brand">
            <BrandMark />

            <div>
              <h2>ASP CRM</h2>
              <p>MU AFTER SCHOOL PROGRAM</p>
            </div>
          </div>

          <div className="login-page__illustration-wrap">
            <img
              className="login-page__illustration"
              src={secureLoginIllustration}
              alt="Secure ASP CRM login"
            />
          </div>

          <div className="login-page__art-caption">
            <span className="login-page__caption-line" />
            <p>
              A secure workspace for the
              <br />
              After School Program
            </p>
          </div>
        </div>
      </section>

      {/* RIGHT SIDE */}
      <section className="login-page__content">
        <div className="login-page__form-wrap">
          {/* MOBILE / RIGHT BRAND */}
          <div className="login-page__brand">
            <BrandMark />

            <div>
              <span>ASP CRM</span>
              <small>MU AFTER SCHOOL PROGRAM</small>
            </div>
          </div>

          <header className="login-page__heading">

            <h1>Welcome back</h1>

            <p>
              Sign in with your authorised ASP account.
            </p>
          </header>

          <form
            className="login-page__form"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* EMAIL */}
            <label
              className="login-page__field"
              htmlFor="login-email"
            >
              <span>Email address</span>

              <div className="login-page__input-wrap">
                <Mail
                  className="login-page__input-icon"
                  size={19}
                  strokeWidth={2}
                />

                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck="false"
                  placeholder="Enter your email address"
                  required
                  value={form.email}
                  onChange={updateField}
                  disabled={submitting}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email
                      ? "login-email-error"
                      : undefined
                  }
                />
              </div>

              {fieldErrors.email && (
                <span
                  className="login-page__field-error"
                  id="login-email-error"
                  role="alert"
                >
                  {fieldErrors.email}
                </span>
              )}
            </label>

            {/* PASSWORD */}
            <div className="login-page__field">
              <label htmlFor="login-password">
                Password
              </label>

              <div className="login-page__input-wrap">
                <Lock
                  className="login-page__input-icon"
                  size={19}
                  strokeWidth={2}
                />

                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  value={form.password}
                  onChange={updateField}
                  disabled={submitting}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password
                      ? "login-password-error"
                      : undefined
                  }
                />

                <button
                  className="login-page__password-toggle"
                  type="button"
                  onClick={() =>
                    setShowPassword((visible) => !visible)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  aria-pressed={showPassword}
                  disabled={submitting}
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>

              {fieldErrors.password && (
                <span
                  className="login-page__field-error"
                  id="login-password-error"
                  role="alert"
                >
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {/* SUCCESS MESSAGE */}
            {location.state?.message && (
              <p
                className="crm-message crm-message--success"
                role="status"
              >
                {location.state.message}
              </p>
            )}

            {/* ERROR MESSAGE */}
            {error && (
              <p
                className="login-page__error"
                role="alert"
              >
                {error}
              </p>
            )}

            {/* SIGN IN */}
            <button
              className="login-page__submit"
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? (
                "Signing in…"
              ) : (
                <>
                  <span>Sign in</span>
                  <LogIn size={18} strokeWidth={2.2} />
                </>
              )}
            </button>
          </form>

          {/* OR DIVIDER */}
          <div className="login-page__divider">
            <span />
            <strong>OR</strong>
            <span />
          </div>

          {/* FORGOT PASSWORD */}
          <p className="login-page__help">
            <span>Forgot your password?</span>

            <i aria-hidden="true" />

            <a
              href="mailto:afterschoolprogram@murdoch.edu.au?subject=ASP%20CRM%20login%20assistance"
            >
              Contact the ASP coordinator
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
