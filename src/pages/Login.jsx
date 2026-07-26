import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Languages, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(values) {
    const errs = {};
    if (!values.email.trim()) {
      errs.email = "من فضلك اكتب بريدك الإلكتروني";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      errs.email = "صيغة البريد الإلكتروني غير صحيحة";
    }

    if (!values.password) {
      errs.password = "من فضلك اكتب كلمة المرور";
    } else if (values.password.length < 6) {
      errs.password = "كلمة المرور لازم تكون ٦ أحرف على الأقل";
    }

    return errs;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
    if (serverError) setServerError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setServerError("");
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err.message || "حصل خطأ أثناء تسجيل الدخول، حاول تاني.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function fillDemoStudent() {
    setForm({ email: "example@gmail.com", password: "123456" });
    setErrors({});
    setServerError("");
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-['Cairo',_sans-serif] transition-colors duration-500 flex flex-col"
    >
      <div className="flex items-center justify-between px-6 sm:px-10 py-5">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-red-800 dark:hover:text-amber-400 transition-colors duration-300"
        >
          <ArrowLeft size={16} className="rotate-180" />
          الرجوع للرئيسية
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/10 p-8 sm:p-10"
        >
          <div className="flex flex-col items-center gap-2 mb-7 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-800 dark:bg-amber-400 text-white dark:text-slate-950 flex items-center justify-center shadow-lg shadow-red-800/20 dark:shadow-amber-400/20 mb-2">
              <Languages size={28} />
            </div>
            <h1 className="text-2xl font-extrabold">تسجيل الدخول</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              اهلاً بيك تاني في منصة{" "}
              <span className="text-red-800 dark:text-amber-400 font-bold">الأستاذ</span>
            </p>
          </div>

          <button
            type="button"
            onClick={fillDemoStudent}
            className="w-full mb-6 flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-400/10 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-400/20 rounded-xl px-4 py-3 text-right hover:bg-amber-100 dark:hover:bg-amber-400/20 transition-colors duration-300"
          >
            <Sparkles size={16} className="shrink-0 mt-0.5" />
            <span>
              <span className="font-bold block mb-1">عايز تجرب المنصة بسرعة؟</span>
              دوس هنا عشان تملأ بيانات حساب طالب تجريبي (example@gmail.com) وتدخل تستكشف الداشبورد.
            </span>
          </button>

          {serverError && (
            <div
              role="alert"
              className="mb-5 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 rounded-xl px-4 py-3 text-right"
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-bold mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                  aria-invalid={Boolean(errors.email)}
                  className={`w-full rounded-xl border bg-slate-50 dark:bg-slate-800 pr-11 pl-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2 ${
                    errors.email
                      ? "border-red-400 focus:ring-red-300"
                      : "border-slate-200 dark:border-slate-700 focus:ring-amber-300 focus:border-amber-400"
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-bold">
                  كلمة المرور
                </label>
                <a href="#" className="text-xs font-bold text-red-800 dark:text-amber-400 hover:underline">
                  نسيت كلمة المرور؟
                </a>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  aria-invalid={Boolean(errors.password)}
                  className={`w-full rounded-xl border bg-slate-50 dark:bg-slate-800 pr-11 pl-11 py-3 text-sm outline-none transition-all duration-200 focus:ring-2 ${
                    errors.password
                      ? "border-red-400 focus:ring-red-300"
                      : "border-slate-200 dark:border-slate-700 focus:ring-amber-300 focus:border-amber-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-800 text-white font-extrabold rounded-xl py-3.5 hover:bg-red-900 hover:shadow-lg hover:shadow-red-800/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={18} className="animate-spin" />}
              {isSubmitting ? "بيتم الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-7">
            لسه معملتش حساب؟{" "}
            <Link to="/register" className="text-red-800 dark:text-amber-400 font-bold hover:underline">
              اعمل حساب جديد
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
