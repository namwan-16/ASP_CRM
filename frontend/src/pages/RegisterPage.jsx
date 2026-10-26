// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import "./Auth.css";
// import signup from "../assets/images/signup.png";

// const emptyForm = {
//   email: "",
//   first_name: "",
//   last_name: "",
//   password: "",
//   password_confirm: "",
// };

// export default function RegisterPage() {
//   const { register } = useAuth();
//   const navigate = useNavigate();

//   const [form, setForm] = useState(emptyForm);
//   const [error, setError] = useState("");
//   const [submitting, setSubmitting] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   function update(event) {
//     const { name, value } = event.target;

//     setForm((current) => ({
//       ...current,
//       [name]: value,
//     }));
//   }

//   async function handleSubmit(event) {
//     event.preventDefault();
//     setError("");

//     if (form.password !== form.password_confirm) {
//       setError("The passwords do not match.");
//       return;
//     }

//     setSubmitting(true);

//     try {
//       await register({ ...form, email: form.email.trim().toLowerCase() });
//       window.alert("Account created. An ASP administrator must approve your account before you can sign in.");
//       navigate("/login", { replace: true });
//     } catch (requestError) {
//       const data = requestError.response?.data;
//       const apiMessage =
//         data && typeof data === "object"
//           ? Object.values(data)
//               .flat()
//               .find((message) => typeof message === "string")
//           : null;

