import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import eventEmitter from '@/lib/event-emitter';
import { checkAndSendMilestoneCoupon } from "@/lib/coupon";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      select: { id: true, status: true }
    });
    
    if (!booking) {
      if ((global as any).tempBookings?.has(params.id)) {
         return NextResponse.json({ id: params.id, status: "PENDING_PAYMENT" });
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ id: booking.id, status: booking.status });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi Server" }, { status: 500 });
  }
}

export async function PUT(
 request: Request,
 props: { params: Promise<{ id: string }> }
) {
 try {
 const params = await props.params;
 const session = await getServerSession(authOptions);
 if (!session?.user) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const body = await request.json();
 const { status, customerEmail, customerPhone } = body;

 if (!status && customerEmail === undefined && customerPhone === undefined) {
 return NextResponse.json(
 { error: "No data to update" },
 { status: 400 }
 );
 }

 const dataToUpdate: any = {};
 if (status) dataToUpdate.status = status;
 if (customerEmail !== undefined) dataToUpdate.customerEmail = customerEmail;
 if (customerPhone !== undefined) dataToUpdate.customerPhone = customerPhone;

 const updatedBooking = await prisma.booking.update({
 where: { id: params.id },
 data: dataToUpdate,
 });

 // Cập nhật Payment nếu Admin xác nhận thanh toán (trạng thái PAID)
 if (status === 'PAID') {
   const payment = await prisma.payment.findUnique({
     where: { bookingId: params.id }
   });

   if (payment && payment.method === 'MANUAL' && payment.status === 'PENDING') {
     await prisma.payment.update({
       where: { id: payment.id },
       data: {
         status: 'SUCCESS',
         confirmedById: (session.user as any).id || null,
         confirmedAt: new Date(),
       }
     });
   }
 }

 eventEmitter.emit('BOOKING_UPDATED', {
   id: updatedBooking.id,
   ...dataToUpdate
 });

 if (status === 'PAID' || status === 'CONFIRMED') {
   Promise.resolve().then(() => checkAndSendMilestoneCoupon(params.id));
 }

 return NextResponse.json({
 success: true,
 data: updatedBooking,
 });
 } catch (error: any) {
 console.error("UPDATE_BOOKING_STATUS_ERROR", error);
 return NextResponse.json(
 { error: "Lỗi cập nhật trạng thái đơn đặt phòng", details: error.message },
 { status: 500 }
 );
 }
}
