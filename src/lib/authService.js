import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, tenantId } from "../services/firebase.js";

const RESERVED_TEACHER_PHONE = normalizePhone(import.meta.env.VITE_TEACHER_PHONE || "");
const RESERVED_DEVELOPER_PHONE = normalizePhone(import.meta.env.VITE_DEVELOPER_PHONE || "");

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

function getReservedRoleByPhone(phone) {
  if (phone && phone === RESERVED_TEACHER_PHONE) return "teacher";
  if (phone && phone === RESERVED_DEVELOPER_PHONE) return "developer";
  return "student";
}

async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

function toPublicUser(profile, firebaseUser) {
  return {
    uid: firebaseUser.uid,
    name: profile?.name || firebaseUser.displayName || "مستخدم",
    email: profile?.email || firebaseUser.email || "",
    phone: profile?.phone || "",
    role: profile?.role || "student",
    grade: profile?.grade || "",
    governorate: profile?.governorate || "",
    tenantId: profile?.tenantId || tenantId,
    enrolledCourses: profile?.enrolledCourses || [],
    progress: profile?.progress || {},
    isBlocked: Boolean(profile?.isBlocked),
  };
}

async function ensurePrivilegedProfile(firebaseUser, phone) {
  const profile = await getUserProfile(firebaseUser.uid);
  if (profile) return profile;

  const role = getReservedRoleByPhone(phone);
  if (role === "student") return null;

  const privilegedProfile = {
    uid: firebaseUser.uid,
    tenantId,
    role,
    phone,
    name: role === "teacher" ? "حساب المدرس" : "حساب المطور",
    email: firebaseUser.email || "",
    grade: "",
    governorate: "",
    enrolledCourses: [],
    progress: {},
    isBlocked: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "users", firebaseUser.uid), privilegedProfile, { merge: true });
  return privilegedProfile;
}

export async function registerRequest({ name, email, phone, grade, governorate, password }) {
  const normalizedPhone = normalizePhone(phone);
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const role = getReservedRoleByPhone(normalizedPhone);

  if (role !== "student") {
    throw new Error("هذا الرقم مخصص لحساب إداري ولا يمكن التسجيل به كطالب.");
  }

  const authEmail = buildLoginEmailFromPhone(normalizedPhone);

  try {
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
    throw new Error(mapFirebaseError(error));
  }
}

export async function loginRequest({ phone, password }) {
  const normalizedPhone = normalizePhone(phone);
  const authEmail = buildLoginEmailFromPhone(normalizedPhone);

  try {
    const credential = await signInWithEmailAndPassword(auth, authEmail, password);
    const fallbackRole = getReservedRoleByPhone(normalizedPhone);
    const profile = (await getUserProfile(credential.user.uid)) || (await ensurePrivilegedProfile(credential.user, normalizedPhone));
    const user = toPublicUser(
      profile || {
        role: fallbackRole,
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
    const token = await firebaseUser.getIdToken();
    callback(user, token);
  });
}

export function getLandingRouteByRole(role) {
  if (role === "teacher") return "/teacher/dashboard";
  if (role === "developer") return "/dev/master";
  return "/dashboard";
}
