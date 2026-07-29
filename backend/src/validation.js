const VALID_ROLES = new Set(["student", "teacher"]);

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function validateRegisterBody(body) {
  const name = String(body.name || "").trim();
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const role = String(body.role || "student").trim();
  const grade = body.grade == null ? null : String(body.grade).trim();

  if (name.length < 3) return "الاسم لازم يكون ٣ أحرف على الأقل.";
  if (name.length > 120) return "الاسم طويل جدًا.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "صيغة البريد الإلكتروني غير صحيحة.";
  if (email.length > 190) return "البريد الإلكتروني طويل جدًا.";
  if (password.length < 6) return "كلمة المرور لازم تكون ٦ أحرف على الأقل.";
  if (password.length > 128) return "كلمة المرور طويلة جدًا.";
  if (!VALID_ROLES.has(role)) return "نوع الحساب غير صالح.";
  if (role === "student" && !grade) return "لازم تحدد الصف الدراسي للطالب.";
  if (grade && grade.length > 120) return "اسم الصف طويل جدًا.";

  return null;
}

export function validateLoginBody(body) {
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  if (!email || !password) return "البريد الإلكتروني وكلمة المرور مطلوبين.";
  return null;
}

export function validateProfileUpdateBody(body) {
  const name = String(body.name || "").trim();
  if (name.length < 3) return "الاسم لازم يكون ٣ أحرف على الأقل.";
  if (name.length > 120) return "الاسم طويل جدًا.";
  return null;
}
