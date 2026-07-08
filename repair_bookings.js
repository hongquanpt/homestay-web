const fs = require('fs');

const content = fs.readFileSync('src/app/api/bookings/route.ts', 'utf8');

const postIndex = content.indexOf('export async function POST');
const getCode = content.slice(0, postIndex);

const postCode = `export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName, customerPhone, customerEmail, numGuests, notes, totalAmount, paymentMethod, roomId, startTime, endTime, price,
    } = body;

    if (!customerName || !customerPhone || !roomId || !startTime || !endTime) {
      return NextResponse.json({ error: "Thiếu thông vị bắt buộc" }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
    
    const [blockedPhone, blockedEmail, blockedIp] = await Promise.all([
      prisma.blacklistPhone.findUnique({ where: { phone: customerPhone } }),
      customerEmail ? prisma.blacklistEmail.findUnique({ where: { email: customerEmail } }) : Promise.resolve(null),
      ip ? prisma.blacklistIp.findUnique({ where: { ip } }) : Promise.resolve(null)
    ]);

    if (blockedPhone || blockedEmail || blockedIp) {
      return NextResponse.json({ error: "Rất tiếc, thông tin của bạn không thể thực hiện đặt phòng lúc này (Blacklisted)." }, { status: 403 });
    }

    if (paymentMethod === "MANUAL" || paymentMethod === "manual") {
      const timeSettings = await prisma.systemSetting.findMany({
        where: { key: { in: ['cash_payment_start_time', 'cash_payment_end_time'] } }
      });
      const startSetting = timeSettings.find(s => s.key === 'cash_payment_start_time')?.value;
      const endSetting = timeSettings.find(s => s.key === 'cash_payment_end_time')?.value;

      if (startSetting && endSetting) {
        const now = new Date();
        const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
        const currentMinutes = vnTime.getHours() * 60 + vnTime.getMinutes();
        
        const [startH, startM] = startSetting.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        
        const [endH, endM] = endSetting.split(':').map(Number);
        const endMinutes = endH * 60 + endM;

        let allowed = true;
        if (startMinutes <= endMinutes) {
          allowed = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
        } else {
          allowed = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
        }

        if (!allowed) {
          return NextResponse.json({ error: "Ngoài khung giờ hỗ trợ thanh toán tiền mặt" }, { status: 400 });
        }
      }
    }

    await cleanupExpiredBookings();

    // Lazy clean tempBookings (RAM cache)
    const now = Date.now();
    if ((global as any).tempBookings) {
      for (const [key, tb] of (global as any).tempBookings.entries()) {
        if (now - tb.createdAt > 10 * 60 * 1000) {
          (global as any).tempBookings.delete(key);
        }
      }
    } else {
      (global as any).tempBookings = new Map();
    }

    // 0. Overlap Check DB
    const overlappingDB = await prisma.bookingDetail.findFirst({
      where: {
        roomId,
        startTime: { lt: new Date(endTime) },
        endTime: { gt: new Date(startTime) },
        booking: { status: { notIn: ['CANCELLED'] } }
      }
    });

    if (overlappingDB) { throw new Error("OVERLAP"); }

    // 0.1 Overlap Check RAM
    for (const tb of (global as any).tempBookings.values()) {
      if (
        tb.roomId === roomId &&
        tb.startTime < new Date(endTime).getTime() &&
        tb.endTime > new Date(startTime).getTime()
      ) {
        throw new Error("OVERLAP");
      }
    }

    let bookingId = null;
    let paymentId = null;
    let qrUrl = null;
    let payosUrl = null;
    let orderCode = null;

    if (paymentMethod === "QR_BANKING" || !paymentMethod) {
      // 1. Dùng RAM (Không lưu DB)
      const settingsDb = await prisma.systemSetting.findMany({
        where: { key: { in: ['payos_client_id', 'payos_api_key', 'payos_checksum_key', 'bank_bin', 'bank_account_no', 'bank_prefix'] } }
      });
      const payosClientId = settingsDb.find(s => s.key === 'payos_client_id')?.value;
      const payosApiKey = settingsDb.find(s => s.key === 'payos_api_key')?.value;
      const payosChecksumKey = settingsDb.find(s => s.key === 'payos_checksum_key')?.value;

      orderCode = parseInt(Date.now().toString().slice(-9) + Math.floor(Math.random() * 100).toString());

      if (payosClientId && payosApiKey && payosChecksumKey) {
        try {
          const PayOSClass = require('@payos/node').PayOS || require('@payos/node').default || require('@payos/node');
          const payos = new PayOSClass({
            clientId: payosClientId,
            apiKey: payosApiKey,
            checksumKey: payosChecksumKey
          });
          
          const protocol = request.headers.get("x-forwarded-proto") || "http";
          const host = request.headers.get("host");
          const requestBaseUrl = request.headers.get("origin") || \`\${protocol}://\${host}\`;
          
          const payload = {
            orderCode: orderCode,
            amount: totalAmount,
            description: \`Thanh toan \${orderCode}\`,
            cancelUrl: \`\${requestBaseUrl}/booking?cancel=true\`,
            returnUrl: \`\${requestBaseUrl}/booking?step=success&bookingId=\${orderCode}\`,
          };
          
          const paymentLink = await payos.paymentRequests.create(payload);
          payosUrl = paymentLink.checkoutUrl;
          qrUrl = \`https://img.vietqr.io/image/\${paymentLink.bin}-\${paymentLink.accountNumber}-compact.png?amount=\${paymentLink.amount}&addInfo=\${encodeURIComponent(paymentLink.description)}&accountName=\${encodeURIComponent(paymentLink.accountName)}\`;
        } catch (e) {
          console.error("PayOS Error:", e);
          const bankId = settingsDb.find(s => s.key === 'bank_bin')?.value || "970436";
          const accountNo = settingsDb.find(s => s.key === 'bank_account_no')?.value || "0123456789";
          const prefix = settingsDb.find(s => s.key === 'bank_prefix')?.value || "Thanh toan";
          qrUrl = \`https://img.vietqr.io/image/\${bankId}-\${accountNo}-compact.png?amount=\${totalAmount}&addInfo=\${encodeURIComponent(\`\${prefix} \${orderCode}\`)}&accountName=HOMESTAY\`;
        }
      } else {
        const bankId = settingsDb.find(s => s.key === 'bank_bin')?.value || "970436";
        const accountNo = settingsDb.find(s => s.key === 'bank_account_no')?.value || "0123456789";
        const prefix = settingsDb.find(s => s.key === 'bank_prefix')?.value || "Thanh toan";
        qrUrl = \`https://img.vietqr.io/image/\${bankId}-\${accountNo}-compact.png?amount=\${totalAmount}&addInfo=\${encodeURIComponent(\`\${prefix} \${orderCode}\`)}&accountName=HOMESTAY\`;
      }

      (global as any).tempBookings.set(orderCode.toString(), {
        customerName, customerPhone, customerEmail, numGuests: numGuests || 1, notes,
        totalAmount, roomId, startTime: new Date(startTime).getTime(), endTime: new Date(endTime).getTime(),
        price: price || totalAmount, createdAt: Date.now()
      });

      bookingId = orderCode.toString();
    } else {
      // 2. Dùng DB (MANUAL)
      const booking = await prisma.$transaction(async (tx) => {
        return await tx.booking.create({
          data: {
            customerName, customerPhone, customerEmail, numGuests: numGuests || 1, notes,
            totalAmount, status: "PENDING_PAYMENT",
            details: { create: { roomId, startTime: new Date(startTime), endTime: new Date(endTime), price: price || totalAmount } },
            payment: { create: { amount: totalAmount, method: "MANUAL", status: "PENDING" } },
          },
          include: { payment: true },
        });
      });
      bookingId = booking.id;
      paymentId = booking.payment?.id;

      (global as any).eventEmitter?.emit('NEW_BOOKING', {
        id: booking.id, customerName: booking.customerName, customerPhone: booking.customerPhone,
        status: booking.status, totalAmount: booking.totalAmount, createdAt: booking.createdAt,
      });
    }

    if (customerEmail && paymentMethod === "MANUAL") {
      Promise.resolve().then(async () => {
        try {
          const pastBookingsCount = await prisma.booking.count({
            where: {
              OR: [{ customerEmail }, { customerPhone }],
              status: { in: ['PENDING_PAYMENT', 'PAID', 'CHECKED_IN', 'COMPLETED'] }
            }
          });
          
          const milestoneCoupon = await prisma.coupon.findFirst({
            where: { autoSendAfterBookings: pastBookingsCount, validTo: { gte: new Date() } }
          });

          if (milestoneCoupon) {
            const { sendCouponEmail } = await import('@/lib/email');
            const discountDesc = milestoneCoupon.discountPct ? \`\${milestoneCoupon.discountPct}%\` : \`\${milestoneCoupon.discountAmt?.toLocaleString("vi-VN")}đ\`;
            await sendCouponEmail({
              to: customerEmail, customerName, couponCode: milestoneCoupon.code, discountDesc, validTo: new Date(milestoneCoupon.validTo).toLocaleDateString('vi-VN')
            });
          }
        } catch (err) {
          console.error("Auto coupon send failed:", err);
        }
      });
    }

    return NextResponse.json({ success: true, data: { bookingId, paymentId, qrUrl, payosUrl } });
  } catch (e: any) {
    if (e.message === "OVERLAP") {
      return NextResponse.json({ error: "Phòng đã có người nhanh tay đặt trước. Vui lòng chọn khung giờ khác!" }, { status: 409 });
    }
    console.error("CREATE_BOOKING_ERROR", e);
    return NextResponse.json({ error: "Lỗi tạo đơn đặt phòng", details: e.message }, { status: 500 });
  }
}
`;

fs.writeFileSync('src/app/api/bookings/route.ts', getCode + postCode, 'utf8');
console.log("Rewrote src/app/api/bookings/route.ts successfully.");
