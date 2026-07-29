import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { auth, db, tenantId } from "../services/firebase.js";

const GOVERNORATES = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "الدقهلية",
  "الشرقية",
  "المنوفية",
  "القليوبية",
  "الغربية",
  "كفر الشيخ",
  "الفيوم",
  "أسيوط",
  "سوهاج",
  "المنيا",
  "البحيرة",
  "بني سويف",
  "قنا",
  "الأقصر",
  "أسوان",
  "دمياط",
  "الإسماعيلية",
  "بورسعيد",
  "السويس",
  "مطروح",
  "شمال سيناء",
  "جنوب سيناء",
  "الوادي الجديد",
  "البحر الأحمر",
];

export const STUDENT_GRADES = ["الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"];
export const GOVERNORATE_OPTIONS = GOVERNORATES;

export function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function buildLoginEmailFromPhone(phone) {
  const normalized = normalizePhone(phone);
  return `${normalized}@students.alostaz.app`;
}

function mapFirebaseError(error) {
  const code = error?.code || "";
  if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
    return "رقم الهاتف أو كلمة المرور غير صحيح.";
  }
  if (code === "auth/email-already-in-use") {
    return "هذا الرقم مسجل بالفعل. جرّب تسجيل الدخول.";
  }
  if (code === "auth/weak-password") {
    return "كلمة المرور ضعيفة جدًا.";
  }
  if (code === "auth/too-many-requests") {
    return "عدد محاولات كبير جدًا، حاول لاحقًا.";
  }
  return "حدث خطأ في المصادقة، حاول مرة أخرى.";
}

async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

function normalizeRole(role) {
  return ["student", "teacher", "developer"].includes(role) ? role : "student";
}

function toPublicUser(profile, firebaseUser) {
  return {
    uid: firebaseUser.uid,
    name: profile?.name || firebaseUser.displayName || "مستخدم",
    email: profile?.email || firebaseUser.email || "",
    phone: profile?.phone || "",
    role: normalizeRole(profile?.role),
    grade: profile?.grade || "",
    governorate: profile?.governorate || "",
    tenantId: profile?.tenantId || tenantId,
    enrolledCourses: profile?.enrolledCourses || [],
    progress: profile?.progress || {},
    quizResults: profile?.quizResults || {},
    isBlocked: Boolean(profile?.isBlocked),
  };
}

export async function registerRequest({ name, email, phone, grade, governorate, password }) {
  const normalizedPhone = normalizePhone(phone);
  const normalizedEmail = String(email || "").trim().toLowerCase();

  const authEmail = buildLoginEmailFromPhone(normalizedPhone);

  try {
    const phoneSnap = await getDocs(
      query(collection(db, "users"), where("tenantId", "==", tenantId), where("phone", "==", normalizedPhone))
    );
    if (!phoneSnap.empty) {
      throw new Error("رقم الموبايل مسجل بالفعل. جرّب تسجيل الدخول.");
    }

    const emailSnap = await getDocs(
      query(collection(db, "users"), where("tenantId", "==", tenantId), where("email", "==", normalizedEmail))
    );
    if (!emailSnap.empty) {
      throw new Error("البريد الإلكتروني مسجل بالفعل. استخدم بريدًا آخر.");
    }

    const credential = await createUserWithEmailAndPassword(auth, authEmail, password);
    await updateProfile(credential.user, { displayName: name.trim() });

    const profile = {
      uid: credential.user.uid,
      tenantId,
      role: "student",
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      grade: String(grade || "").trim(),
      governorate: String(governorate || "").trim(),
      enrolledCourses: [],
      progress: {},
      isBlocked: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", credential.user.uid), profile);
    const token = await credential.user.getIdToken();
    return { user: toPublicUser(profile, credential.user), token };
  } catch (error) {
    if (error instanceof Error && !error?.code?.startsWith?.("auth/")) {
      throw error;
    }
    throw new Error(mapFirebaseError(error));
  }
}

export async function loginRequest({ phone, password }) {
  const normalizedPhone = normalizePhone(phone);
  const authEmail = buildLoginEmailFromPhone(normalizedPhone);

  try {
    const credential = await signInWithEmailAndPassword(auth, authEmail, password);
    const profile = await getUserProfile(credential.user.uid);
    const user = toPublicUser(
      profile || {
        role: "student",
        phone: normalizedPhone,
      },
      credential.user
    );

    if (user.isBlocked) {
      await signOut(auth);
      throw new Error("تم إيقاف هذا الحساب. تواصل مع إدارة المنصة.");
    }

    const token = await credential.user.getIdToken();
    return { user, token };
  } catch (error) {
    if (error instanceof Error && !error.message.includes("auth/")) {
      throw error;
    }
    throw new Error(mapFirebaseError(error));
  }
}

export async function updateProfileRequest({ name }) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("لا توجد جلسة تسجيل دخول.");

  const profileRef = doc(db, "users", currentUser.uid);
  await updateDoc(profileRef, {
    name: String(name || "").trim(),
    updatedAt: serverTimestamp(),
  });
  await updateProfile(currentUser, { displayName: String(name || "").trim() });

  const profile = await getUserProfile(currentUser.uid);
  return { user: toPublicUser(profile, currentUser) };
}

export function logoutRequest() {
  return signOut(auth);
}

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null, null);
      return;
    }

    const profile = await getUserProfile(firebaseUser.uid);
    const user = toPublicUser(profile, firebaseUser);
    if (user.isBlocked) {
      await signOut(auth);
      callback(null, null);
      return;
    }
    const token = await firebaseUser.getIdToken();
    callback(user, token);
  });
}

export function getLandingRouteByRole(role) {
  if (role === "teacher") return "/teacher/dashboard";
  if (role === "developer") return "/dev/master";
  return "/dashboard";
}
