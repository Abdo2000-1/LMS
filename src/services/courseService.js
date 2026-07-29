import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, tenantId } from "./firebase.js";

function normalizeUnits(units = []) {
  return units
    .map((unit, index) => ({
      unitId: unit.unitId || `unit_${index + 1}`,
      order: Number.isFinite(unit.order) ? unit.order : index + 1,
      title: String(unit.title || "").trim(),
      youtubeVideoId: String(unit.youtubeVideoId || "").trim(),
      isFree: Boolean(unit.isFree),
    }))
    .filter((unit) => unit.title && unit.youtubeVideoId);
}

function normalizeQuizzes(quizzes = []) {
  return quizzes
    .map((quiz, index) => ({
      quizId: quiz.quizId || `quiz_${index + 1}`,
      title: String(quiz.title || "").trim(),
      minutes: Number(quiz.minutes || 10),
      questionsCount: Number(quiz.questionsCount || 10),
      order: Number.isFinite(quiz.order) ? quiz.order : index + 1,
    }))
    .filter((quiz) => quiz.title);
}

export async function createCourse({ teacherId, payload }) {
  const title = String(payload.title || "").trim();
  const description = String(payload.description || "").trim();
  const grade = String(payload.grade || "").trim();
  const price = Number(payload.price || 0);
  const discountPercent = Number(payload.discountPercent || 0);
  const thumbnailUrl = String(payload.thumbnailUrl || "").trim();
  const units = normalizeUnits(payload.units || []);

  if (!title) throw new Error("اسم الكورس مطلوب.");
  if (!thumbnailUrl) throw new Error("صورة الكورس مطلوبة.");
  if (!units.length) throw new Error("لازم تضيف على الأقل فيديو واحد.");

  await addDoc(collection(db, "courses"), {
    tenantId,
    teacherId,
    title,
    description,
    grade,
    price,
    discountPercent,
    thumbnailUrl,
    units,
    quizzes: [],
    studentsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCourse(courseId) {
  await deleteDoc(doc(db, "courses", courseId));
}

export function subscribeCourses(callback) {
  const q = query(collection(db, "courses"), where("tenantId", "==", tenantId));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
    data.sort((a, b) => {
      const aValue = a.createdAt?.seconds || 0;
      const bValue = b.createdAt?.seconds || 0;
      return bValue - aValue;
    });
    callback(data);
  });
}

export async function getCourseById(courseId) {
  const docRef = doc(db, "courses", courseId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function addQuizToCourse(courseId, quizPayload) {
  const course = await getCourseById(courseId);
  if (!course) throw new Error("الكورس غير موجود.");

  const quizzes = normalizeQuizzes([...(course.quizzes || []), quizPayload]);
  await updateDoc(doc(db, "courses", courseId), {
    quizzes,
    updatedAt: serverTimestamp(),
  });
}

export async function enrollStudentInCourse({ uid, courseId }) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    enrolledCourses: arrayUnion(courseId),
    updatedAt: serverTimestamp(),
  });

  const courseRef = doc(db, "courses", courseId);
  const snap = await getDoc(courseRef);
  if (snap.exists()) {
    const current = Number(snap.data().studentsCount || 0);
    await updateDoc(courseRef, { studentsCount: current + 1, updatedAt: serverTimestamp() });
  }
}

export async function markLessonCompleted({ uid, courseId, unitId, totalUnits }) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error("بيانات الطالب غير موجودة.");

  const user = snap.data();
  const progress = user.progress || {};
  const courseProgress = progress[courseId] || { watchedLessons: [], percentage: 0 };
  const watchedLessons = Array.from(new Set([...(courseProgress.watchedLessons || []), unitId]));
  const percentage = Math.min(100, Math.round((watchedLessons.length / Math.max(totalUnits, 1)) * 100));

  const nextProgress = {
    ...progress,
    [courseId]: {
      watchedLessons,
      percentage,
      updatedAt: new Date().toISOString(),
    },
  };

  await updateDoc(userRef, {
    progress: nextProgress,
    updatedAt: serverTimestamp(),
  });
}

export async function getTenantStudents() {
  const q = query(collection(db, "users"), where("tenantId", "==", tenantId), where("role", "==", "student"));
  const snap = await getDocs(q);
  const data = snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
  data.sort((a, b) => {
    const aValue = a.createdAt?.seconds || 0;
    const bValue = b.createdAt?.seconds || 0;
    return bValue - aValue;
  });
  return data;
}

export async function blockStudent(uid) {
  await updateDoc(doc(db, "users", uid), {
    isBlocked: true,
    updatedAt: serverTimestamp(),
  });
}
