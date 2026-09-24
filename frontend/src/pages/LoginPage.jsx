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
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import icon from "../assets/images/icon.png";

const NAVY = "#1e3a5f";
const NAVY_DEEP = "#0f1f33";
const MUTED = "#64748b";

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If the user is already logged in, send them to the dashboard.
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setSubmitting(true);

    try {
      // Use the real authentication functionality
      // from AuthContext.
      await login(username, password);

      // Login successful
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setError("The username or password is incorrect.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E8EDF5] p-4">
      <div className="flex w-full max-w-[900px] overflow-hidden rounded-2xl shadow-2xl bg-white min-h-[560px]">

        {/* =====================================================
            LEFT PANEL
        ====================================================== */}
        <div
          className="relative hidden md:flex flex-col items-center justify-center w-[48%] overflow-hidden"
          style={{
            background: `linear-gradient(
              160deg,
              ${NAVY_DEEP} 0%,
              ${NAVY} 55%,
              #243b5c 100%
            )`,
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-white/5" />

          <div className="absolute -bottom-16 -right-8 w-56 h-56 rounded-full bg-white/5" />

          <div className="relative z-10 flex flex-col items-center px-8 text-center">

            {/* Login illustration */}
            <div className="relative z-10 w-full max-w-[360px]">
              <img
                src={icon}
                alt="ASP CRM secure account illustration"
                className="w-full object-contain"
              />
            </div>

            {/* Branding text */}
            <div className="mt-8">
              <div className="text-white/90 font-semibold text-[15px]">
                ASP Class Process Pipeline
              </div>

              <div className="text-white/45 text-xs mt-1">
                MU After School Program · Mathematics & Physical Sciences
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            RIGHT LOGIN FORM
        ====================================================== */}
        <div className="flex flex-1 flex-col justify-center px-8 py-10 sm:px-12">

          {/* Logo / heading */}
          <div className="mb-6 flex items-center gap-2.5">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: NAVY }}
            >
              <GraduationCap size={24} className="text-white" />
            </div>

            <div>
              <div
                className="text-[18px] font-bold leading-tight"
                style={{ color: NAVY }}
              >
                ASP CRM
              </div>

              <div
                className="text-[11px] font-medium tracking-wide"
                style={{ color: MUTED }}
              >
                Class Process Pipeline
              </div>
            </div>
          </div>

          {/* Welcome text */}
          <h1
            className="text-[22px] font-bold mb-1"
            style={{ color: NAVY }}
          >
            Welcome back
          </h1>

          <p
            className="text-[13px] mb-7"
            style={{ color: MUTED }}
          >
            Sign in with your authorised ASP account.
          </p>

          {/* Backend authentication error */}
          {error && (
            <div className="mb-4 rounded-lg px-3 py-2 text-[12.5px] font-medium bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* =================================================
              LOGIN FORM
          ================================================== */}
          <form onSubmit={handleSubmit}>

            {/* Username */}
            <div className="mb-4">
              <label
                className="block text-[12.5px] font-semibold mb-1.5 text-slate-700"
              >
                Username
              </label>

              <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <Mail size={17} className="text-slate-400" />

                <input
                  type="text"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setError("");
                  }}
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                  disabled={submitting}
                  className="flex-1 bg-transparent text-[13.5px] text-slate-700 outline-none disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-4">
              <label
                className="block text-[12.5px] font-semibold mb-1.5 text-slate-700"
              >
                Password
              </label>

              <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <Lock size={17} className="text-slate-400" />

                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={submitting}
                  className="flex-1 bg-transparent text-[13.5px] text-slate-700 outline-none disabled:opacity-60"
                />

                {/* Show / hide password */}
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  disabled={submitting}
                  className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                  aria-label={
                    showPass
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPass ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="mb-6 text-right">
              <a
                
                className="text-[12.5px] font-medium text-[rgb(30, 58, 95)] hover:underline"
              >
                Forgot Password?
              </a>
            </div>

            {/* Sign in button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg py-3 text-[14px] font-semibold text-white transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: NAVY }}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Help */}
          <p
            className="mt-6 text-center text-[12.5px]"
            style={{ color: MUTED }}
          >
            Need help?{" "}
            <span
              className="font-medium"
              style={{ color: NAVY }}
            >
              Contact the ASP coordinator.
            </span>
          </p>

          {/* Register */}
          <div className="mt-5 pt-5 border-t border-slate-100 text-center">
            <p className="text-center text-sm text-slate-500 mt-6">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-[#23466e] hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}


