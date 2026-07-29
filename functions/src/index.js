import crypto from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

initializeApp();

const db = getFirestore();

function getFawryConfig() {
  const merchantCode = process.env.FAWRY_MERCHANT_CODE || "";
  const secureKey = process.env.FAWRY_SECURE_KEY || "";
  const baseUrl = process.env.FAWRY_BASE_URL || "https://atfawry.fawrystaging.com";
  const returnUrl = process.env.FAWRY_RETURN_URL || "";

  if (!merchantCode || !secureKey) {
    throw new HttpsError("failed-precondition", "إعدادات فوري غير مكتملة في Firebase Functions.");
  }

  return { merchantCode, secureKey, baseUrl, returnUrl };
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function calculateFinalPrice(course) {
  const basePrice = Number(course?.price || 0);
  const discountPercent = Number(course?.discountPercent || 0);
  if (!discountPercent) return basePrice;
  return Math.max(0, Math.round(basePrice * (1 - discountPercent / 100)));
}

function isPaidStatus(status) {
  return ["PAID", "SUCCESS", "paid", "success"].includes(String(status || ""));
}

async function getAuthedStudent(request) {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "لازم تسجل دخول الأول.");

  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) throw new HttpsError("not-found", "بيانات الطالب غير موجودة.");

  const user = { uid, ...userSnap.data() };
  if (user.isBlocked) throw new HttpsError("permission-denied", "هذا الحساب موقوف.");
  return user;
}

export const createFawryPayment = onCall({ cors: true }, async (request) => {
  const user = await getAuthedStudent(request);
  const { merchantCode, secureKey, baseUrl, returnUrl } = getFawryConfig();
  const courseId = String(request.data?.courseId || "").trim();
  if (!courseId) throw new HttpsError("invalid-argument", "الكورس مطلوب.");

  const courseSnap = await db.collection("courses").doc(courseId).get();
  if (!courseSnap.exists) throw new HttpsError("not-found", "الكورس غير موجود.");

  const course = { id: courseSnap.id, ...courseSnap.data() };
  const amount = calculateFinalPrice(course);
  const merchantRefNum = `ALOSTAZ-${courseId}-${user.uid}-${Date.now()}`;
  const customerProfileId = normalizePhone(user.phone) || user.uid;
  const customerMobile = normalizePhone(user.phone);
  const customerEmail = user.email || `${customerProfileId}@students.alostaz.app`;
  const paymentMethod = "PAYATFAWRY";
  const formattedAmount = amount.toFixed(2);
  const signature = sha256(`${merchantCode}${merchantRefNum}${customerProfileId}${paymentMethod}${formattedAmount}${secureKey}`);

  const payload = {
    merchantCode,
    merchantRefNum,
    customerName: user.name || "Alostaz student",
    customerMobile,
    customerEmail,
    customerProfileId,
    paymentMethod,
    amount: formattedAmount,
    currencyCode: "EGP",
    language: "ar-eg",
    chargeItems: [
      {
        itemId: courseId,
        description: course.title || "Alostaz course",
        price: formattedAmount,
        quantity: 1,
      },
    ],
    returnUrl,
    signature,
  };

  const response = await fetch(`${baseUrl}/ECommerceWeb/Fawry/payments/charge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const fawryData = await response.json().catch(() => ({}));

  if (!response.ok || (fawryData.statusCode && Number(fawryData.statusCode) !== 200)) {
    throw new HttpsError("unavailable", fawryData.statusDescription || fawryData.message || "فشل إنشاء طلب فوري.");
  }

  const referenceCode = fawryData.referenceNumber || fawryData.fawryRefNumber || merchantRefNum;
  const paymentDoc = await db.collection("payments").add({
    tenantId: course.tenantId || "default_tenant",
    courseId,
    courseTitle: course.title || "",
    studentUid: user.uid,
    studentName: user.name || "",
    studentPhone: user.phone || "",
    amount,
    status: "pending",
    merchantRefNum,
    referenceCode,
    paymentUrl: fawryData.paymentUrl || fawryData.redirectUrl || "",
    fawryStatus: fawryData.statusDescription || "",
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    paymentId: paymentDoc.id,
    merchantRefNum,
    referenceCode,
    paymentUrl: fawryData.paymentUrl || fawryData.redirectUrl || "",
    amount,
  };
});

export const verifyFawryPayment = onCall({ cors: true }, async (request) => {
  const user = await getAuthedStudent(request);
  const { merchantCode, secureKey, baseUrl } = getFawryConfig();
  const paymentId = String(request.data?.paymentId || "").trim();
  if (!paymentId) throw new HttpsError("invalid-argument", "طلب الدفع مطلوب.");

  const paymentRef = db.collection("payments").doc(paymentId);
  const paymentSnap = await paymentRef.get();
  if (!paymentSnap.exists) throw new HttpsError("not-found", "طلب الدفع غير موجود.");

  const payment = paymentSnap.data();
  if (payment.studentUid !== user.uid) throw new HttpsError("permission-denied", "لا يمكنك التحقق من طلب دفع طالب آخر.");

  const merchantRefNum = payment.merchantRefNum;
  const signature = sha256(`${merchantCode}${merchantRefNum}${secureKey}`);
  const statusUrl = new URL(`${baseUrl}/ECommerceWeb/Fawry/payments/status/v2`);
  statusUrl.searchParams.set("merchantCode", merchantCode);
  statusUrl.searchParams.set("merchantRefNumber", merchantRefNum);
  statusUrl.searchParams.set("signature", signature);

  const response = await fetch(statusUrl);
  const fawryData = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new HttpsError("unavailable", fawryData.statusDescription || fawryData.message || "فشل الاستعلام عن حالة الدفع.");
  }

  const paymentStatus = fawryData.paymentStatus || fawryData.orderStatus || fawryData.statusDescription || "";
  const paid = isPaidStatus(paymentStatus);

  await paymentRef.update({
    status: paid ? "paid" : "pending",
    fawryStatus: paymentStatus,
    updatedAt: FieldValue.serverTimestamp(),
    ...(paid ? { paidAt: FieldValue.serverTimestamp() } : {}),
  });

  if (paid) {
    await db.collection("users").doc(user.uid).update({
      enrolledCourses: FieldValue.arrayUnion(payment.courseId),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return { paid, status: paymentStatus };
});