//       setError(apiMessage || "Your account could not be created. Please try again.");
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   return (
//     <main className="auth-layout">
//       <section className="brand-panel">

//         <p className="eyebrow">MU After School Program</p>
//         <h1>ASP CRM</h1>
//         <p>
//           Create an account to access the After School Program workspace.
//           Your role and permissions are managed by an ASP administrator.
//         </p>
//          <img
//                       className="brand-panel__illustration"
//                       src={signup}
//                       alt="Secure ASP CRM login"
//                     />
//       </section>

//       <section className="auth-card register-card">
//         <header>
//           <p className="eyebrow">Account registration</p>
//           <h2>Create your account</h2>
//           <p className="muted">
//             Use your ASP email address and your personal details.
//           </p>
//         </header>

//         <form onSubmit={handleSubmit}>
//           <div className="form-grid">
//             <label>
//               First name
//               <input
//                 name="first_name"
//                 type="text"
//                 autoComplete="given-name"
//                 required
//                 value={form.first_name}
//                 onChange={update}
//                 disabled={submitting}
//               />
//             </label>

//             <label>
//               Last name
//               <input
//                 name="last_name"
//                 type="text"
//                 autoComplete="family-name"
//                 required
//                 value={form.last_name}
//                 onChange={update}
//                 disabled={submitting}
//               />
//             </label>
//           </div>

//           <label>
//             Email address
//             <input
//               name="email"
//               type="email"
//               autoComplete="email"
//               required
//               value={form.email}
//               onChange={update}
//               disabled={submitting}
//             />
//           </label>

//           <div className="form-grid">
//             <label>
//               Password
//               <input
//                 name="password"
//                 type="password"
//                 autoComplete="new-password"
//                 required
//                 value={form.password}
//                 onChange={update}
//                 disabled={submitting}
//               />
//             </label>

//             <label>
//               Confirm password
//               <input
//                 name="password_confirm"
//                 type="password"
//                 autoComplete="new-password"
//                 required
//                 value={form.password_confirm}
//                 onChange={update}
//                 disabled={submitting}
//               />
//             </label>
//           </div>

//           {error && (
//             <p className="error-message" role="alert">
//               {error}
//             </p>
//           )}

//           <button type="submit" disabled={submitting}>
//             {submitting ? "Creating account…" : "Create account"}
//           </button>
//         </form>

//         <p className="muted">
//           Already have an account? <Link to="/login">Sign in</Link>
//         </p>
//       </section>
//     </main>
//   );
// }


import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  GraduationCap,
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import signup from "../assets/images/signup.png";
import "./Auth.css";

const emptyForm = {
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  password_confirm: "",
};

function BrandLogo() {
  return (
    <div className="register-brand">
      <GraduationCap
        className="register-brand__icon"
        aria-hidden="true"
      />

      <div className="register-brand__text">
        <h1>ASP CRM</h1>
        <p>MU AFTER SCHOOL PROGRAM</p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  function update(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password !== form.password_confirm) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await register({
        ...form,
        email: form.email.trim().toLowerCase(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      });

      window.alert(
        "Account created. An ASP administrator must approve your account before you can sign in."
      );

      navigate("/login", { replace: true });
    } catch (requestError) {
      const data = requestError.response?.data;

      const apiMessage =
        data && typeof data === "object"
          ? Object.values(data)
              .flat()
              .find((message) => typeof message === "string")
          : null;

      setError(
        apiMessage ||
          "Your account could not be created. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="register-page">
      {/* Left branding and illustration panel */}
      <section
        className="register-page__visual"
        aria-label="ASP CRM introduction"
      >
        <BrandLogo />

        <div className="register-page__illustration-wrap">
          <img
            className="register-page__illustration"
            src={signup}
            alt="Student using a laptop with an educational dashboard and security shield"
          />
        </div>

        <div className="register-page__caption">
          <span className="register-page__accent-line" />

          <h2>
            A secure workspace for the
            <br />
            After School Program
          </h2>

          <p>
            Manage student information and program
            records in one secure place.
          </p>
        </div>

        <span
          className="register-page__decoration register-page__decoration--one"
          aria-hidden="true"
        />
        <span
          className="register-page__decoration register-page__decoration--two"
          aria-hidden="true"
        />
      </section>

      {/* Right registration panel */}
      <section className="register-page__content">
        <div className="register-card">
          <header className="register-card__header">
            <p className="register-card__eyebrow">
              Account registration
            </p>

            <h2>Create your account</h2>

            <p className="register-card__description">
              Use your ASP email address and your personal details.
            </p>
          </header>

          <form
            className="register-form"
            onSubmit={handleSubmit}
          >
            {/* First name and last name */}
            <div className="register-form__grid">
              <label className="register-field">
                <span>First name</span>

                <div className="register-field__input-wrap">
                  <UserRound aria-hidden="true" />

                  <input
                    name="first_name"
                    type="text"
                    placeholder="Enter your first name"
                    autoComplete="given-name"
                    required
                    value={form.first_name}
                    onChange={update}
                    disabled={submitting}
                  />
                </div>
              </label>

              <label className="register-field">
                <span>Last name</span>

                <div className="register-field__input-wrap">
                  <UserRound aria-hidden="true" />

                  <input
                    name="last_name"
                    type="text"
                    placeholder="Enter your last name"
                    autoComplete="family-name"
                    required
                    value={form.last_name}
                    onChange={update}
                    disabled={submitting}
                  />
                </div>
              </label>
            </div>

            {/* Email */}
            <label className="register-field">
              <span>Email address</span>

              <div className="register-field__input-wrap">
                <Mail aria-hidden="true" />

                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck="false"
                  required
                  value={form.email}
                  onChange={update}
                  disabled={submitting}
                />
              </div>
            </label>

            {/* Password and confirm password */}
            <div className="register-form__grid">
              <label className="register-field">
                <span>Password</span>

                <div className="register-field__input-wrap">
                  <LockKeyhole aria-hidden="true" />

                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="new-password"
                    required
                    value={form.password}
                    onChange={update}
                    disabled={submitting}
                  />

                  <button
                    className="register-field__toggle"
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
                      <EyeOff aria-hidden="true" />
                    ) : (
                      <Eye aria-hidden="true" />
                    )}
                  </button>
                </div>
              </label>

              <label className="register-field">
                <span>Confirm password</span>

                <div className="register-field__input-wrap">
                  <LockKeyhole aria-hidden="true" />

                  <input
                    name="password_confirm"
                    type={
                      showConfirmPassword ? "text" : "password"
                    }
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    required
                    value={form.password_confirm}
                    onChange={update}
                    disabled={submitting}
                  />

                  <button
                    className="register-field__toggle"
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (visible) => !visible
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    aria-pressed={showConfirmPassword}
                    disabled={submitting}
                  >
                    {showConfirmPassword ? (
                      <EyeOff aria-hidden="true" />
                    ) : (
                      <Eye aria-hidden="true" />
                    )}
                  </button>
                </div>
              </label>
            </div>

            {error && (
              <p
                className="register-form__error"
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              className="register-form__submit"
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
            >
              <span>
                {submitting
                  ? "Creating account..."
                  : "Create account"}
              </span>

              {!submitting && (
                <ArrowRight aria-hidden="true" />
              )}
            </button>
          </form>

          <footer className="register-card__footer">
            <p>
              Already have an account?
              <Link to="/login">Sign in</Link>
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}
