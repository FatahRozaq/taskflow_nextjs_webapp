"use client";
import { useState } from "react";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaUser, FaLock, FaArrowRight } from "react-icons/fa";
import { IoEye, IoEyeOff } from "react-icons/io5";

const LoginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginValues = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [values, setValues] = useState<LoginValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginValues | "form", string>>>({});
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    
    // PERBAIKAN: Clear error saat user mulai mengetik ulang
    if (errors[name as keyof LoginValues]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    // Clear form error juga
    if (errors.form) {
      setErrors((prev) => ({ ...prev, form: undefined }));
    }
  };

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const parsed = LoginSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof LoginValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as keyof LoginValues;
        fieldErrors[path] = issue.message;
      }
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      return;
    }

    setBusy(true);
    try {
      await login(values.email, values.password);
      // PERBAIKAN: Hanya redirect jika login berhasil
      router.push("/dashboard");
    } catch (err: any) {
      // PERBAIKAN: Tampilkan pesan error yang lebih spesifik
      let errorMessage = "Login gagal. Coba lagi.";
      
      if (err?.code === "auth/user-not-found") {
        errorMessage = "Email tidak ditemukan.";
      } else if (err?.code === "auth/wrong-password") {
        errorMessage = "Password salah.";
      } else if (err?.code === "auth/invalid-email") {
        errorMessage = "Format email tidak valid.";
      } else if (err?.code === "auth/user-disabled") {
        errorMessage = "Akun telah dinonaktifkan.";
      } else if (err?.code === "auth/too-many-requests") {
        errorMessage = "Terlalu banyak percobaan login. Coba lagi nanti.";
      } else if (err?.code === "auth/invalid-credential") {
        errorMessage = "Email atau password salah.";
      }
      
      setErrors((prev) => ({ ...prev, form: errorMessage }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-2xl p-8 border border-neutral-200">
          <header className="mb-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Login</h1>
            <p className="text-neutral-600 text-sm mt-1">Sign in to continue</p>
          </header>

          {errors.form && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
              {errors.form}
            </div>
          )}

          <form onSubmit={handle} className="space-y-5">
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
                  autoComplete="current-password"
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

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl py-3 text-sm font-semibold bg-purple-600 text-white disabled:opacity-70 disabled:cursor-not-allowed hover:bg-purple-700 shadow-lg transition flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Login</span> <FaArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="text-center text-sm text-neutral-700 font-medium">
              Don't have an account? {" "}
              <Link href="/auth/register" className="text-purple-600 hover:underline font-semibold">
                Register now
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