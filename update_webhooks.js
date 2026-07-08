const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/webhooks/payos/route.ts');
let content = fs.readFileSync(filePath, 'utf-8');

const txStartIndex = content.indexOf(`    const tx = await prisma.paymentTransaction.findFirst({`);
const txEndMatch = `    return NextResponse.json({ success: true });`;
const txEndIndex = content.indexOf(txEndMatch);

const replacement = `    // 1. Kiểm tra xem orderCode có nằm trong RAM Cache không
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
            totalAmount: tempBooking.totalAmount,
            status: "PAID",
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
            }
          },
          include: { details: true }
        });
      });

      finalBookingId = newBooking.id;
      finalBooking = newBooking;

      // Xóa khỏi RAM
      (global as any).tempBookings.delete(orderCode);

      // Phát sự kiện
      if ((global as any).eventEmitter) {
        (global as any).eventEmitter.emit('NEW_BOOKING', {
          id: newBooking.id,
          customerName: newBooking.customerName,
          customerPhone: newBooking.customerPhone,
          status: "PAID",
          totalAmount: newBooking.totalAmount,
          createdAt: newBooking.createdAt,
        });
      }
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

        if ((global as any).eventEmitter) {
          (global as any).eventEmitter.emit('NEW_BOOKING', {
            id: tx.payment.bookingId,
            customerName: tx.payment.booking.customerName,
            customerPhone: tx.payment.booking.customerPhone,
            status: "PAID",
            totalAmount: tx.payment.booking.totalAmount,
            createdAt: tx.payment.booking.createdAt,
          });
        }
      }
    }

    // 3. Gửi email xác nhận
    if (finalBookingId && finalBooking) {
      try {
        const { sendConfirmationEmail } = await import('@/lib/email');
        const room = await prisma.room.findUnique({ where: { id: finalBooking.details[0].roomId } });
        
        if (finalBooking.customerEmail && room) {
          await sendConfirmationEmail({
            to: finalBooking.customerEmail,
            customerName: finalBooking.customerName,
            bookingId: finalBooking.id,
            roomName: room.name,
            doorPassword: room.doorPassword || "123456",
            startTime: finalBooking.details[0].startTime.toLocaleString('vi-VN'),
            endTime: finalBooking.details[0].endTime.toLocaleString('vi-VN')
          });
          
          await prisma.booking.update({
            where: { id: finalBooking.id },
            data: { status: "EMAIL_SENT" }
          });
        }
      } catch (e) {
        console.error("Webhook email error:", e);
      }
    }

`;

content = content.slice(0, txStartIndex) + replacement + content.slice(txEndIndex);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Updated webhook API!");
