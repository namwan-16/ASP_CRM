import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import signup from "../assets/images/signup.png";
function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "Administrator",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Django API connection will be added here later.
    console.log("Signup data:", formData);

    alert("Account created successfully.");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl overflow-hidden flex min-h-[720px]">

        {/* LEFT SIDE */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#172f4d] relative overflow-hidden flex-col items-center justify-center p-10 text-white">

          {/* Background circles */}
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-[#24466e] rounded-full opacity-50"></div>

          <div className="absolute -bottom-24 -right-20 w-72 h-72 bg-[#24466e] rounded-full opacity-40"></div>

          {/* Illustration */}
         

            <div className="bg-[#2d496b] border border-slate-500/40 rounded-2xl p-5 shadow-lg">

              {/* Browser window */}
             

                {/* Browser header */}
                {/* <div className="h-10 bg-[#1d3552] flex items-center gap-2 px-4">

                  <span className="w-3 h-3 bg-red-400 rounded-full"></span>
                  <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                  <span className="w-3 h-3 bg-green-400 rounded-full"></span>

                  <div className="ml-3 h-5 flex-1 rounded-md bg-slate-500/40"></div>
                </div> */}
                {/* Illustration area */}
              

                    {/* Computer */}               
                      {/* <div className="h-5 bg-slate-200 rounded-t-lg"></div>                     */}
                        <div className="relative z-10 w-full max-w-[360px]">
                          <img
                            src={signup}
                            alt="ASP CRM secure account illustration"
                            className="w-full object-contain"
                          />
                        </div>
                     

                    {/* Person representation */}
                    {/* <div className="absolute bottom-5 left-20">

                      <div className="w-10 h-10 bg-[#d6b89c] rounded-full mx-auto"></div>

                      <div className="w-16 h-20 bg-[#203b5a] rounded-t-3xl mt-1"></div>

                    </div> */}

                    {/* Plant */}
                    <div className="absolute bottom-3 left-3">
                      <div className="w-2 h-16 bg-slate-700"></div>
                      <div className="absolute -left-5 top-2 w-8 h-8 bg-[#31587e] rounded-full"></div>
                      <div className="absolute left-1 top-8 w-8 h-8 bg-[#31587e] rounded-full"></div>
                    </div>

                  

                
             
            </div>
        

          {/* Left text */}
          <div className="relative z-10 text-center mt-8">

            <h2 className="text-2xl font-bold">
              ASP Class Process Pipeline
            </h2>

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
                <h1 className="text-2xl font-bold text-[#23466e]">
                  ASP CRM
                </h1>

                <p className="text-slate-500">
                  Class Process Pipeline
                </p>
              </div>

            </div>

            {/* Heading */}
            <div className="mb-7">

              <h2 className="text-3xl font-bold text-[#173c68]">
                Create account
              </h2>

              <p className="mt-2 text-slate-500">
                Register for authorised access to the ASP CRM system.
              </p>

            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-lg border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Full name
                </label>

                <div className="relative">

                  <User
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Marcus Anderson"
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
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@murdoch.edu.au"
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#23466e] focus:ring-2 focus:ring-[#23466e]/10"
                  />

                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Role
                </label>

                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-700 outline-none focus:border-[#23466e] focus:ring-2 focus:ring-[#23466e]/10"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Coordinator">Coordinator</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              {/* Password */}
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
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Minimum 8 characters"
                            className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#23466e] focus:ring-2 focus:ring-[#23466e]/10"
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#23466e]"
                        >
                            {showPassword ? (
                            <EyeOff size={20} />
                            ) : (
                            <Eye size={20} />
                            )}
                        </button>

                        </div>
                    </div>

                    {/* Confirm Password */}
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
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Re-enter password"
                            className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#23466e] focus:ring-2 focus:ring-[#23466e]/10"
                        />

                        <button
                            type="button"
                            onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#23466e]"
                        >
                            {showConfirmPassword ? (
                            <EyeOff size={20} />
                            ) : (
                            <Eye size={20} />
                            )}
                        </button>

                        </div>
                    </div>
             </div>
              {/* Submit */}
              <button
                type="submit"
                className="w-full h-14 rounded-xl bg-[#23466e] text-white font-semibold text-lg hover:bg-[#1b395b] transition-colors"
              >
                Create account
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

export default Signup;