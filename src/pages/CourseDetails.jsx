import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, CirclePlay, Lock, NotebookPen, Timer, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { getCourseById, markLessonCompleted } from "../services/courseService.js";
import AppHeader from "../components/AppHeader.jsx";
import Footer from "../components/Footer.jsx";

function lessonUnlocked(index, units, watchedLessons) {
  if (index === 0) return true;
  const previousUnit = units[index - 1];
  return watchedLessons.includes(previousUnit.unitId);
}

export default function CourseDetails() {
  const { courseId } = useParams();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [selectedUnitIndex, setSelectedUnitIndex] = useState(0);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [error, setError] = useState("");

  const watchedLessons = useMemo(() => user?.progress?.[courseId]?.watchedLessons || [], [user?.progress, courseId]);
  const enrolled = useMemo(() => (user?.enrolledCourses || []).includes(courseId), [user?.enrolledCourses, courseId]);

  useEffect(() => {
    let mounted = true;
    getCourseById(courseId)
      .then((result) => {
        if (!mounted) return;
        setCourse(result);
      })
      .catch(() => {
        if (!mounted) return;
        setError("تعذر تحميل الكورس.");
      });

    return () => {
      mounted = false;
    };
  }, [courseId]);

  const units = useMemo(() => {
    if (!course?.units) return [];
    return [...course.units].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [course?.units]);

  const quizzes = useMemo(() => {
    if (!course?.quizzes) return [];
    return [...course.quizzes].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [course?.quizzes]);

  const selectedUnit = units[selectedUnitIndex] || null;
  const selectedUnlocked =
    selectedUnit && (enrolled || selectedUnit.isFree || lessonUnlocked(selectedUnitIndex, units, watchedLessons));

  async function completeLesson() {
    if (!selectedUnit || !enrolled) return;
    setIsSavingProgress(true);
    setError("");
    try {
      await markLessonCompleted({
        uid: user.uid,
        courseId,
        unitId: selectedUnit.unitId,
        totalUnits: units.length,
      });
    } catch (saveError) {
      setError(saveError.message || "تعذر حفظ تقدم الدرس.");
    } finally {
      setIsSavingProgress(false);
    }
  }

  if (!course) {
    return (
      <div dir="rtl" className="min-h-screen bg-white dark:bg-slate-950">
        <AppHeader active="/courses" />
        <main className="max-w-7xl mx-auto px-6 sm:px-10 py-10 text-center">
          <p className="text-slate-500 dark:text-slate-400">جارٍ تحميل تفاصيل الكورس...</p>
        </main>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-['Cairo',_sans-serif] transition-colors duration-500"
    >
      <AppHeader active="/courses" />

      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-10 space-y-6">
        <section className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 ring-1 ring-black/5 dark:ring-white/10">
          <div className="flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between">
            <div className="text-right">
              <h1 className="text-2xl font-extrabold mb-2">{course.title}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{course.description || "كورس متكامل بالفيديوهات والكويزات."}</p>
            </div>

            {!enrolled && (
              <Link
                to={`/courses/${course.id}/payment`}
                className="inline-flex items-center justify-center gap-2 bg-red-800 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-red-900 transition-colors duration-300"
              >
                اشترك الآن
                <ArrowLeft size={16} />
              </Link>
            )}
          </div>
        </section>

        {error && (
          <div className="text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 rounded-xl px-4 py-3 text-right">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-black rounded-2xl overflow-hidden ring-1 ring-black/10">
            {selectedUnit && selectedUnlocked ? (
              <div className="relative pb-[56.25%] h-0">
                <iframe
                  title={selectedUnit.title}
                  src={`https://www.youtube.com/embed/${selectedUnit.youtubeVideoId}?rel=0&modestbranding=1`}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                />
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute top-4 right-4 bg-black/35 text-white text-xs px-2 py-1 rounded">
                    {user?.name} • {user?.phone || user?.email}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-white/80 text-sm">
                {selectedUnit ? "هذا الدرس مقفول لحين إنهاء الدروس السابقة." : "اختر درسًا من القائمة."}
              </div>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 ring-1 ring-black/5 dark:ring-white/10">
            <h2 className="font-extrabold mb-3">محتوى الكورس</h2>
            <div className="space-y-2 max-h-[23rem] overflow-auto pr-1">
              {units.map((unit, index) => {
                const unlocked = enrolled || unit.isFree || lessonUnlocked(index, units, watchedLessons);
                const watched = watchedLessons.includes(unit.unitId);
                return (
                  <button
                    key={unit.unitId}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => setSelectedUnitIndex(index)}
                    className={`w-full text-right rounded-xl border px-3 py-3 flex items-center justify-between gap-2 transition-all duration-300 ${
                      index === selectedUnitIndex
                        ? "border-red-800 dark:border-amber-400 bg-red-50 dark:bg-amber-400/10"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                    } ${!unlocked ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <div>
                      <p className="text-sm font-bold">{unit.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">الدرس {index + 1}</p>
                    </div>
                    {watched ? <CheckCircle2 size={18} className="text-emerald-500" /> : unlocked ? <CirclePlay size={18} /> : <Lock size={16} />}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 ring-1 ring-black/5 dark:ring-white/10">
            <h2 className="font-extrabold mb-3">الكويزات</h2>
            {quizzes.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">لا يوجد كويزات مضافة حتى الآن.</p>
            ) : (
              <div className="space-y-3">
                {quizzes.map((quiz) => (
                  <div key={quiz.quizId} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between">
                    <div className="text-right">
                      <p className="font-bold">{quiz.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">عدد الأسئلة: {quiz.questionsCount}</p>
                    </div>
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <Timer size={14} />
                      {quiz.minutes} دقيقة
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 ring-1 ring-black/5 dark:ring-white/10 space-y-3">
            <h2 className="font-extrabold">تقدمك في الكورس</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              نسبة التقدم: {user?.progress?.[courseId]?.percentage || 0}%
            </p>
            <button
              type="button"
              disabled={!selectedUnit || !enrolled || !selectedUnlocked || isSavingProgress}
              onClick={completeLesson}
              className="w-full bg-red-800 text-white font-bold rounded-xl py-2.5 hover:bg-red-900 transition-colors duration-300 disabled:opacity-60"
            >
              {isSavingProgress ? "جارٍ الحفظ..." : "تم إنهاء هذا الدرس"}
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <NotebookPen size={13} />
              لازم تخلص الدروس بالترتيب عشان يفتح الدرس اللي بعده.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
