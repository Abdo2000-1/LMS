import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, GraduationCap, LogOut, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AppHeader from "../components/AppHeader.jsx";
import Footer from "../components/Footer.jsx";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [saved, setSaved] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    // ملحوظة: التعديل هنا شكلي فقط دلوقتي، لحد ما يتربط بـ endpoint حقيقي زي
    // PATCH /api/users/:id في الباك اند بتاعك بـ Node.js
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-['Cairo',_sans-serif] transition-colors duration-500"
    >
      <AppHeader active="/profile" />

      <main className="max-w-3xl mx-auto px-6 sm:px-10 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 sm:p-10 ring-1 ring-black/5 dark:ring-white/10"
        >
          <div className="flex flex-col items-center gap-3 mb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-red-800 dark:bg-amber-400 text-white dark:text-slate-950 flex items-center justify-center text-2xl font-extrabold">
              {user?.name?.charAt(0) || "؟"}
            </div>
            <div>
              <h1 className="text-xl font-extrabold">{user?.name}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {user?.role === "teacher" ? "مدرّس" : `طالب — ${user?.grade || ""}`}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-bold mb-1.5">
                الاسم
              </label>
              <div className="relative">
                <User size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pr-11 pl-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5">البريد الإلكتروني</label>
              <div className="relative">
                <Mail size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={user?.email || ""}
                  disabled
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 pr-11 pl-4 py-3 text-sm outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {user?.role === "student" && (
              <div>
                <label className="block text-sm font-bold mb-1.5">الصف الدراسي</label>
                <div className="relative">
                  <GraduationCap size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={user?.grade || ""}
                    disabled
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 pr-11 pl-4 py-3 text-sm outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-red-800 text-white font-extrabold rounded-xl py-3 hover:bg-red-900 hover:shadow-lg hover:shadow-red-800/30 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {saved && <Check size={18} />}
                {saved ? "اتحفظ بنجاح" : "حفظ التعديلات"}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl py-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                تسجيل الخروج
              </button>
            </div>
          </form>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
