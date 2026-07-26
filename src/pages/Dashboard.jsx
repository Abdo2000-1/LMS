import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BookOpen, ClipboardCheck, Award, ArrowLeft, Flame } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import AppHeader from "../components/AppHeader.jsx";
import Footer from "../components/Footer.jsx";

const stats = [
  { label: "الكورسات الحالية", value: "٣", icon: BookOpen },
  { label: "الواجبات المكتملة", value: "١٢", icon: ClipboardCheck },
  { label: "متوسط الدرجات", value: "٪٩١", icon: Award },
  { label: "أيام متتالية بالمذاكرة", value: "٧", icon: Flame },
];

const continueLearning = [
  { id: 1, title: "النحو والصرف كاملة", progress: 62, gradient: "from-slate-600 to-slate-900" },
  { id: 2, title: "المراجعة النهائية (نحو + بلاغة)", progress: 28, gradient: "from-teal-700 to-teal-950" },
  { id: 3, title: "الكورس التأسيسي في اللغة العربية", progress: 90, gradient: "from-blue-700 to-slate-900" },
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-['Cairo',_sans-serif] transition-colors duration-500"
    >
      <AppHeader active="/dashboard" />

      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-10 space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center sm:text-right"
        >
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            أهلاً بيك، {user?.name?.split(" ")[0] || "بيك"} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {user?.role === "teacher"
              ? "دي نظرة سريعة على نشاط طلابك."
              : `يلا نكمل مذاكرة ${user?.grade || "اللغة العربية"} من حيث ما وقفت.`}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 flex flex-col items-end gap-3 ring-1 ring-transparent hover:ring-amber-300/60 dark:hover:ring-amber-500/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-amber-400 flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <p className="text-2xl font-extrabold">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Continue learning */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-extrabold">كمّل من حيث ما وقفت</h2>
            <Link
              to="/courses"
              className="text-sm font-bold text-red-800 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              كل الكورسات
              <ArrowLeft size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {continueLearning.map((c) => (
              <div
                key={c.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-black/40 transition-all duration-300"
              >
                <div
                  className={`h-28 bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white`}
                >
                  <BookOpen size={32} className="opacity-80 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="p-4 space-y-2 text-right">
                  <h3 className="font-bold text-sm">{c.title}</h3>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-800 dark:bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${c.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">اكتملت {c.progress}٪</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
