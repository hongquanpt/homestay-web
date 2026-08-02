import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

// Helper function to create the transporter
const getTransporter = async () => {
 const settings = await prisma.systemSetting.findMany({
 where: {
 key: {
 in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from', 'hotline', 'contact_email']
 }
 }
 });

 const config = settings.reduce((acc: any, curr: any) => {
 acc[curr.key] = curr.value;
 return acc;
 }, {} as Record<string, string>);

 const host = config.smtp_host || process.env.SMTP_HOST;
 const port = Number(config.smtp_port || process.env.SMTP_PORT) || 587;
 const secure = port === 465;
 const user = config.smtp_user || process.env.SMTP_USER;
 const pass = config.smtp_pass || process.env.SMTP_PASS;

 return {
 transporter: nodemailer.createTransport({
 host,
 port,
 secure,
 auth: {
 user,
 pass,
 },
 }),
 fromEmail: config.smtp_from || process.env.SMTP_FROM || user,
 hotline: config.hotline || '0901 234 567',
 contactEmail: config.contact_email || 'support@homestay.com'
 };
};

interface SendCheckInEmailParams {
 to: string;
 bookingId: string;
 customerName: string;
 roomName: string;
 checkInTime: string;
 checkOutTime: string;
 doorPassword?: string;
 roomPassword?: string;
 wifiName?: string;
 wifiPassword?: string;
 address?: string;
 googleMapsUrl?: string;
}

