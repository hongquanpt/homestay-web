import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCheckInEmail } from "@/lib/email";

export async function POST(request: Request) {
 try {
 // This assumes a generic webhook payload. E.g., SePay webhook structure.
 const body = await request.json();
 const {
 amountIn,
 transactionID,
 content, // This is where the syntax "Thanh toan <bookingId>" would be.
 } = body;

 if (!amountIn || !transactionID || !content) {
 return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
 }

 // 1. Extract booking ID from the content
 // We expect content to contain the bookingId, e.g., "Thanh toan cm2x3abcd0001xyz"
 const words = content.split(" ");
 let bookingId = null;
 
 // We assume the bookingId is somewhere in the content. Let's just find a matching booking.
 // In a real scenario, you'd parse exactly according to your syntax.
 for (const word of words) {
 const booking = await prisma.booking.findUnique({
 where: { id: word.trim() },
 include: { payment: true, details: { include: { room: { include: { accessInfo: true } } } } }
 });
 if (booking) {
 bookingId = booking.id;
 break;
 }
 }

 if (!bookingId) {
 // Couldn't match to a booking, just return OK so webhook doesn't retry
 return NextResponse.json({ success: true, message: "No matching booking found" });
 }

 const booking = await prisma.booking.findUnique({
 where: { id: bookingId },
 include: {
 payment: true,
 details: {
 include: {
 room: {
 include: { accessInfo: true }
 }
 }
 }
 }
 });

 if (!booking) {
 return NextResponse.json({ error: "Booking not found" }, { status: 404 });
 }

 if (booking.status === "PAID" || booking.status === "EMAIL_SENT" || booking.status === "CHECKED_IN" || booking.status === "COMPLETED") {
 return NextResponse.json({ success: true, message: "Already processed" });
 }

 // 2. Validate amount
 if (amountIn < (booking.payment?.amount || 0)) {
 // Partial payment logic can be handled here
 await prisma.paymentTransaction.create({
 data: {
 paymentId: booking.payment!.id,
 transactionId: transactionID.toString(),
 amount: amountIn,
 status: "PARTIAL",
 webhookData: body,
 }
 });
 
 await prisma.booking.update({
 where: { id: bookingId },
 data: { status: "PAYMENT_VERIFICATION_PENDING" }
 });

 return NextResponse.json({ success: true, message: "Partial payment recorded" });
 }

 // 3. Full Payment Successful
 await prisma.$transaction(async (tx) => {
 await tx.paymentTransaction.create({
 data: {
 paymentId: booking.payment!.id,
 transactionId: transactionID.toString(),
 amount: amountIn,
 status: "SUCCESS",
 webhookData: body,
 }
 });

 await tx.payment.update({
 where: { id: booking.payment!.id },
 data: { status: "SUCCESS" }
 });

 await tx.booking.update({
 where: { id: bookingId },
 data: { status: "PAID" }
 });
 });

 // 4. Send the Check-in Email
 if (booking.customerEmail && booking.details.length > 0) {
 const roomDetails = booking.details[0];
 const roomInfo = roomDetails.room;
 const accessInfo = roomInfo.accessInfo;

 const emailResult = await sendCheckInEmail({
 to: booking.customerEmail,
 bookingId: booking.id,
 customerName: booking.customerName,
 roomName: roomInfo.name,
 checkInTime: new Date(roomDetails.startTime).toLocaleString("vi-VN"),
 checkOutTime: new Date(roomDetails.endTime).toLocaleString("vi-VN"),
 doorPassword: accessInfo?.doorPassword || "",
 roomPassword: accessInfo?.roomPassword || "",
 wifiName: accessInfo?.wifiName || "",
 wifiPassword: accessInfo?.wifiPassword || "",
 address: accessInfo ? `${accessInfo.houseNumber} ${accessInfo.address}, Tầng ${accessInfo.floor || '1'}, Phòng ${accessInfo.roomNumber}` : "",
 googleMapsUrl: accessInfo?.googleMapsUrl || "",
 });

 if (emailResult.success) {
 await prisma.booking.update({
 where: { id: booking.id },
 data: { status: "EMAIL_SENT" }
 });
 
 await prisma.emailLog.create({
 data: {
 bookingId: booking.id,
 recipient: booking.customerEmail,
 subject: "Thông tin Check-in",
 status: "SENT",
 }
 });
 } else {
 await prisma.emailLog.create({
 data: {
 bookingId: booking.id,
 recipient: booking.customerEmail,
 subject: "Thông tin Check-in",
 status: "FAILED",
 error: JSON.stringify(emailResult.error)
 }
 });
 }
 }

 return NextResponse.json({ success: true });

 } catch (error: any) {
 console.error("WEBHOOK_ERROR", error);
 return NextResponse.json(
 { error: "Webhook processing failed", details: error.message },
 { status: 500 }
 );
 }
}
