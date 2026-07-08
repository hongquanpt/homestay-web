import { prisma } from "@/lib/prisma";
import { sendCouponEmail } from "@/lib/email";

export async function checkAndSendMilestoneCoupon(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking || !booking.customerEmail) return;

    // We only count CONFIRMED, PAID, CHECKED_IN, COMPLETED to determine milestone
    const pastBookingsCount = await prisma.booking.count({
      where: {
        OR: [{ customerEmail: booking.customerEmail }, { customerPhone: booking.customerPhone }],
        status: { in: ['PAID', 'EMAIL_SENT', 'CHECKED_IN', 'COMPLETED'] }
      }
    });

    // We look for a coupon that requires exactly `pastBookingsCount` bookings
    const milestoneCoupon = await prisma.coupon.findFirst({
      where: { autoSendAfterBookings: pastBookingsCount, validTo: { gte: new Date() } }
    });

    if (milestoneCoupon) {
      const discountDesc = milestoneCoupon.discountPct 
        ? `${milestoneCoupon.discountPct}%` 
        : `${milestoneCoupon.discountAmt?.toLocaleString("vi-VN")}đ`;
        
      await sendCouponEmail({
        to: booking.customerEmail, 
        customerName: booking.customerName, 
        couponCode: milestoneCoupon.code, 
        discountDesc, 
        validTo: new Date(milestoneCoupon.validTo).toLocaleDateString('vi-VN')
      });
    }
  } catch (err) {
    console.error("Auto coupon send failed:", err);
  }
}
