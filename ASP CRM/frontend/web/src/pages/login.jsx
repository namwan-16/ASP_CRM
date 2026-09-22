import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Mail, Lock, Eye, EyeOff } from "lucide-react";

const NAVY = "#1e3a5f";
const NAVY_DEEP = "#0f1f33";
const MUTED = "#64748b";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    setError("");
    alert("Login successful (prototype)");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E8EDF5] p-4">
      <div className="flex w-full max-w-[900px] overflow-hidden rounded-2xl shadow-2xl bg-white min-h-[560px]">
        
        {/* Left Panel */}
        <div
          className="relative hidden md:flex flex-col items-center justify-center w-[48%] overflow-hidden"
          style={{
            background: `linear-gradient(160deg, ${NAVY_DEEP} 0%, ${NAVY} 55%, #243b5c 100%)`,
          }}
        >
          <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 -right-8 w-56 h-56 rounded-full bg-white/5" />

          <div className="relative z-10 flex flex-col items-center px-8 text-center">
            <div className="w-64 rounded-xl overflow-hidden border border-white/15 bg-white/10 shadow-2xl">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-black/25">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex flex-col items-center py-10 px-6">
                <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mb-4">
                  <Lock size={28} className="text-white" />
                </div>
                <div className="text-white font-semibold text-sm mb-1">Secure Access</div>
                <div className="text-white/50 text-xs leading-relaxed">
                  Protected student & guardian data<br />with role-based access control
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="text-white/90 font-semibold text-[15px]">ASP Class Process Pipeline</div>
              <div className="text-white/45 text-xs mt-1">
                MU After School Program · Mathematics & Physical Sciences
              </div>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="flex flex-1 flex-col justify-center px-8 py-10 sm:px-12">
          <div className="mb-6 flex items-center gap-2.5">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: NAVY }}
            >
              <GraduationCap size={24} className="text-white" />
            </div>
            <div>
              <div className="text-[18px] font-bold leading-tight" style={{ color: NAVY }}>
                ASP CRM
              </div>
              <div className="text-[11px] font-medium tracking-wide" style={{ color: MUTED }}>
                Class Process Pipeline
              </div>
            </div>
          </div>

          <h1 className="text-[22px] font-bold mb-1" style={{ color: NAVY }}>
            Welcome back
          </h1>
          <p className="text-[13px] mb-7" style={{ color: MUTED }}>
            Sign in with your authorised ASP account.
          </p>

          {error && (
            <div className="mb-4 rounded-lg px-3 py-2 text-[12.5px] font-medium bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-[12.5px] font-semibold mb-1.5 text-slate-700">
                Email address
              </label>
              <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <Mail size={17} className="text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@murdoch.edu.au"
                  className="flex-1 bg-transparent text-[13.5px] text-slate-700 outline-none"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[12.5px] font-semibold mb-1.5 text-slate-700">
                Password
              </label>
              <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <Lock size={17} className="text-slate-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-[13.5px] text-slate-700 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-slate-400"
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="mb-6 text-right">
              <button type="button" className="text-[12.5px] font-medium text-[#b08d4f]">
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg py-3 text-[14px] font-semibold text-white"
              style={{ background: NAVY }}
            >
              Sign in
            </button>
          </form>

          <p className="mt-6 text-center text-[12.5px]" style={{ color: MUTED }}>
            Need help? <span className="font-medium" style={{ color: NAVY }}>Contact the ASP coordinator.</span>
          </p>

          <div className="mt-5 pt-5 border-t border-slate-100 text-center">
            <span className="text-[12.5px]" style={{ color: MUTED }}>Don't have an account? </span>
            <Link to="/signup" className="text-[12.5px] font-semibold" style={{ color: NAVY }}>
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}