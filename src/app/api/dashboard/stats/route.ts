import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
 try {
 // 1. Tổng doanh thu (Các Booking đã PAID hoặc CHECKED_IN hoặc COMPLETED)
 const revenueAggr = await prisma.booking.aggregate({
 _sum: { totalAmount: true },
 where: {
 status: { in: ['PAID', 'CHECKED_IN', 'COMPLETED', 'EMAIL_SENT'] }
 }
 });
 const totalRevenue = revenueAggr._sum.totalAmount || 0;

 // 2. Thống kê Hôm nay và Hôm qua
 const now = new Date();
 const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
 const startOfToday = new Date(vnTime.getFullYear(), vnTime.getMonth(), vnTime.getDate());
 startOfToday.setHours(startOfToday.getHours() - 7); // Adjust back to UTC
 const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
 
 const bookingsTodayList = await prisma.booking.findMany({
  where: { createdAt: { gte: startOfToday } }
 });
 const bookingsYesterdayList = await prisma.booking.findMany({
  where: { createdAt: { gte: startOfYesterday, lt: startOfToday } }
 });

 const bookingsToday = bookingsTodayList.length;
 const bookingsYesterday = bookingsYesterdayList.length;

 const revenueToday = bookingsTodayList
  .filter(b => ['PAID', 'CHECKED_IN', 'COMPLETED', 'EMAIL_SENT'].includes(b.status))
  .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
 const revenueYesterday = bookingsYesterdayList
  .filter(b => ['PAID', 'CHECKED_IN', 'COMPLETED', 'EMAIL_SENT'].includes(b.status))
  .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

 const revenueChange = revenueYesterday === 0 ? (revenueToday > 0 ? 100 : 0) : ((revenueToday - revenueYesterday) / revenueYesterday) * 100;
 const bookingsChange = bookingsYesterday === 0 ? (bookingsToday > 0 ? 100 : 0) : ((bookingsToday - bookingsYesterday) / bookingsYesterday) * 100;

 // 2.5. Thống kê Tháng này và Tháng trước
 const startOfMonth = new Date(vnTime.getFullYear(), vnTime.getMonth(), 1);
 startOfMonth.setHours(startOfMonth.getHours() - 7);
 
 const startOfLastMonth = new Date(vnTime.getFullYear(), vnTime.getMonth() - 1, 1);
 startOfLastMonth.setHours(startOfLastMonth.getHours() - 7);

 const bookingsThisMonthList = await prisma.booking.findMany({
  where: { createdAt: { gte: startOfMonth } }
 });
 const bookingsLastMonthList = await prisma.booking.findMany({
  where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } }
 });

 const revenueThisMonth = bookingsThisMonthList
  .filter(b => ['PAID', 'CHECKED_IN', 'COMPLETED', 'EMAIL_SENT'].includes(b.status))
  .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
 const revenueLastMonth = bookingsLastMonthList
  .filter(b => ['PAID', 'CHECKED_IN', 'COMPLETED', 'EMAIL_SENT'].includes(b.status))
  .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

 const revenueMonthChange = revenueLastMonth === 0 ? (revenueThisMonth > 0 ? 100 : 0) : ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100;

 // 3. Tỷ lệ lấp đầy (Số phòng đang có Booking detail nằm trong thời điểm hiện tại)
 const nowTime = new Date();
 const activeRooms = await prisma.bookingDetail.groupBy({
 by: ['roomId'],
 where: {
 startTime: { lte: nowTime },
 endTime: { gte: nowTime },
 booking: { status: { in: ['PAID', 'CHECKED_IN', 'EMAIL_SENT'] } }
 }
 });
 
 const totalRooms = await prisma.room.count({ where: { status: 'ACTIVE' } });
 const occupancyRate = totalRooms > 0 ? (activeRooms.length / totalRooms) * 100 : 0;

 // 4. Khách đang lưu trú (Booking CHECKED_IN)
 const guestsAggr = await prisma.booking.aggregate({
 _sum: { numGuests: true },
 where: { status: 'CHECKED_IN' }
 });
 const currentGuests = guestsAggr._sum.numGuests || 0;

 // 5. Thống kê theo biểu đồ (Giả lập doanh thu 7 ngày qua)
 // Để giữ code đơn giản, tôi sẽ trả về mảng tĩnh hoặc truy vấn đơn giản
 // Thực tế sẽ dùng GROUP BY DATE(createdAt)
 
  return NextResponse.json({
  revenue: totalRevenue,
  revenueToday,
  revenueChange: revenueChange.toFixed(1),
  revenueThisMonth,
  revenueMonthChange: revenueMonthChange.toFixed(1),
  newBookings: bookingsToday,
  bookingsChange: bookingsChange.toFixed(1),
  occupancy: occupancyRate.toFixed(1),
  guests: currentGuests,
 });
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
