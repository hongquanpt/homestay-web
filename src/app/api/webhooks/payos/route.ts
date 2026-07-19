import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import eventEmitter from '@/lib/event-emitter';
import { checkAndSendMilestoneCoupon } from '@/lib/coupon';
import { sendTelegramNotification } from '@/lib/telegram';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const settingsDb = await prisma.systemSetting.findMany({
      where: { key: { in: ['payos_client_id', 'payos_api_key', 'payos_checksum_key'] } }
    });
    const payosClientId = settingsDb.find(s => s.key === 'payos_client_id')?.value;
    const payosApiKey = settingsDb.find(s => s.key === 'payos_api_key')?.value;
    const payosChecksumKey = settingsDb.find(s => s.key === 'payos_checksum_key')?.value;

    if (!payosClientId || !payosApiKey || !payosChecksumKey) {
      return NextResponse.json({ error: "PayOS not configured" }, { status: 400 });
    }

    const PayOSClass = require('@payos/node').PayOS || require('@payos/node').default;
    const payos = new PayOSClass({
      clientId: payosClientId,
      apiKey: payosApiKey,
      checksumKey: payosChecksumKey
    });

    // Xác thực webhook từ PayOS
    const webhookData = await payos.webhooks.verify(body);
    
    // Nếu webhookData hợp lệ (không văng lỗi), xử lý cập nhật trạng thái
    const orderCode = webhookData.orderCode.toString();
    
    // 1. Kiểm tra xem orderCode có nằm trong RAM Cache không
    const tempBooking = (global as any).tempBookings?.get(orderCode);
    let finalBookingId = null;
    let finalBooking = null;

    if (tempBooking) {
      // Bắt đầu ghi vào Database
      const newBooking = await prisma.$transaction(async (tx) => {
        return await tx.booking.create({
          data: {
            customerName: tempBooking.customerName,
            customerPhone: tempBooking.customerPhone,
            customerEmail: tempBooking.customerEmail,
            numGuests: tempBooking.numGuests,
            notes: tempBooking.notes,
            frontIdCardUrl: tempBooking.frontIdCardUrl,
            backIdCardUrl: tempBooking.backIdCardUrl,
            idCardsJson: tempBooking.idCardsJson,
            totalAmount: tempBooking.totalAmount,
            status: "PAID",
            couponId: tempBooking.couponId || undefined,
            details: {
              create: {
                roomId: tempBooking.roomId,
                startTime: new Date(tempBooking.startTime),
                endTime: new Date(tempBooking.endTime),
                price: tempBooking.price,
              }
            },
            payment: {
              create: {
                amount: tempBooking.totalAmount,
                method: "QR_BANKING",
                status: "SUCCESS",
                transactions: {
                  create: {
                    transactionId: orderCode,
                    amount: tempBooking.totalAmount,
                    status: "SUCCESS",
                    webhookData: body,
                  }
                }
              }
            },
            products: tempBooking.products && tempBooking.products.length > 0 ? {
              create: tempBooking.products.map((p: any) => ({
                productId: p.productId,
                quantity: p.quantity,
                price: p.price
              }))
            } : undefined
          },
          include: { details: true }
        });
      });

      finalBookingId = newBooking.id;
      finalBooking = newBooking;

      // Xóa khỏi RAM
      (global as any).tempBookings.delete(orderCode);

      // Phát sự kiện
      eventEmitter.emit('NEW_BOOKING', {
        id: newBooking.id,
        customerName: newBooking.customerName,
        customerPhone: newBooking.customerPhone,
        status: "PAID",
        totalAmount: newBooking.totalAmount,
        createdAt: newBooking.createdAt,
      });
    } else {
      // 2. Nếu không có trong RAM, fallback tìm trong DB (dành cho các đơn tạo kiểu cũ)
      const tx = await prisma.paymentTransaction.findFirst({
        where: { transactionId: orderCode },
        include: { payment: { include: { booking: { include: { details: true } } } } }
      });

      if (tx && tx.status !== "SUCCESS") {
        await prisma.$transaction([
          prisma.paymentTransaction.update({
            where: { id: tx.id },
            data: { status: "SUCCESS", webhookData: body }
          }),
          prisma.payment.update({
            where: { id: tx.paymentId },
            data: { status: "SUCCESS" }
          }),
          prisma.booking.update({
            where: { id: tx.payment.bookingId },
            data: { status: "PAID" }
          })
        ]);

        finalBookingId = tx.payment.bookingId;
        finalBooking = tx.payment.booking;

        eventEmitter.emit('NEW_BOOKING', {
          id: tx.payment.bookingId,
          customerName: tx.payment.booking.customerName,
          customerPhone: tx.payment.booking.customerPhone,
          status: "PAID",
          totalAmount: tx.payment.booking.totalAmount,
          createdAt: tx.payment.booking.createdAt,
        });
      }
    }

    // 3. Gửi email xác nhận
    if (finalBookingId && finalBooking) {
      // Emit cho Admin Board (dùng UUID)
      eventEmitter.emit('BOOKING_UPDATED', {
        id: finalBookingId,
        status: "PAID"
      });
      // Emit cho Frontend (dùng orderCode)
      eventEmitter.emit('BOOKING_UPDATED', {
        id: orderCode,
        status: "PAID"
      });

      Promise.resolve().then(() => checkAndSendMilestoneCoupon(finalBookingId));

      try {
        const { sendCheckInEmail } = await import('@/lib/email');
        const room = await prisma.room.findUnique({ 
          where: { id: finalBooking.details[0].roomId },
          include: { accessInfo: true, facility: true }
        });
        
        if (finalBooking.customerEmail && room) {
          const accessInfo = room.accessInfo;
          await sendCheckInEmail({
            to: finalBooking.customerEmail,
            customerName: finalBooking.customerName,
            bookingId: finalBooking.id,
            roomName: room.name,
            checkInTime: finalBooking.details[0].startTime.toLocaleString('vi-VN'),
            checkOutTime: finalBooking.details[0].endTime.toLocaleString('vi-VN'),
            doorPassword: accessInfo?.doorPassword || "",
            roomPassword: accessInfo?.roomPassword || "",
            wifiName: accessInfo?.wifiName || "",
            wifiPassword: accessInfo?.wifiPassword || "",
            address: accessInfo ? `${accessInfo.houseNumber} ${accessInfo.address}, Tầng ${accessInfo.floor || '1'}, Phòng ${accessInfo.roomNumber}` : "",
            googleMapsUrl: accessInfo?.googleMapsUrl || "",
          });
          
          await prisma.booking.update({
            where: { id: finalBooking.id },
            data: { status: "EMAIL_SENT" }
          });
        }

        // Gửi thông báo cho Admin qua Email & Telegram
        Promise.resolve().then(async () => {
          try {
            await sendTelegramNotification({
              bookingId: finalBooking.id,
              customerName: finalBooking.customerName,
              customerPhone: finalBooking.customerPhone,
              facilityName: room?.facility?.name || "Không rõ",
              roomName: room?.name || "Homestay Room",
              totalAmount: finalBooking.totalAmount,
              paymentMethod: "Chuyển khoản QR",
              bookingTime: finalBooking.details && finalBooking.details.length > 0 
                ? `${new Date(finalBooking.details[0].startTime).toLocaleString('vi-VN')} - ${new Date(finalBooking.details[0].endTime).toLocaleString('vi-VN')}` 
                : "Không rõ",
            });
          } catch (e) {
            console.error("Failed to send admin notification on webhook", e);
          }
        });
      } catch (e) {
        console.error("Webhook email error:", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("PayOS Webhook Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
