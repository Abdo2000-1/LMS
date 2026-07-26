import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import AppHeader from "../components/AppHeader.jsx";
import Footer from "../components/Footer.jsx";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const courses = [
  {
    id: 1,
    badge: "خصم خاص",
    badgeColor: "bg-slate-800",
    title: "كورس النحو والصرف كاملة",
    tag: "٣ ثانوي",
    price: "٣٥٠ج",
    gradient: "from-slate-600 to-slate-900",
  },
  {
    id: 2,
    badge: "أونلاين",
    badgeColor: "bg-emerald-700",
    title: "كورس المراجعة النهائية كاملة (نحو + بلاغة)",
    tag: "٣ ثانوي",
    price: "١٢٠ج",
    gradient: "from-teal-700 to-teal-950",
  },
  {
    id: 3,
    badge: "مجاني",
    badgeColor: "bg-rose-700",
    title: "الكورس التأسيسي المجاني في اللغة العربية دفعة ٢٠٢٧",
    tag: "دفعة ٢٠٢٧",
    price: "مجاني",
    gradient: "from-blue-700 to-slate-900",
  },
  {
    id: 4,
    badge: "كورس مجاني",
    badgeColor: "bg-rose-700",
    title: "كورس ليالي الامتحان للثانوية العامة ٢٠٢٦",
    tag: "٣ ثانوي",
    price: "مجاني",
    gradient: "from-rose-900 to-slate-950",
  },
  {
    id: 5,
    badge: "الأكثر طلبًا",
    badgeColor: "bg-amber-600",
    title: "كورس البلاغة والنقد الأدبي كاملة",
    tag: "٢ ثانوي",
    price: "٢٨٠ج",
    gradient: "from-cyan-700 to-cyan-950",
  },
  {
    id: 6,
    badge: "جديد",
    badgeColor: "bg-indigo-700",
    title: "أساسيات القراءة والتعبير للصف الأول الثانوي",
    tag: "١ ثانوي",
    price: "١٥٠ج",
    gradient: "from-stone-600 to-stone-900",
  },
];

export default function Courses() {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-['Cairo',_sans-serif] transition-colors duration-500"
    >
      <AppHeader active="/courses" />

      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-10">
        <div className="mb-10 text-center sm:text-right">
          <h1 className="text-2xl sm:text-3xl font-extrabold">الكورسات</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            كل كورسات اللغة العربية في مكان واحد، اختار اللي يناسب صفك الدراسي.
          </p>
        </div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {courses.map((c) => (
            <motion.div
              key={c.id}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-slate-300/50 dark:hover:shadow-black/40 transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div
                className={`h-40 w-full flex items-center justify-center text-white relative bg-gradient-to-br ${c.gradient} overflow-hidden`}
              >
                <span
                  className={`absolute top-2 right-2 text-xs font-bold text-white px-2 py-1 rounded-md ${c.badgeColor} shadow-sm`}
                >
                  {c.badge}
                </span>
                <BookOpen
                  size={40}
                  className="opacity-70 group-hover:scale-110 group-hover:opacity-90 transition-all duration-500"
                />
              </div>
              <div className="p-4 flex flex-col gap-3 flex-1 text-right">
                <h3 className="font-bold text-sm leading-snug flex-1 group-hover:text-red-800 dark:group-hover:text-amber-400 transition-colors duration-300">
                  {c.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{c.tag}</span>
                  <span className="font-bold text-red-800 dark:text-amber-400">{c.price}</span>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button className="border border-red-800 dark:border-amber-400 text-red-800 dark:text-amber-400 rounded-lg py-2 text-sm font-bold hover:bg-red-800 hover:text-white dark:hover:bg-amber-400 dark:hover:text-slate-950 transition-all duration-300 active:scale-[0.97]">
                    الدخول للكورس
                  </button>
                  <button className="bg-red-700 text-white rounded-lg py-2 text-sm font-bold hover:bg-red-800 hover:shadow-md hover:shadow-red-700/30 transition-all duration-300 active:scale-[0.97]">
                    الإشتراك في الكورس!
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
