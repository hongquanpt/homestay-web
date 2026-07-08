import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Lấy IP thực của khách (hoạt động tốt với Vercel, Cloudflare, hoặc Nginx reverse proxy)
 */
export async function getClientIp() {
 const headersList = await headers();
 const forwardedFor = headersList.get("x-forwarded-for");
 const realIp = headersList.get("x-real-ip");
 
 if (forwardedFor) {
 return forwardedFor.split(",")[0].trim();
 }
 
 if (realIp) {
 return realIp.trim();
 }
 
 return "127.0.0.1"; // Default fallback
}

/**
 * Kiểm tra xem IP có nằm trong Blacklist không và ghi lại Visitor Log
 * Chạy hàm này ở Root Layout hoặc các API routes cần bảo vệ.
 */
export async function trackAndCheckIp() {
 try {
 const ip = await getClientIp();
 const headersList = await headers();
 const userAgent = headersList.get("user-agent") || "Unknown";

 // 1. Kiểm tra Blacklist IP
 const blacklisted = await prisma.blacklistIp.findUnique({
 where: { ip },
 });

 if (blacklisted) {
 return {
 isBlocked: true,
 reason: blacklisted.reason || "IP của bạn đã bị hạn chế truy cập.",
 ip
 };
 }

 // 2. Lưu lại vào Visitor Log (Upsert để cập nhật thời gian truy cập gần nhất)
 await prisma.visitorLog.upsert({
 where: { ip },
 update: { visitedAt: new Date(), userAgent },
 create: { ip, userAgent },
 });

 // 3. Tự động dọn dẹp các log cũ (Không await để tránh làm chậm response)
 cleanupOldVisitorLogs().catch(console.error);

 return {
 isBlocked: false,
 ip
 };
 } catch (error) {
 console.error("Lỗi khi track IP:", error);
 return { isBlocked: false, ip: "127.0.0.1" }; // Fail-safe: Vẫn cho phép truy cập nếu lỗi DB
 }
}

/**
 * Tự động xóa các bản ghi truy cập cũ
 */
async function cleanupOldVisitorLogs() {
 try {
 // Đọc cài đặt thời gian lưu trữ từ Database (mặc định 24h)
 const setting = await prisma.systemSetting.findUnique({
 where: { key: "VISITOR_LOG_RETENTION_HOURS" },
 });

 const retentionHours = setting?.value ? parseInt(setting.value) : 24;

 const cutoffDate = new Date();
 cutoffDate.setHours(cutoffDate.getHours() - retentionHours);

 // Xóa các IP chưa truy cập lại sau khoảng thời gian này
 await prisma.visitorLog.deleteMany({
 where: {
 visitedAt: {
 lt: cutoffDate,
 },
 },
 });
 } catch (error) {
 console.error("Lỗi dọn dẹp VisitorLog:", error);
 }
}
