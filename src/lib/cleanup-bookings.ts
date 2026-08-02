import { prisma } from "@/lib/prisma";

export async function cleanupExpiredBookings() {
 const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
 const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

 try {
 const expiredQR = await prisma.booking.findMany({
 where: {
 status: "PENDING_PAYMENT",
 payment: { method: "QR_BANKING" },
 createdAt: { lt: tenMinsAgo }
 },
 select: { id: true }
 });

 const expiredManual = await prisma.booking.findMany({
 where: {
 status: "PENDING_PAYMENT",
 payment: { method: "MANUAL" },
 createdAt: { lt: oneHourAgo }
 },
 select: { id: true }
 });

 const allExpiredIds = [...expiredQR.map((b: any) => b.id), ...expiredManual.map((b: any) => b.id)];

 if (allExpiredIds.length > 0) {
 await prisma.booking.updateMany({
 where: { id: { in: allExpiredIds } },
 data: { status: "CANCELLED" }
 });
 console.log(`Cleaned up ${allExpiredIds.length} expired bookings.`);
 }
 } catch (error) {
 console.error("Failed to cleanup expired bookings:", error);
 }
}
