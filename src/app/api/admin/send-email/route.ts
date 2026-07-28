import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCheckInEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const id = body.id;

    if (!id) {
      return NextResponse.json({ error: "Thiếu mã đặt phòng" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
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

    if (!booking.customerEmail) {
      return NextResponse.json({ error: "Khách hàng không cung cấp email" }, { status: 400 });
    }

    if (booking.details.length === 0) {
      return NextResponse.json({ error: "Đơn đặt phòng không hợp lệ (không có phòng)" }, { status: 400 });
    }

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
      
      return NextResponse.json({ success: true, message: "Gửi email thành công" });
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
      return NextResponse.json({ error: "Gửi email thất bại, vui lòng kiểm tra lại cấu hình SMTP" }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