export const sendCheckInEmail = async (params: SendCheckInEmailParams) => {
 const {
 to,
 bookingId,
 customerName,
 roomName,
 checkInTime,
 checkOutTime,
 doorPassword,
 roomPassword,
 wifiName,
 wifiPassword,
 address,
 googleMapsUrl,
 } = params;

 try {
 const { transporter, fromEmail, hotline, contactEmail } = await getTransporter();

 const shortBookingId = bookingId.substring(0, 8).toUpperCase();

 let addressHtml = '';
 if (address) {
 addressHtml = `
 <div style="background-color: rgba(255,255,255,0.7); padding: 16px; border-radius: 8px; margin-bottom: 12px;">
 <p style="margin: 0 0 4px 0; font-size: 13px; color: #b45309; font-weight: 600; text-transform: uppercase;">📍 Địa chỉ chính xác</p>
 <p style="margin: 0; font-size: 16px; color: #78350f; font-weight: bold;">${address}</p>
 ${googleMapsUrl ? `<a href="${googleMapsUrl}" style="display: inline-block; margin-top: 8px; font-size: 14px; color: #ea580c; text-decoration: none; font-weight: 600;">Xem trên Google Maps &rarr;</a>` : ''}
 </div>`;
 }

 let doorPasswordHtml = '';
 if (doorPassword) {
 doorPasswordHtml = `
 <div style="background-color: rgba(255,255,255,0.7); padding: 16px; border-radius: 8px; margin-bottom: 12px;">
 <p style="margin: 0 0 4px 0; font-size: 13px; color: #b45309; font-weight: 600; text-transform: uppercase;">🚪 Mật khẩu cổng / tòa nhà</p>
 <p style="margin: 0; font-size: 20px; color: #d97706; font-weight: 800; letter-spacing: 1px;">${doorPassword}</p>
 </div>`;
 }

 let roomPasswordHtml = '';
 if (roomPassword) {
 roomPasswordHtml = `
 <div style="background-color: rgba(255,255,255,0.7); padding: 16px; border-radius: 8px; margin-bottom: 12px;">
 <p style="margin: 0 0 4px 0; font-size: 13px; color: #b45309; font-weight: 600; text-transform: uppercase;">🔑 Mật khẩu mở cửa phòng</p>
 <p style="margin: 0; font-size: 24px; color: #d97706; font-weight: 800; letter-spacing: 2px;">${roomPassword}</p>
 </div>`;
 }

 let wifiHtml = '';
 if (wifiName || wifiPassword) {
 wifiHtml = `
 <div style="background-color: rgba(255,255,255,0.7); padding: 16px; border-radius: 8px;">
 <p style="margin: 0 0 4px 0; font-size: 13px; color: #b45309; font-weight: 600; text-transform: uppercase;">📶 Thông tin Wi-Fi</p>
 <p style="margin: 0 0 4px 0; font-size: 15px; color: #78350f;">Tên mạng: <strong style="font-size: 16px;">${wifiName || 'Không có'}</strong></p>
 <p style="margin: 0; font-size: 15px; color: #78350f;">Mật khẩu: <strong style="font-size: 16px;">${wifiPassword || 'Không có'}</strong></p>
 </div>`;
 }

 // HTML Template for the email
 const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>Xác nhận đặt phòng</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
 <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 20px;">
 <tr>
 <td align="center">
 <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
 <!-- Header Image -->
 <tr>
 <td style="background-color: #ea580c; text-align: center; padding: 40px 20px; background-image: url('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1000'); background-size: cover; background-position: center; position: relative;">
 <div style="background-color: rgba(0, 0, 0, 0.5); position: absolute; top: 0; left: 0; right: 0; bottom: 0;"></div>
 <h1 style="color: #ffffff; margin: 0; font-size: 28px; position: relative; z-index: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">XÁC NHẬN ĐẶT PHÒNG</h1>
 <p style="color: #ffedd5; margin: 10px 0 0 0; font-size: 16px; position: relative; z-index: 1;">& Thông Tin Check-in Bí Mật</p>
 </td>
 </tr>
 
 <!-- Content -->
 <tr>
 <td style="padding: 40px 30px;">
 <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151; line-height: 1.6;">Xin chào <strong>${customerName}</strong>,</p>
 <p style="margin: 0 0 30px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">Cảm ơn bạn đã lựa chọn Homestay của chúng tôi. Dưới đây là thông tin nhận phòng bí mật (Self Check-in) được tạo tự động và bảo mật dành riêng cho bạn.</p>

 <!-- Booking Details Card -->
 <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; margin-bottom: 30px;">
 <tr>
 <td style="padding: 24px;">
 <h3 style="margin: 0 0 16px 0; color: #1c1917; font-size: 18px; border-bottom: 2px solid #f97316; padding-bottom: 8px; display: inline-block;">Thông tin đơn đặt phòng</h3>
 <p style="margin: 0 0 12px 0; color: #57534e; font-size: 15px;">Mã đơn: <strong style="color: #1c1917;">#${shortBookingId}</strong></p>
 <p style="margin: 0 0 12px 0; color: #57534e; font-size: 15px;">Phòng: <strong style="color: #ea580c; font-size: 16px;">${roomName}</strong></p>
 
 <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 16px;">
 <tr>
 <td width="48%" style="background-color: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e7e5e4;">
 <p style="margin: 0 0 4px 0; font-size: 12px; color: #78716c; text-transform: uppercase; letter-spacing: 0.5px;">Check-in</p>
 <p style="margin: 0; font-size: 15px; color: #1c1917; font-weight: bold;">${checkInTime}</p>
 </td>
 <td width="4%" style="background-color: transparent;"></td>
 <td width="48%" style="background-color: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e7e5e4;">
 <p style="margin: 0 0 4px 0; font-size: 12px; color: #78716c; text-transform: uppercase; letter-spacing: 0.5px;">Check-out</p>
 <p style="margin: 0; font-size: 15px; color: #1c1917; font-weight: bold;">${checkOutTime}</p>
 </td>
 </tr>
 </table>
 </td>
 </tr>
 </table>

 <!-- Secret Info Card -->
 <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; margin-bottom: 30px;">
 <tr>
 <td style="padding: 24px;">
 <div style="text-align: center; margin-bottom: 20px;">
 <div style="display: inline-block; background-color: #f59e0b; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; letter-spacing: 0.5px;">
 🔒 THÔNG TIN BẢO MẬT
 </div>
 <p style="margin: 12px 0 0 0; font-size: 14px; color: #92400e;">Vui lòng không chia sẻ thông tin này cho người khác!</p>
 </div>
 ${addressHtml}
 ${doorPasswordHtml}
 ${roomPasswordHtml}
 ${wifiHtml}
 </td>
 </tr>
 </table>

 <!-- Footer Note -->
 <p style="margin: 0 0 10px 0; font-size: 15px; color: #4b5563; text-align: center;">
 Nếu gặp bất kỳ khó khăn nào khi nhận phòng, hãy liên hệ ngay cho chúng tôi:
 </p>
 <div style="text-align: center; margin-bottom: 30px;">
 <p style="margin: 0; font-size: 18px; color: #ea580c; font-weight: bold;">📞 Hotline: ${hotline}</p>
 <p style="margin: 5px 0 0 0; font-size: 15px; color: #6b7280;">✉️ Email: ${contactEmail}</p>
 </div>

 <div style="border-top: 1px solid #e5e7eb; padding-top: 30px; text-align: center;">
 <p style="margin: 0 0 5px 0; font-size: 18px; color: #1f2937; font-weight: bold;">Chúc bạn có một kỳ nghỉ tuyệt vời!</p>
 <p style="margin: 0; font-size: 16px; color: #ea580c; font-weight: 600;">Homestay Team</p>
 </div>
 </td>
 </tr>
 
 <!-- Bottom Banner -->
 <tr>
 <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6;">
 <p style="margin: 0; font-size: 12px; color: #9ca3af;">Email này được gửi tự động từ hệ thống quản lý Homestay. Vui lòng không trả lời email này.</p>
 </td>
 </tr>
 </table>
 </td>
 </tr>
 </table>
</body>
</html>
 `;
 
 const info = await transporter.sendMail({
 from: `"Homestay Self Check-in" <${fromEmail}>`,
 to,
 subject: `[Quan Trọng] Thông tin Check-in cho đơn đặt phòng ${shortBookingId}`,
 html: htmlContent,
 });

 console.log("Message sent: %s", info.messageId);
 return { success: true, messageId: info.messageId };
 } catch (error) {
 console.error("Error sending email:", error);
 return { success: false, error };
 }
};

interface SendCouponEmailParams {
 to: string;
 customerName: string;
 couponCode: string;
 discountDesc: string;
 validTo: string;
}

export const sendCouponEmail = async (params: SendCouponEmailParams) => {
 const { to, customerName, couponCode, discountDesc, validTo } = params;

 try {
 const { transporter, fromEmail, hotline, contactEmail } = await getTransporter();

 const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>Mã giảm giá đặc biệt</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
 <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 20px;">
 <tr>
 <td align="center">
 <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
 <!-- Header -->
 <tr>
 <td style="background-color: #059669; text-align: center; padding: 40px 20px; background-image: url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=1000'); background-size: cover; background-position: center; position: relative;">
 <div style="background-color: rgba(0, 0, 0, 0.5); position: absolute; top: 0; left: 0; right: 0; bottom: 0;"></div>
 <h1 style="color: #ffffff; margin: 0; font-size: 28px; position: relative; z-index: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">MÓN QUÀ TRI ÂN</h1>
 <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px; position: relative; z-index: 1;">Dành Riêng Cho Bạn</p>
 </td>
 </tr>
 
 <!-- Content -->
 <tr>
 <td style="padding: 40px 30px; text-align: center;">
 <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151; line-height: 1.6;">Xin chào <strong>${customerName}</strong>,</p>
 <p style="margin: 0 0 30px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">Cảm ơn bạn đã luôn tin tưởng và lựa chọn dịch vụ của chúng tôi. Chúng tôi xin gửi tặng bạn một mã giảm giá đặc biệt cho lần đặt phòng tiếp theo!</p>

 <!-- Coupon Card -->
 <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ecfdf5; border: 2px dashed #10b981; border-radius: 12px; margin-bottom: 30px;">
 <tr>
 <td style="padding: 24px; text-align: center;">
 <p style="margin: 0 0 10px 0; font-size: 14px; color: #047857; text-transform: uppercase; font-weight: bold;">Mã Ưu Đãi Của Bạn</p>
 <p style="margin: 0 0 10px 0; font-size: 32px; color: #059669; font-weight: 900; letter-spacing: 2px;">${couponCode}</p>
 <div style="display: inline-block; background-color: #10b981; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 16px;">
 Giảm ${discountDesc}
 </div>
 <p style="margin: 15px 0 0 0; font-size: 13px; color: #065f46;">Hạn sử dụng: ${validTo}</p>
 </td>
 </tr>
 </table>

 <!-- Footer Note -->
 <p style="margin: 0 0 10px 0; font-size: 15px; color: #4b5563;">
 Vui lòng nhập mã này ở bước thanh toán để nhận ưu đãi.
 </p>
 
 <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
 <p style="margin: 0; font-size: 18px; color: #ea580c; font-weight: bold;">📞 Hotline: ${hotline}</p>
 </div>
 </td>
 </tr>
 </table>
 </td>
 </tr>
 </table>
</body>
</html>
 `;
 
 const info = await transporter.sendMail({
 from: `"Homestay Ưu Đãi" <${fromEmail}>`,
 to,
 subject: `🎁 Tặng bạn mã giảm giá ${discountDesc} cho lần đặt phòng tiếp theo!`,
 html: htmlContent,
 });

 console.log("Coupon Message sent: %s", info.messageId);
 return { success: true, messageId: info.messageId };
 } catch (error) {
 console.error("Error sending coupon email:", error);
 return { success: false, error };
 }
};

