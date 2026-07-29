import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Languages,
  ArrowLeft,
  Loader2,
  GraduationCap,
  Phone,
  MapPinned,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { GOVERNORATE_OPTIONS, STUDENT_GRADES } from "../lib/authService.js";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    grade: STUDENT_GRADES[2],
    governorate: GOVERNORATE_OPTIONS[0],
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(values) {
    const errs = {};
    const phoneDigits = values.phone.replace(/\D/g, "");

    if (!values.name.trim()) errs.name = "من فضلك اكتب اسمك بالكامل";
    else if (values.name.trim().length < 3) errs.name = "الاسم قصير جدًا";

    if (!values.email.trim()) errs.email = "من فضلك اكتب بريدك الإلكتروني";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errs.email = "صيغة البريد الإلكتروني غير صحيحة";

    if (!phoneDigits) errs.phone = "من فضلك اكتب رقم الموبايل";
    else if (phoneDigits.length < 11) errs.phone = "رقم الموبايل غير صحيح";

    if (!values.grade) errs.grade = "من فضلك اختار الصف الدراسي";
    if (!values.governorate) errs.governorate = "من فضلك اختار المحافظة";

    if (!values.password) errs.password = "من فضلك اختار كلمة مرور";
    else if (values.password.length < 8) errs.password = "كلمة المرور لازم تكون ٨ أحرف على الأقل";

    if (!values.confirmPassword) errs.confirmPassword = "من فضلك أكد كلمة المرور";
    else if (values.confirmPassword !== values.password) errs.confirmPassword = "كلمة المرور غير متطابقة";

    if (!values.acceptedTerms) errs.acceptedTerms = "لازم توافق على الشروط والأحكام عشان تكمل";

    return errs;
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
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
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        grade: form.grade,
        governorate: form.governorate,
        password: form.password,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setServerError(err.message || "حصل خطأ أثناء إنشاء الحساب، حاول تاني.");
    } finally {
      setIsSubmitting(false);
    }
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
          className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/10 p-8 sm:p-10"
        >
          <div className="flex flex-col items-center gap-2 mb-7 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-800 dark:bg-amber-400 text-white dark:text-slate-950 flex items-center justify-center shadow-lg shadow-red-800/20 dark:shadow-amber-400/20 mb-2">
              <Languages size={28} />
            </div>
            <h1 className="text-2xl font-extrabold">إنشاء حساب طالب جديد</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              ابدأ رحلتك الدراسية وسجّل بياناتك كاملة
            </p>
          </div>

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
              <label htmlFor="name" className="block text-sm font-bold mb-1.5">
                الاسم بالكامل
              </label>
              <div className="relative">
                <User size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="مثال: محمد أحمد"
                  aria-invalid={Boolean(errors.name)}
                  className={`w-full rounded-xl border bg-slate-50 dark:bg-slate-800 pr-11 pl-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2 ${
                    errors.name
                      ? "border-red-400 focus:ring-red-300"
                      : "border-slate-200 dark:border-slate-700 focus:ring-amber-300 focus:border-amber-400"
                  }`}
                />
              </div>
              {errors.name && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="phone" className="block text-sm font-bold mb-1.5">
                  رقم الموبايل
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="01XXXXXXXXX"
                    aria-invalid={Boolean(errors.phone)}
                    className={`w-full rounded-xl border bg-slate-50 dark:bg-slate-800 pr-11 pl-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2 ${
                      errors.phone
                        ? "border-red-400 focus:ring-red-300"
                        : "border-slate-200 dark:border-slate-700 focus:ring-amber-300 focus:border-amber-400"
                    }`}
                  />
                </div>
                {errors.phone && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.phone}</p>}
              </div>

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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="grade" className="block text-sm font-bold mb-1.5">
                  الصف الدراسي
                </label>
                <div className="relative">
                  <GraduationCap size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    id="grade"
                    name="grade"
                    value={form.grade}
                    onChange={handleChange}
                    className={`w-full rounded-xl border bg-slate-50 dark:bg-slate-800 pr-11 pl-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2 ${
                      errors.grade
                        ? "border-red-400 focus:ring-red-300"
                        : "border-slate-200 dark:border-slate-700 focus:ring-amber-300 focus:border-amber-400"
                    }`}
                  >
                    {STUDENT_GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.grade && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.grade}</p>}
              </div>

              <div>
                <label htmlFor="governorate" className="block text-sm font-bold mb-1.5">
                  المحافظة
                </label>
                <div className="relative">
                  <MapPinned size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    id="governorate"
                    name="governorate"
                    value={form.governorate}
                    onChange={handleChange}
                    className={`w-full rounded-xl border bg-slate-50 dark:bg-slate-800 pr-11 pl-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2 ${
                      errors.governorate
                        ? "border-red-400 focus:ring-red-300"
                        : "border-slate-200 dark:border-slate-700 focus:ring-amber-300 focus:border-amber-400"
                    }`}
                  >
                    {GOVERNORATE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.governorate && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.governorate}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="password" className="block text-sm font-bold mb-1.5">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="٨ أحرف أو أكثر"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold mb-1.5">
                  تأكيد كلمة المرور
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    className={`w-full rounded-xl border bg-slate-50 dark:bg-slate-800 pr-11 pl-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2 ${
                      errors.confirmPassword
                        ? "border-red-400 focus:ring-red-300"
                        : "border-slate-200 dark:border-slate-700 focus:ring-amber-300 focus:border-amber-400"
                    }`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div>
              <label className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptedTerms"
                  checked={form.acceptedTerms}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-red-800 focus:ring-amber-400"
                />
                <span>موافق على الشروط والأحكام وسياسة الخصوصية الخاصة بالمنصة</span>
              </label>
              {errors.acceptedTerms && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.acceptedTerms}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-800 text-white font-extrabold rounded-xl py-3.5 hover:bg-red-900 hover:shadow-lg hover:shadow-red-800/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={18} className="animate-spin" />}
              {isSubmitting ? "بيتم إنشاء الحساب..." : "إنشاء الحساب"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-7">
            عندك حساب بالفعل؟{" "}
            <Link to="/login" className="text-red-800 dark:text-amber-400 font-bold hover:underline">
              سجّل الدخول
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
