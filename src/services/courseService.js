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

export function extractYouTubeVideoId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const directId = raw.match(/^[a-zA-Z0-9_-]{11}$/);
  if (directId) return raw;

  try {
    const url = new URL(raw);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.split("/").filter(Boolean)[0] || "";
    }
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/")) {
        return url.pathname.split("/").filter(Boolean)[1] || "";
      }
      return url.searchParams.get("v") || "";
    }
  } catch {
    const match = raw.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    return match?.[1] || "";
  }

  return "";
}

function normalizeUnits(units = []) {
  return units
    .map((unit, index) => ({
      unitId: unit.unitId || `unit_${index + 1}`,
      order: Number.isFinite(unit.order) ? unit.order : index + 1,
      title: String(unit.title || "").trim(),
      youtubeVideoId: extractYouTubeVideoId(unit.youtubeVideoId),
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
      questionsCount: Number(quiz.questionsCount || quiz.questions?.length || 0),
      order: Number.isFinite(quiz.order) ? quiz.order : index + 1,
      questions: normalizeQuestions(quiz.questions || []),
    }))
    .filter((quiz) => quiz.title);
}

function normalizeQuestions(questions = []) {
  return questions
    .map((question, index) => ({
      questionId: question.questionId || `question_${index + 1}`,
      prompt: String(question.prompt || "").trim(),
      choices: (question.choices || []).map((choice) => String(choice || "").trim()).filter(Boolean).slice(0, 4),
      correctIndex: Number(question.correctIndex || 0),
      points: Number(question.points || 1),
    }))
    .filter((question) => question.prompt && question.choices.length >= 2 && question.correctIndex < question.choices.length);
}

function normalizeResources(resources = []) {
  return resources
    .map((resource, index) => ({
      resourceId: resource.resourceId || `resource_${index + 1}`,
      title: String(resource.title || "").trim(),
      fileUrl: String(resource.fileUrl || "").trim(),
      fileName: String(resource.fileName || "").trim(),
      fileType: String(resource.fileType || "").trim(),
      order: Number(resource.order || index + 1),
      isFree: Boolean(resource.isFree),
    }))
    .filter((resource) => resource.title && resource.fileUrl);
}

export function buildCourseContent(course = {}) {
  const videos = (course.units || []).map((unit) => ({ ...unit, type: "video", sortOrder: Number(unit.order || 0) }));
  const resources = (course.resources || []).map((resource) => ({
    ...resource,
    type: "resource",
    sortOrder: Number(resource.order || 0),
  }));
  const quizzes = (course.quizzes || []).map((quiz) => ({ ...quiz, type: "quiz", sortOrder: Number(quiz.order || 0) }));
  return [...videos, ...resources, ...quizzes].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createCourse({ teacherId, payload }) {
  const title = String(payload.title || "").trim();
  const description = String(payload.description || "").trim();
  const grade = String(payload.grade || "").trim();
  const price = Number(payload.price || 0);
  const discountPercent = Number(payload.discountPercent || 0);
  const thumbnailUrl = String(payload.thumbnailUrl || "").trim();
  const units = normalizeUnits(payload.units || []);
  const resources = normalizeResources(payload.resources || []);

  if (!title) throw new Error("اسم الكورس مطلوب.");
  if (!thumbnailUrl) throw new Error("صورة الكورس مطلوبة.");
  if (!units.length && !resources.length) throw new Error("لازم تضيف على الأقل درس فيديو أو ملف.");

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
    resources,
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

  const questions = normalizeQuestions(quizPayload.questions || []);
  if (!questions.length) throw new Error("لازم تضيف سؤالين اختيارات على الأقل في الكويز.");

  const quizzes = normalizeQuizzes([
    ...(course.quizzes || []),
    {
      ...quizPayload,
      quizId: `quiz_${Date.now()}`,
      questions,
      questionsCount: questions.length,
      order: Number(quizPayload.order || buildCourseContent(course).length + 1),
    },
  ]);
  await updateDoc(doc(db, "courses", courseId), {
    quizzes,
    updatedAt: serverTimestamp(),
  });
}

export async function addResourceToCourse(courseId, resourcePayload) {
  const course = await getCourseById(courseId);
  if (!course) throw new Error("الكورس غير موجود.");

  const resources = normalizeResources([
    ...(course.resources || []),
    {
      ...resourcePayload,
      resourceId: `resource_${Date.now()}`,
      order: Number(resourcePayload.order || buildCourseContent(course).length + 1),
    },
  ]);

  await updateDoc(doc(db, "courses", courseId), {
    resources,
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

export async function submitQuizAttempt({ uid, courseId, quiz }) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error("بيانات الطالب غير موجودة.");

  const questions = normalizeQuestions(quiz.questions || []);
  const answers = quiz.answers || {};
  const totalPoints = questions.reduce((sum, question) => sum + Number(question.points || 1), 0);
  const earnedPoints = questions.reduce((sum, question) => {
    return Number(answers[question.questionId]) === Number(question.correctIndex) ? sum + Number(question.points || 1) : sum;
  }, 0);
  const percentage = totalPoints ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  const attempt = {
    tenantId,
    uid,
    courseId,
    quizId: quiz.quizId,
    quizTitle: quiz.title,
    answers,
    totalPoints,
    earnedPoints,
    percentage,
    createdAt: serverTimestamp(),
  };

  await addDoc(collection(db, "quizAttempts"), attempt);

  const user = snap.data();
  const quizResults = {
    ...(user.quizResults || {}),
    [courseId]: {
      ...(user.quizResults?.[courseId] || {}),
      [quiz.quizId]: {
        earnedPoints,
        totalPoints,
        percentage,
        updatedAt: new Date().toISOString(),
      },
    },
  };

  await updateDoc(userRef, {
    quizResults,
    updatedAt: serverTimestamp(),
  });

  return { earnedPoints, totalPoints, percentage };
}

export function subscribeQuizAttempts(callback) {
  const q = query(collection(db, "quizAttempts"), where("tenantId", "==", tenantId));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(data);
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

export async function unblockStudent(uid) {
  await updateDoc(doc(db, "users", uid), {
    isBlocked: false,
    updatedAt: serverTimestamp(),
  });
}

export async function phoneExists(phone) {
  const normalized = String(phone || "").replace(/\D/g, "");
  if (!normalized) return false;
  const q = query(collection(db, "users"), where("tenantId", "==", tenantId), where("phone", "==", normalized));
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function emailExists(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return false;
  const q = query(collection(db, "users"), where("tenantId", "==", tenantId), where("email", "==", normalized));
  const snap = await getDocs(q);
  return !snap.empty;
}
