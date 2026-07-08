import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import eventEmitter from "@/lib/event-emitter";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { cleanupExpiredBookings } from '@/lib/cleanup-bookings';
import { sendCheckInEmail } from "@/lib/email";
import { sendTelegramNotification } from "@/lib/telegram";


if (!(global as any).tempBookings) {
  (global as any).tempBookings = new Map();
}
export async function GET(request: Request) {
 try {
 const session = await getServerSession(authOptions);
 if (!session?.user) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const { searchParams } = new URL(request.url);
 const search = searchParams.get("search") || "";
 const status = searchParams.get("status") || "";

 const where: any = {
    NOT: {
      AND: [
        { status: "PENDING_PAYMENT" },
        { payment: { method: "QR_BANKING" } }
      ]
    }
  };
 
 if (search) {
 where.OR = [
 { id: { contains: search, mode: "insensitive" } },
 { customerName: { contains: search, mode: "insensitive" } },
 { customerPhone: { contains: search, mode: "insensitive" } },
 ];
 }
 
 if (status) {
 where.status = status;
 }

 await cleanupExpiredBookings();

 const bookings = await prisma.booking.findMany({
 where,
 orderBy: { createdAt: "desc" },
  include: {
  details: {
  include: {
  room: true
  }
  },
  payment: true,
  products: {
  include: {
  product: true
  }
  }
  }
 });

 const phoneNumbers = Array.from(new Set(bookings.map(b => b.customerPhone)));
 const phoneCounts = await prisma.booking.groupBy({
  by: ['customerPhone'],
  where: { customerPhone: { in: phoneNumbers }, status: { not: "CANCELLED" } },
  _count: { id: true }
 });
 const countMap = new Map(phoneCounts.map(pc => [pc.customerPhone, pc._count.id]));

 const enhancedBookings = bookings.map(b => ({
  ...b,
  visitCount: countMap.get(b.customerPhone) || 1
 }));

 return NextResponse.json(enhancedBookings);
 } catch (error) {
 console.error("GET_BOOKINGS_ERROR", error);
 return NextResponse.json(
 { error: "Lỗi lấy danh sách đặt phòng" },
 { status: 500 }
 );
 }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName, customerPhone, customerEmail, numGuests, notes, totalAmount, paymentMethod, roomId, startTime, endTime, price, products, couponId, frontIdCardUrl, backIdCardUrl
    } = body;

    if (!customerName || !customerPhone || !roomId || !startTime || !endTime) {
      return NextResponse.json({ error: "Thiếu thông vị bắt buộc" }, { status: 400 });
    }
    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return NextResponse.json({ error: "Định dạng email không hợp lệ" }, { status: 400 });
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
          const requestBaseUrl = request.headers.get("origin") || `${protocol}://${host}`;
          
          const payload = {
            orderCode: orderCode,
            amount: totalAmount,
            description: `DP ${customerPhone.replace(/\D/g, '')} ${orderCode.toString().slice(-4)}`.substring(0, 25),
            cancelUrl: `${requestBaseUrl}/booking?cancel=true`,
            returnUrl: `${requestBaseUrl}/booking?step=success&bookingId=${orderCode}`,
          };
          
          const paymentLink = await payos.paymentRequests.create(payload);
          payosUrl = paymentLink.checkoutUrl;
          qrUrl = `https://img.vietqr.io/image/${paymentLink.bin}-${paymentLink.accountNumber}-compact.png?amount=${paymentLink.amount}&addInfo=${encodeURIComponent(paymentLink.description)}&accountName=${encodeURIComponent(paymentLink.accountName)}`;
        } catch (e) {
          console.error("PayOS Error:", e);
          const bankId = settingsDb.find(s => s.key === 'bank_bin')?.value || "970436";
          const accountNo = settingsDb.find(s => s.key === 'bank_account_no')?.value || "0123456789";
          const prefix = settingsDb.find(s => s.key === 'bank_prefix')?.value || "DP";
          const addInfo = `${prefix} ${customerPhone.replace(/\D/g, '')} ${orderCode.toString().slice(-4)}`.substring(0, 50);
          qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${totalAmount}&addInfo=${encodeURIComponent(addInfo)}&accountName=HOMESTAY`;
        }
      } else {
        const bankId = settingsDb.find(s => s.key === 'bank_bin')?.value || "970436";
        const accountNo = settingsDb.find(s => s.key === 'bank_account_no')?.value || "0123456789";
        const prefix = settingsDb.find(s => s.key === 'bank_prefix')?.value || "DP";
        const addInfo = `${prefix} ${customerPhone.replace(/\D/g, '')} ${orderCode.toString().slice(-4)}`.substring(0, 50);
        qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${totalAmount}&addInfo=${encodeURIComponent(addInfo)}&accountName=HOMESTAY`;
      }

      (global as any).tempBookings.set(orderCode.toString(), {
        customerName, customerPhone, customerEmail, numGuests: numGuests || 1, notes, frontIdCardUrl, backIdCardUrl,
        totalAmount, roomId, startTime: new Date(startTime).getTime(), endTime: new Date(endTime).getTime(),
        price: price || totalAmount, createdAt: Date.now(), products, couponId
      });

      eventEmitter.emit('TEMP_BOOKING');

      bookingId = orderCode.toString();
    } else {
      // 2. Dùng DB (MANUAL)
      const booking = await prisma.$transaction(async (tx) => {
        return await tx.booking.create({
          data: {
            customerName, customerPhone, customerEmail, numGuests: numGuests || 1, notes, frontIdCardUrl, backIdCardUrl,
            totalAmount, status: "PENDING_PAYMENT", couponId: couponId || undefined,
            details: { create: { roomId, startTime: new Date(startTime), endTime: new Date(endTime), price: price || totalAmount } },
            payment: { create: { amount: totalAmount, method: "MANUAL", status: "PENDING" } },
            products: products && products.length > 0 ? {
              create: products.map((p: any) => ({
                productId: p.productId,
                quantity: p.quantity,
                price: p.price
              }))
            } : undefined,
          },
          include: { payment: true },
        });
      });
      bookingId = booking.id;
      paymentId = booking.payment?.id;

      eventEmitter.emit('NEW_BOOKING', {
        id: booking.id, customerName: booking.customerName, customerPhone: booking.customerPhone,
        status: booking.status, totalAmount: booking.totalAmount, createdAt: booking.createdAt,
      });
      
      // Send admin notification
      Promise.resolve().then(async () => {
        try {
          const room = await prisma.room.findUnique({ 
            where: { id: roomId },
            include: { facility: true }
          });
          
          await sendTelegramNotification({
            bookingId: booking.id,
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            facilityName: room?.facility?.name || "Không rõ",
            roomName: room?.name || "Homestay Room",
            totalAmount: booking.totalAmount,
            paymentMethod: "Tiền mặt",
            bookingTime: `${new Date(startTime).toLocaleString('vi-VN')} - ${new Date(endTime).toLocaleString('vi-VN')}`,
          });
        } catch (e) {
          console.error("Failed to send admin email or telegram", e);
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
