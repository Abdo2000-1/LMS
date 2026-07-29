import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle,
  Trash2,
  Upload,
  Clock3,
  Wallet,
  Users,
  Ban,
  BadgeDollarSign,
  NotebookText,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import AppHeader from "../components/AppHeader.jsx";
import Footer from "../components/Footer.jsx";
import {
  addQuizToCourse,
  blockStudent,
  createCourse,
  deleteCourse,
  getTenantStudents,
  subscribeCourses,
} from "../services/courseService.js";
import { subscribePayments } from "../services/paymentService.js";
import { uploadImageToCloudinary } from "../services/cloudinaryService.js";

function formatDate(value) {
  if (!value) return "-";
  const date = value?.toDate ? value.toDate() : new Date(value);
  return date.toLocaleString("ar-EG", { hour12: true });
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);

  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    grade: "الصف الثالث الثانوي",
    price: "",
    discountPercent: "",
    thumbnailUrl: "",
    units: [{ title: "", youtubeVideoId: "", isFree: false }],
  });

  const [quizForm, setQuizForm] = useState({
    courseId: "",
    title: "",
    minutes: "15",
    questionsCount: "10",
  });

  useEffect(() => {
    const unsubCourses = subscribeCourses(setCourses);
    const unsubPayments = subscribePayments(setPayments);

    getTenantStudents().then(setStudents).catch(() => setError("تعذر تحميل قائمة الطلاب."));

    return () => {
      unsubCourses();
      unsubPayments();
    };
  }, []);

  useEffect(() => {
    if (!quizForm.courseId && courses.length > 0) {
      setQuizForm((prev) => ({ ...prev, courseId: courses[0].id }));
    }
  }, [courses, quizForm.courseId]);

  const summary = useMemo(
    () => ({
      totalCourses: courses.length,
      totalStudents: students.filter((s) => !s.isBlocked).length,
      paidPayments: payments.filter((p) => p.status === "paid").length,
      pendingPayments: payments.filter((p) => p.status === "pending").length,
    }),
    [courses, students, payments]
  );

  function handleCourseChange(e) {
    const { name, value } = e.target;
    setCourseForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleUnitChange(index, field, value) {
    setCourseForm((prev) => {
      const units = [...prev.units];
      units[index] = { ...units[index], [field]: value };
      return { ...prev, units };
    });
  }

  function addUnit() {
    setCourseForm((prev) => ({
      ...prev,
      units: [...prev.units, { title: "", youtubeVideoId: "", isFree: false }],
    }));
  }

  function removeUnit(index) {
    setCourseForm((prev) => ({
      ...prev,
      units: prev.units.filter((_, unitIndex) => unitIndex !== index),
    }));
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setIsUploadingImage(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setCourseForm((prev) => ({ ...prev, thumbnailUrl: url }));
    } catch (uploadError) {
      setError(uploadError.message || "فشل رفع الصورة.");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  }

  async function submitCourse(e) {
    e.preventDefault();
    setError("");
    setIsSavingCourse(true);
    try {
      await createCourse({ teacherId: user.uid, payload: courseForm });
      setCourseForm({
        title: "",
        description: "",
        grade: "الصف الثالث الثانوي",
        price: "",
        discountPercent: "",
        thumbnailUrl: "",
        units: [{ title: "", youtubeVideoId: "", isFree: false }],
      });
    } catch (saveError) {
      setError(saveError.message || "تعذر حفظ الكورس.");
    } finally {
      setIsSavingCourse(false);
    }
  }

  async function handleDeleteCourse(courseId) {
    setError("");
    try {
      await deleteCourse(courseId);
    } catch (deleteError) {
      setError(deleteError.message || "تعذر حذف الكورس.");
    }
  }

  async function handleBlockStudent(studentId) {
    setError("");
    try {
      await blockStudent(studentId);
      const refreshed = await getTenantStudents();
      setStudents(refreshed);
    } catch (blockError) {
      setError(blockError.message || "تعذر إيقاف الطالب.");
    }
  }

  async function submitQuiz(e) {
    e.preventDefault();
    if (!quizForm.courseId) return;
    setError("");
    setIsSavingQuiz(true);
    try {
      await addQuizToCourse(quizForm.courseId, {
        title: quizForm.title,
        minutes: Number(quizForm.minutes),
        questionsCount: Number(quizForm.questionsCount),
      });
      setQuizForm((prev) => ({ ...prev, title: "", minutes: "15", questionsCount: "10" }));
    } catch (quizError) {
      setError(quizError.message || "تعذر إضافة الكويز.");
    } finally {
      setIsSavingQuiz(false);
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-['Cairo',_sans-serif] transition-colors duration-500"
    >
      <AppHeader active="/teacher/dashboard" />

      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-10 space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-right">
          <h1 className="text-3xl font-extrabold">لوحة تحكم المدرّس</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            إدارة الكورسات، الطلاب، المدفوعات، والكويزات من مكان واحد.
          </p>
        </motion.div>

        {error && (
          <div className="text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 rounded-xl px-4 py-3 text-right">
            {error}
          </div>
        )}

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "عدد الكورسات", value: summary.totalCourses, icon: NotebookText },
            { label: "الطلاب النشطين", value: summary.totalStudents, icon: Users },
            { label: "المدفوعات المكتملة", value: summary.paidPayments, icon: Wallet },
            { label: "طلبات الدفع المعلقة", value: summary.pendingPayments, icon: Clock3 },
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

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={submitCourse} className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 ring-1 ring-black/5 dark:ring-white/10 space-y-4">
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <PlusCircle size={20} />
              إضافة كورس جديد
            </h2>

            <input
              name="title"
              value={courseForm.title}
              onChange={handleCourseChange}
              placeholder="اسم الكورس"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
            />
            <textarea
              name="description"
              value={courseForm.description}
              onChange={handleCourseChange}
              placeholder="وصف الكورس"
              rows={3}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                name="grade"
                value={courseForm.grade}
                onChange={handleCourseChange}
                placeholder="الصف الدراسي"
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
              />
              <input
                name="price"
                type="number"
                min="0"
                value={courseForm.price}
                onChange={handleCourseChange}
                placeholder="السعر"
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
              />
              <input
                name="discountPercent"
                type="number"
                min="0"
                max="100"
                value={courseForm.discountPercent}
                onChange={handleCourseChange}
                placeholder="الخصم %"
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold">صورة الكورس</label>
              <label className="flex items-center justify-center gap-2 cursor-pointer border border-dashed border-slate-300 dark:border-slate-700 rounded-xl px-4 py-4 bg-white dark:bg-slate-950 hover:border-amber-400 transition-colors duration-300">
                <Upload size={16} />
                <span className="text-sm">{isUploadingImage ? "جارٍ رفع الصورة..." : "اختر صورة من جهازك"}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {courseForm.thumbnailUrl && (
                <img src={courseForm.thumbnailUrl} alt="صورة الكورس" className="w-full h-36 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-bold">فيديوهات الكورس (بالترتيب)</h3>
              {courseForm.units.map((unit, index) => (
                <div key={`unit-${index}`} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                  <input
                    value={unit.title}
                    onChange={(e) => handleUnitChange(index, "title", e.target.value)}
                    placeholder={`عنوان الدرس ${index + 1}`}
                    className="sm:col-span-5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 outline-none"
                  />
                  <input
                    value={unit.youtubeVideoId}
                    onChange={(e) => handleUnitChange(index, "youtubeVideoId", e.target.value)}
                    placeholder="YouTube Video ID"
                    className="sm:col-span-5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeUnit(index)}
                    className="sm:col-span-2 rounded-lg border border-red-200 text-red-700 dark:border-red-900/60 dark:text-red-300 px-2 py-2 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-300"
                  >
                    حذف
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addUnit}
                className="text-sm font-bold text-red-800 dark:text-amber-400 hover:underline"
              >
                + إضافة درس جديد
              </button>
            </div>

            <button
              type="submit"
              disabled={isSavingCourse}
              className="w-full bg-red-800 text-white font-extrabold rounded-xl py-3 hover:bg-red-900 transition-colors duration-300 disabled:opacity-60"
            >
              {isSavingCourse ? "جارٍ حفظ الكورس..." : "حفظ الكورس"}
            </button>
          </form>

          <form onSubmit={submitQuiz} className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 ring-1 ring-black/5 dark:ring-white/10 space-y-4">
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <Clock3 size={20} />
              إضافة كويز بوقت محدد
            </h2>

            <select
              value={quizForm.courseId}
              onChange={(e) => setQuizForm((prev) => ({ ...prev, courseId: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>

            <input
              value={quizForm.title}
              onChange={(e) => setQuizForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="عنوان الكويز"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="1"
                value={quizForm.minutes}
                onChange={(e) => setQuizForm((prev) => ({ ...prev, minutes: e.target.value }))}
                placeholder="الوقت بالدقائق"
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
              />
              <input
                type="number"
                min="1"
                value={quizForm.questionsCount}
                onChange={(e) => setQuizForm((prev) => ({ ...prev, questionsCount: e.target.value }))}
                placeholder="عدد الأسئلة"
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingQuiz || !quizForm.courseId}
              className="w-full bg-red-800 text-white font-extrabold rounded-xl py-3 hover:bg-red-900 transition-colors duration-300 disabled:opacity-60"
            >
              {isSavingQuiz ? "جارٍ إضافة الكويز..." : "إضافة الكويز"}
            </button>
          </form>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 ring-1 ring-black/5 dark:ring-white/10">
            <h2 className="text-xl font-extrabold mb-4">إدارة الكورسات الحالية</h2>
            <div className="space-y-3 max-h-[26rem] overflow-auto pr-1">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-start justify-between gap-3"
                >
                  <div className="text-right">
                    <h3 className="font-bold">{course.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <BadgeDollarSign size={12} className="inline ml-1" />
                      السعر: {course.price || 0} ج.م — الخصم: {course.discountPercent || 0}%
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      عدد الفيديوهات: {(course.units || []).length}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCourse(course.id)}
                    className="shrink-0 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg px-2 py-2 transition-colors duration-300"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 ring-1 ring-black/5 dark:ring-white/10">
            <h2 className="text-xl font-extrabold mb-4">إدارة الطلاب والمدفوعات</h2>
            <div className="space-y-3 max-h-[26rem] overflow-auto pr-1">
              {students.map((student) => (
                <div
                  key={student.uid}
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between gap-3"
                >
                  <div className="text-right">
                    <p className="font-bold">{student.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{student.phone}</p>
                  </div>
                  {!student.isBlocked ? (
                    <button
                      type="button"
                      onClick={() => handleBlockStudent(student.uid)}
                      className="flex items-center gap-1 text-xs font-bold text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 rounded-lg px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-300"
                    >
                      <Ban size={14} />
                      إيقاف
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-red-600 dark:text-red-300">موقوف</span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
              <h3 className="font-bold mb-3">سجل المدفوعات (تاريخ / وقت)</h3>
              <div className="space-y-2 max-h-44 overflow-auto pr-1">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="text-right">
                      <p className="font-bold">{payment.studentName}</p>
                      <p className="text-slate-500 dark:text-slate-400">{payment.courseTitle}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold">{payment.amount} ج.م</p>
                      <p className="text-slate-500 dark:text-slate-400">{formatDate(payment.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
