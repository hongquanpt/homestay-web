const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/bookings/route.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Remove trailing newlines and whitespace
content = content.trimEnd();

const appendContent = `
    // Auto-send Milestone Coupon
    if (customerEmail) {
      // Run asynchronously so it doesn't block the API response
      Promise.resolve().then(async () => {
        try {
          const pastBookingsCount = await prisma.booking.count({
            where: {
              OR: [
                { customerEmail },
                { customerPhone }
              ],
              status: { in: ['PENDING_PAYMENT', 'PAID', 'CHECKED_IN', 'COMPLETED'] }
            }
          });
          
          const milestoneCoupon = await prisma.coupon.findFirst({
            where: {
              autoSendAfterBookings: pastBookingsCount,
              validTo: { gte: new Date() }
            }
          });

          if (milestoneCoupon) {
            const { sendCouponEmail } = await import('@/lib/email');
            const discountDesc = milestoneCoupon.discountPct 
              ? \`\${milestoneCoupon.discountPct}%\` 
              : \`\${milestoneCoupon.discountAmt?.toLocaleString("vi-VN")}đ\`;
            
            await sendCouponEmail({
              to: customerEmail,
              customerName,
              couponCode: milestoneCoupon.code,
              discountDesc,
              validTo: new Date(milestoneCoupon.validTo).toLocaleDateString('vi-VN')
            });
          }
        } catch (err) {
          console.error("Auto coupon send failed:", err);
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingId,
        paymentId,
        qrUrl,
        payosUrl,
      },
    });
  } catch (e: any) {
    if (e.message === "OVERLAP") {
      return NextResponse.json(
        { error: "Phòng đã có người nhanh tay đặt trước. Vui lòng chọn khung giờ khác!" },
        { status: 409 }
      );
    }
    console.error("CREATE_BOOKING_ERROR", e);
    return NextResponse.json(
      { error: "Lỗi tạo đơn đặt phòng", details: e.message },
      { status: 500 }
    );
  }
}
`;

fs.writeFileSync(filePath, content + '\n' + appendContent, 'utf-8');
console.log("Fixed bookings API!");
