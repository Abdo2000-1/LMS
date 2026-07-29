import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BookOpen, ClipboardCheck, Award, ArrowLeft, Flame, PlayCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { subscribeCourses } from "../services/courseService.js";
import DashboardLayout from "../components/DashboardLayout.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);

  useEffect(() => subscribeCourses(setCourses), []);

  const enrolledCourses = useMemo(() => {
    const enrolledIds = new Set(user?.enrolledCourses || []);
    return courses.filter((course) => enrolledIds.has(course.id));
  }, [courses, user?.enrolledCourses]);

  const totalProgress = useMemo(() => {
    if (!enrolledCourses.length) return 0;
    const total = enrolledCourses.reduce((sum, course) => {
      const courseProgress = user?.progress?.[course.id]?.percentage || 0;
      return sum + courseProgress;
    }, 0);
    return Math.round(total / enrolledCourses.length);
  }, [enrolledCourses, user?.progress]);

  const completedLessons = useMemo(() => {
    return Object.values(user?.progress || {}).reduce((sum, item) => sum + (item?.watchedLessons?.length || 0), 0);
  }, [user?.progress]);

  const nextCourse = useMemo(() => {
    return enrolledCourses.find((course) => (user?.progress?.[course.id]?.percentage || 0) < 100) || enrolledCourses[0];
  }, [enrolledCourses, user?.progress]);

  const stats = [
    { label: "الكورسات المشتركة", value: String(enrolledCourses.length), icon: BookOpen },
    { label: "الدروس المكتملة", value: String(completedLessons), icon: ClipboardCheck },
    { label: "متوسط التقدم", value: `${totalProgress}%`, icon: Award },
    { label: "مستوى الالتزام", value: totalProgress > 70 ? "ممتاز" : totalProgress > 40 ? "جيد" : "ابدأ الآن", icon: Flame },
  ];

  return (
    <DashboardLayout active="/dashboard">
      <div className="space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center sm:text-right"
        >
          <h1 className="text-2xl sm:text-3xl font-extrabold">أهلاً بيك، {user?.name?.split(" ")[0] || "طالب"} 👋</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {user?.grade ? `متابعة خطة ${user.grade}` : "ابدأ أول كورس وخليك منتظم يوميًا."}
          </p>
        </motion.div>

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

        {nextCourse ? (
          <section className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 sm:p-8 ring-1 ring-black/5 dark:ring-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
              <h2 className="text-xl font-extrabold">كمل مذاكرتك الآن</h2>
              <Link
                to={`/courses/${nextCourse.id}`}
                className="text-sm font-bold text-red-800 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                فتح الكورس
                <ArrowLeft size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white dark:bg-slate-950 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">الكورس الحالي</p>
                <h3 className="font-extrabold text-lg mb-3">{nextCourse.title}</h3>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-800 dark:bg-amber-400 rounded-full"
                    style={{ width: `${user?.progress?.[nextCourse.id]?.percentage || 0}%` }}
                  />
                </div>
                <p className="text-xs mt-2 text-slate-500 dark:text-slate-400">
                  التقدم: {user?.progress?.[nextCourse.id]?.percentage || 0}%
                </p>
              </div>
              <div className="bg-gradient-to-br from-red-800 to-red-950 rounded-2xl p-5 text-white flex flex-col justify-between">
                <PlayCircle size={30} className="opacity-90" />
                <p className="text-sm leading-relaxed">اكمل ترتيب الدروس خطوة بخطوة، كل درس يفتح اللي بعده تلقائيًا.</p>
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 text-center ring-1 ring-black/5 dark:ring-white/10">
            <h2 className="text-xl font-extrabold mb-2">لسه مش مشترك في أي كورس</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-5">ادخل صفحة الكورسات واختر أول كورس يناسبك.</p>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 bg-red-800 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-red-900 transition-colors duration-300"
            >
              استعرض الكورسات
              <ArrowLeft size={16} />
            </Link>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
