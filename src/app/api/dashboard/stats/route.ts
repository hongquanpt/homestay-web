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

 const startOfYear = new Date(vnTime.getFullYear(), 0, 1);
 startOfYear.setHours(startOfYear.getHours() - 7);

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

  // 5. Thống kê theo biểu đồ (Doanh thu 7 ngày qua)
  const sevenDaysAgo = new Date(vnTime.getFullYear(), vnTime.getMonth(), vnTime.getDate() - 6);
  sevenDaysAgo.setHours(sevenDaysAgo.getHours() - 7); // UTC adjust

  const bookings7Days = await prisma.booking.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
      status: { in: ['PAID', 'CHECKED_IN', 'COMPLETED', 'EMAIL_SENT'] }
    },
    select: { createdAt: true, totalAmount: true }
  });

  const timeZone = "Asia/Ho_Chi_Minh";
  const revenueChartData: { date: string, revenue: number }[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(vnTime);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    revenueChartData.push({ date: dateStr, revenue: 0 });
  }

  bookings7Days.forEach(b => {
    const dateStr = b.createdAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', timeZone });
    const point = revenueChartData.find(p => p.date === dateStr);
    if (point) {
      point.revenue += b.totalAmount || 0;
    }
  });
  // 6. Bảng xếp hạng Admin chốt đơn (Tiền mặt - MANUAL)
  const adminPaymentsToday = await prisma.payment.groupBy({
    by: ['confirmedById'],
    where: {
      method: 'MANUAL',
      status: 'SUCCESS',
      confirmedAt: { gte: startOfToday }
    },
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: 'desc' } }
  });

  const adminPaymentsMonth = await prisma.payment.groupBy({
    by: ['confirmedById'],
    where: {
      method: 'MANUAL',
      status: 'SUCCESS',
      confirmedAt: { gte: startOfMonth }
    },
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: 'desc' } }
  });

  const adminPaymentsYear = await prisma.payment.groupBy({
    by: ['confirmedById'],
    where: {
      method: 'MANUAL',
      status: 'SUCCESS',
      confirmedAt: { gte: startOfYear }
    },
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: 'desc' } }
  });

  const userIds = [...new Set([...adminPaymentsToday, ...adminPaymentsMonth, ...adminPaymentsYear].map(p => p.confirmedById).filter(Boolean))] as string[];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  });
  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user.name || user.email.split('@')[0];
    return acc;
  }, {} as Record<string, string>);

  const adminLeaderboardToday = adminPaymentsToday.filter(p => p.confirmedById).map(p => ({
    adminId: p.confirmedById,
    adminName: userMap[p.confirmedById as string] || 'Unknown',
    totalAmount: p._sum.amount || 0,
    count: p._count.id
  }));

  const adminLeaderboardMonth = adminPaymentsMonth.filter(p => p.confirmedById).map(p => ({
    adminId: p.confirmedById,
    adminName: userMap[p.confirmedById as string] || 'Unknown',
    totalAmount: p._sum.amount || 0,
    count: p._count.id
  }));

  const adminLeaderboardYear = adminPaymentsYear.filter(p => p.confirmedById).map(p => ({
    adminId: p.confirmedById,
    adminName: userMap[p.confirmedById as string] || 'Unknown',
    totalAmount: p._sum.amount || 0,
    count: p._count.id
  }));

  // 7. Cảnh báo đổi mật khẩu định kỳ (15 và ngày cuối tháng)
  const todayDate = vnTime.getDate();
  const tomorrow = new Date(vnTime);
  tomorrow.setDate(vnTime.getDate() + 1);
  const isLastDay = tomorrow.getDate() === 1;
  const showPasswordReminder = todayDate === 15 || isLastDay;

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
   adminLeaderboardToday,
   adminLeaderboardMonth,
   adminLeaderboardYear,
   revenueChartData,
   showPasswordReminder,
  });
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
