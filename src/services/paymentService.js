import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db, tenantId } from "./firebase.js";

function generateReference() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `FW-${Date.now()}-${random}`;
}

export async function createPaymentOrder({ user, course }) {
  const finalPrice =
    Number(course.discountPercent || 0) > 0
      ? Math.max(0, Number(course.price || 0) * (1 - Number(course.discountPercent || 0) / 100))
      : Number(course.price || 0);

  const referenceCode = generateReference();

  const payload = {
    tenantId,
    courseId: course.id,
    courseTitle: course.title,
    studentUid: user.uid,
    studentName: user.name,
    studentPhone: user.phone,
    amount: Number(finalPrice.toFixed(2)),
    status: "paid",
    referenceCode,
    createdAt: serverTimestamp(),
    paidAt: serverTimestamp(),
  };

  await addDoc(collection(db, "payments"), payload);

  const fawryBaseUrl = import.meta.env.VITE_FAWRY_PAY_BASE_URL || "https://atfawry.fawrystaging.com";
  const paymentUrl = `${fawryBaseUrl}?reference=${encodeURIComponent(referenceCode)}&amount=${payload.amount}`;

  return { referenceCode, paymentUrl, amount: payload.amount };
}

export function subscribePayments(callback) {
  const q = query(collection(db, "payments"), where("tenantId", "==", tenantId));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    data.sort((a, b) => {
      const aValue = a.createdAt?.seconds || 0;
      const bValue = b.createdAt?.seconds || 0;
      return bValue - aValue;
    });
    callback(data);
  });
}
