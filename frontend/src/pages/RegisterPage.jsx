// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";

// import { useAuth } from "../context/AuthContext";

// const emptyForm = {
//   username: "",
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

//   const update = (event) => {
//     setForm({ ...form, [event.target.name]: event.target.value });
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setError("");
//     setSubmitting(true);
//     try {
//       await register(form);
//       navigate("/login", { replace: true });
//     } catch (requestError) {
//       const data = requestError.response?.data;
//       const firstMessage = data && Object.values(data).flat()[0];
//       setError(firstMessage || "The account could not be created.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <main className="auth-layout">
//       <section className="brand-panel">
//         <p className="eyebrow">Secure onboarding</p>
//         <h1>Join ASP CRM</h1>
//         <p>New registrations start with assistant access. An administrator can update your role.</p>
//       </section>

//       <section className="auth-card register-card">
//         <div>
//           <p className="eyebrow">New account</p>
//           <h2>Create your profile</h2>
//         </div>
//         <form onSubmit={handleSubmit}>
//           <div className="form-grid">
//             <label>
//               First name
//               <input name="first_name" required value={form.first_name} onChange={update} />
//             </label>
//             <label>
//               Last name
//               <input name="last_name" required value={form.last_name} onChange={update} />
//             </label>
//           </div>
//           <label>
//             Username
//             <input name="username" required value={form.username} onChange={update} />
//           </label>
//           <label>
//             Email
//             <input name="email" type="email" required value={form.email} onChange={update} />
//           </label>
//           <div className="form-grid">
//             <label>
//               Password
//               <input name="password" type="password" required value={form.password} onChange={update} />
//             </label>
//             <label>
//               Confirm password
//               <input name="password_confirm" type="password" required value={form.password_confirm} onChange={update} />
//             </label>
//           </div>
//           {error && <p className="error-message">{error}</p>}
//           <button type="submit" disabled={submitting}>
//             {submitting ? "Creating…" : "Create account"}
//           </button>
//         </form>
//         <p className="muted">
//           Already registered? <Link to="/login">Sign in</Link>
//         </p>
//       </section>
//     </main>
//   );
// }

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AtSign,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import signup from "../assets/images/signup.png"; 

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const update = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    setError("");
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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl overflow-hidden flex min-h-[720px]">

        {/* LEFT SIDE */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#172f4d] relative overflow-hidden flex-col items-center justify-center p-10 text-white">
          {/* Background circles */}
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-[#24466e] rounded-full opacity-50"></div>
          <div className="absolute -bottom-24 -right-20 w-72 h-72 bg-[#24466e] rounded-full opacity-40"></div>

          <div className="bg-[#2d496b] border border-slate-500/40 rounded-2xl p-5 shadow-lg relative z-10">
            <div className="relative z-10 w-full max-w-[360px]">
              <img
                src={signup}
                alt="ASP CRM secure account illustration"
                className="w-full object-contain"
              />
            </div>
          </div>

          <div className="relative z-10 text-center mt-8">
            <h2 className="text-2xl font-bold">ASP Class Process Pipeline</h2>
            <p className="mt-2 text-slate-300">
              MU After School Program · Mathematics & Physical Sciences
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-[480px]">

            {/* Logo */}
            <div className="flex items-center gap-4 mb-7">
              <div className="w-14 h-14 bg-[#23466e] rounded-xl flex items-center justify-center">
                <GraduationCap size={30} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#23466e]">ASP CRM</h1>
                <p className="text-slate-500">Class Process Pipeline</p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-7">
              <h2 className="text-3xl font-bold text-[#173c68]">Create account</h2>
              <p className="mt-2 text-slate-500">
                New registrations start with assistant access. An administrator can update your role.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* First + Last name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    First name
                  </label>
                  <div className="relative">
                    <User
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      name="first_name"
                      required
                      value={form.first_name}
                      onChange={update}
                      placeholder="e.g. Marcus"
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#23466e] focus:ring-2 focus:ring-[#23466e]/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Last name
                  </label>
                  <div className="relative">
                    <User
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      name="last_name"
                      required
                      value={form.last_name}
                      onChange={update}
                      placeholder="e.g. Anderson"
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#23466e] focus:ring-2 focus:ring-[#23466e]/10"
                    />
                  </div>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <AtSign
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    name="username"
                    required
                    value={form.username}
                    onChange={update}
                    placeholder="Choose a username"
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#23466e] focus:ring-2 focus:ring-[#23466e]/10"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={update}
                    placeholder="name@murdoch.edu.au"
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#23466e] focus:ring-2 focus:ring-[#23466e]/10"
                  />
                </div>
              </div>

              {/* Password + Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      value={form.password}
                      onChange={update}
                      placeholder="Minimum 8 characters"
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#23466e] focus:ring-2 focus:ring-[#23466e]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#23466e]"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="password_confirm"
                      required
                      value={form.password_confirm}
                      onChange={update}
                      placeholder="Re-enter password"
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#23466e] focus:ring-2 focus:ring-[#23466e]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#23466e]"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-14 rounded-xl bg-[#23466e] text-white font-semibold text-lg hover:bg-[#1b395b] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Creating…" : "Create account"}
              </button>
            </form>

            {/* Login link */}
            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#23466e] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}