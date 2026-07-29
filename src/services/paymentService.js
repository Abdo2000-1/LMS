import { collection, onSnapshot, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, firebaseFunctions, tenantId } from "./firebase.js";

export async function createPaymentOrder({ user, course }) {
  if (!user || !course?.id) throw new Error("بيانات الدفع غير مكتملة.");
  const createFawryPayment = httpsCallable(firebaseFunctions, "createFawryPayment");
  const result = await createFawryPayment({ courseId: course.id });
  return result.data;
}

export async function verifyPaymentOrder({ paymentId }) {
  if (!paymentId) throw new Error("طلب الدفع غير موجود.");
  const verifyFawryPayment = httpsCallable(firebaseFunctions, "verifyFawryPayment");
  const result = await verifyFawryPayment({ paymentId });
  return result.data;
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
