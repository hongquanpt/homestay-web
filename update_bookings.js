const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/bookings/route.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Insert memory cache at top level
const importEndIndex = content.indexOf('export async function GET');
const cacheInit = `
if (!(global as any).tempBookings) {
  (global as any).tempBookings = new Map();
}
`;
content = content.slice(0, importEndIndex) + cacheInit + content.slice(importEndIndex);

// Find the start of try { await cleanupExpiredBookings(); ...
const tryStartMatch = `  try {\n    await cleanupExpiredBookings();`;
const tryStartIndex = content.indexOf(tryStartMatch);

// Find the end of the POST handler (the last catch block)
const autoSendCouponStart = `  // Auto-send Milestone Coupon`;
const autoSendCouponIndex = content.indexOf(autoSendCouponStart);

// The part to replace is from tryStartIndex to autoSendCouponIndex
const replacement = `  try {
    await cleanupExpiredBookings();

    // Lazy clean tempBookings (RAM cache)
    const now = Date.now();
    for (const [key, tb] of (global as any).tempBookings.entries()) {
      if (now - tb.createdAt > 10 * 60 * 1000) {
        (global as any).tempBookings.delete(key);
      }
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
          const PayOSClass = require('@payos/node').PayOS || require('@payos/node').default;
          const payos = new PayOSClass({
            clientId: payosClientId,
            apiKey: payosApiKey,
            checksumKey: payosChecksumKey
          });
          
          const protocol = request.headers.get("x-forwarded-proto") || "http";
          const host = request.headers.get("host");
          const requestBaseUrl = request.headers.get("origin") || \`\${protocol}://\${host}\`;
          
          const body = {
            orderCode: orderCode,
            amount: totalAmount,
            description: \`Thanh toan \${orderCode}\`,
            cancelUrl: \`\${requestBaseUrl}/booking?cancel=true\`,
            returnUrl: \`\${requestBaseUrl}/booking?step=success&bookingId=\${orderCode}\`, // return orderCode as bookingId
          };
          
          const paymentLink = await payos.paymentRequests.create(body);
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

      // Lưu vào RAM
      (global as any).tempBookings.set(orderCode.toString(), {
        customerName, customerPhone, customerEmail, numGuests: numGuests || 1, notes,
        totalAmount, roomId, startTime: new Date(startTime).getTime(), endTime: new Date(endTime).getTime(),
        price: price || totalAmount, createdAt: Date.now()
      });

      bookingId = orderCode.toString(); // Map bookingId to orderCode for frontend
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

`;

content = content.slice(0, tryStartIndex) + replacement + content.slice(autoSendCouponIndex);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Updated bookings API!");
