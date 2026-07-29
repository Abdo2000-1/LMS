import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Users, BookOpen, Wallet, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { subscribeCourses, getTenantStudents } from "../services/courseService.js";
import { subscribePayments } from "../services/paymentService.js";
import AppHeader from "../components/AppHeader.jsx";
import Footer from "../components/Footer.jsx";

export default function DeveloperMaster() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const unsubCourses = subscribeCourses(setCourses);
    const unsubPayments = subscribePayments(setPayments);
    getTenantStudents().then(setStudents).catch(() => setStudents([]));
    return () => {
      unsubCourses();
      unsubPayments();
    };
  }, []);

  const summary = useMemo(
    () => ({
      courses: courses.length,
      students: students.length,
      payments: payments.length,
    }),
    [courses.length, students.length, payments.length]
  );

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-['Cairo',_sans-serif] transition-colors duration-500"
    >
      <AppHeader active="/dev/master" />

      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-10 space-y-8">
        <section className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck size={28} className="text-amber-300" />
            <h1 className="text-2xl font-extrabold">ماستر المطور</h1>
          </div>
          <p className="text-slate-300 text-sm">
            أهلاً {user?.name}، من هنا تقدر تفتح كل الواجهات بسرعة أثناء التطوير والمراجعة.
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "إجمالي الكورسات", value: summary.courses, icon: BookOpen },
            { label: "إجمالي الطلاب", value: summary.students, icon: Users },
            { label: "سجلات المدفوعات", value: summary.payments, icon: Wallet },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 ring-1 ring-black/5 dark:ring-white/10">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-amber-400 flex items-center justify-center mb-3">
                  <Icon size={20} />
                </div>
                <p className="text-2xl font-extrabold">{item.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Link
            to="/dashboard"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
          >
            <h2 className="font-extrabold mb-2">لوحة الطالب</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">مراجعة تجربة الطالب، التقدم والكورسات.</p>
            <span className="text-sm font-bold text-red-800 dark:text-amber-400 inline-flex items-center gap-1">
              فتح الصفحة
              <ArrowLeft size={14} />
            </span>
          </Link>

          <Link
            to="/teacher/dashboard"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
          >
            <h2 className="font-extrabold mb-2">لوحة المدرس</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">إدارة الكورسات، الكويزات، الطلاب والمدفوعات.</p>
            <span className="text-sm font-bold text-red-800 dark:text-amber-400 inline-flex items-center gap-1">
              فتح الصفحة
              <ArrowLeft size={14} />
            </span>
          </Link>

          <Link
            to="/courses"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
          >
            <h2 className="font-extrabold mb-2">صفحات الكورسات</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">مراجعة صفحة القائمة، تفاصيل الكورس، وصفحة الدفع.</p>
            <span className="text-sm font-bold text-red-800 dark:text-amber-400 inline-flex items-center gap-1">
              فتح الصفحة
              <ArrowLeft size={14} />
            </span>
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
