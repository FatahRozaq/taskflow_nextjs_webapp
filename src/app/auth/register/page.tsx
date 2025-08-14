"use client";
import { useState } from "react";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaUser, FaLock, FaArrowRight } from "react-icons/fa";
import { IoEye, IoEyeOff } from "react-icons/io5";

const RegisterSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password dan konfirmasi tidak cocok",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof RegisterSchema>;

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [values, setValues] = useState<RegisterValues>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterValues | "form", string>>>({});
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = RegisterSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof RegisterValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as keyof RegisterValues;
        fieldErrors[path] = issue.message;
      }
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      return;
    }

    setBusy(true);
    try {
      await register(values.email, values.password, values.name);
      router.push("/dashboard");
    } catch (err) {
      setErrors((prev) => ({ ...prev, form: "Registrasi gagal. Coba lagi." }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-2xl p-8 border border-neutral-200">
          <header className="mb-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Register</h1>
            <p className="text-neutral-600 text-sm mt-1">Please register to get started</p>
          </header>

          {errors.form && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
              {errors.form}
            </div>
          )}

          <form onSubmit={handle} className="space-y-5">
            {/* ✅ Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-semibold text-neutral-800">Nama</label>
              <div className="relative">
                <FaUser className="absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Nama lengkap"
                  value={values.name}
                  onChange={handleChange}
                  className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition
                    ${errors.name ? "border-red-400 bg-red-50 focus:border-red-500" : "border-neutral-300 focus:border-purple-600"}
                  `}
                  autoComplete="name"
                />
              </div>
              {errors.name && <p className="text-xs text-red-600 font-medium">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-neutral-800">Email</label>
              <div className="relative">
                <FaUser className="absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nama@domain.com"
                  value={values.email}
                  onChange={handleChange}
                  className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition
                    ${errors.email ? "border-red-400 bg-red-50 focus:border-red-500" : "border-neutral-300 focus:border-purple-600"}
                  `}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs text-red-600 font-medium">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-neutral-800">Password</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={values.password}
                  onChange={handleChange}
                  className={`w-full rounded-xl border pl-10 pr-10 py-3 text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition
                    ${errors.password ? "border-red-400 bg-red-50 focus:border-red-500" : "border-neutral-300 focus:border-purple-600"}
                  `}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-700"
                  tabIndex={-1}
                >
                  {showPassword ? <IoEyeOff className="h-5 w-5" /> : <IoEye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600 font-medium">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-neutral-800">Konfirmasi Password</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  className={`w-full rounded-xl border pl-10 pr-10 py-3 text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition
                    ${errors.confirmPassword ? "border-red-400 bg-red-50 focus:border-red-500" : "border-neutral-300 focus:border-purple-600"}
                  `}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-700"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <IoEyeOff className="h-5 w-5" /> : <IoEye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-600 font-medium">{errors.confirmPassword}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl py-3 text-sm font-semibold bg-purple-600 text-white disabled:opacity-70 disabled:cursor-not-allowed hover:bg-purple-700 shadow-lg transition flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Register</span> <FaArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="text-center text-sm text-neutral-700 font-medium">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-purple-600 hover:underline font-semibold">
                Login now
              </Link>
            </p>
          </form>

          <footer className="mt-6 text-center text-xs text-neutral-500">
            ©Taskflow {new Date().getFullYear()}
          </footer>
        </div>
      </div>
    </main>
  );
}
