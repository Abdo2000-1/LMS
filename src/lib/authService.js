// src/lib/authService.js
//
// دي طبقة الاتصال بالـ Backend الخاصة بالتسجيل والدخول.
// دلوقتي هي "Mock" (وهمية) بتحاكي سلوك سيرفر حقيقي (تأخير شبكة + أخطاء)
// عشان تقدر تبني وتجرب الـ UI كامل من غير ما تستنى الـ Backend.
//
// لما تجهز الـ Backend بتاعك بـ Node.js، محتاج بس تستبدل جسم الدالتين
// loginRequest و registerRequest بنداء fetch/axios حقيقي على الـ API،
// وتسيب نفس الـ input/output (شكل الداتا اللي بتدخل وبتخرج) زي ما هو
// عشان باقي المشروع (AuthContext, Login, Register) ميتغيرش خالص.
//
// مثال لما يكون عندك API حقيقي:
//
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
//
// export async function loginRequest({ email, password }) {
//   const res = await fetch(`${API_BASE_URL}/auth/login`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ email, password }),
//   });
//   const data = await res.json();
//   if (!res.ok) {
//     const err = new Error(data.message || "حصل خطأ أثناء تسجيل الدخول");
//     err.code = data.code;
//     throw err;
//   }
//   return data; // المتوقع: { user: {...}, token: "..." }
// }

const FAKE_NETWORK_DELAY_MS = 700;

// حسابات تجريبية جاهزة عشان تختبر تجربة الاستخدام (UX/UI) قبل ربط الـ Backend الحقيقي.
// أي حد يقدر يدخل بيها دلوقتي، وهتتشال أوتوماتيك لما نوصلها بالسيرفر الحقيقي.
const DEMO_USERS = [
  {
    id: "u_demo_student",
    name: "محمد أحمد",
    email: "example@gmail.com",
    password: "123456",
    role: "student",
    grade: "الصف الثالث الثانوي",
  },
  {
    id: "u_demo_teacher",
    name: "أ. سارة محمود",
    email: "teacher@example.com",
    password: "123456",
    role: "teacher",
    grade: null,
  },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateFakeToken(user) {
  // مجرد Token وهمي شكلي؛ في الباك اند الحقيقي هيبقى JWT حقيقي جاي من السيرفر
  return btoa(`${user.id}:${Date.now()}`);
}

export async function loginRequest({ email, password }) {
  await delay(FAKE_NETWORK_DELAY_MS);

  const user = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );

  if (!user) {
    const err = new Error("مفيش حساب مسجل بالبريد الإلكتروني ده.");
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  if (user.password !== password) {
    const err = new Error("كلمة المرور غير صحيحة، حاول تاني.");
    err.code = "WRONG_PASSWORD";
    throw err;
  }

  const { password: _omit, ...safeUser } = user;
  return { user: safeUser, token: generateFakeToken(user) };
}

export async function registerRequest({ name, email, password, role, grade }) {
  await delay(FAKE_NETWORK_DELAY_MS);

  const normalizedEmail = email.trim().toLowerCase();
  const alreadyExists = DEMO_USERS.some(
    (u) => u.email.toLowerCase() === normalizedEmail
  );

  if (alreadyExists) {
    const err = new Error("البريد الإلكتروني ده مستخدم بالفعل، جرب تسجل دخول بدل كده.");
    err.code = "EMAIL_TAKEN";
    throw err;
  }

  const newUser = {
    id: `u_${Date.now()}`,
    name: name.trim(),
    email: normalizedEmail,
    role,
    grade: role === "student" ? grade : null,
  };

  // بنضيفه لقائمة المستخدمين الوهمية عشان تقدر تعمل login بيه في نفس الجلسة للتجربة
  DEMO_USERS.push({ ...newUser, password });

  return { user: newUser, token: generateFakeToken(newUser) };
}