export interface SendAdminNotificationEmailParams {
  to: string;
  bookingId: string;
  customerName: string;
  customerPhone: string;
  roomName: string;
  totalAmount: number;
}

export const sendAdminNotificationEmail = async (params: SendAdminNotificationEmailParams) => {
  const { to, bookingId, customerName, customerPhone, roomName, totalAmount } = params;

  if (!to) return false;

  try {
    const { transporter, fromEmail } = await getTransporter();

    const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 10px;">Đơn đặt phòng chờ xác nhận (Tiền mặt/Chuyển khoản)</h2>
      <p>Chào Quản trị viên,</p>
      <p>Hệ thống vừa nhận được một đơn đặt phòng mới với phương thức thanh toán thủ công. Vui lòng kiểm tra và xác nhận thanh toán.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Mã đơn</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${bookingId}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Khách hàng</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${customerName}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Số điện thoại</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${customerPhone}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Phòng</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${roomName}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Tổng tiền</td><td style="padding: 8px; border: 1px solid #e5e7eb; color: #ea580c; font-weight: bold;">${totalAmount.toLocaleString('vi-VN')}đ</td></tr>
      </table>

      <p style="margin-top: 20px;">
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/bookings" style="background-color: #ea580c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Truy cập Trang Quản Trị</a>
      </p>
    </div>
    `;

    const info = await transporter.sendMail({
      from: `"Homestay System" <${fromEmail}>`,
      to,
      subject: `[ĐƠN HÀNG MỚI] Chờ xác nhận thanh toán - ${roomName}`,
      html: htmlContent,
    });

    console.log("Admin notification email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending admin notification email:", error);
    return false;
  }
};
