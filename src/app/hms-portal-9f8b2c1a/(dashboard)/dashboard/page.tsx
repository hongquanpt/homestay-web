"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { 
 Users, 
 CreditCard, 
 Activity, 
 TrendingUp,
 TrendingDown,
 CalendarDays,
 DoorOpen,
 Banknote
} from "lucide-react";

export default function AdminDashboardPage() {
 const [stats, setStats] = useState({
 revenue: 0,
 revenueToday: 0,
 revenueChange: 0,
 revenueThisMonth: 0,
 revenueMonthChange: 0,
 newBookings: 0,
 bookingsChange: 0,
 occupancy: 0,
 guests: 0,
 });
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const fetchStats = async () => {
 try {
 const res = await fetch('/api/dashboard/stats');
 const data = await res.json();
 setStats({
 revenue: data.revenue || 0,
 revenueToday: data.revenueToday || 0,
 revenueChange: parseFloat(data.revenueChange) || 0,
 revenueThisMonth: data.revenueThisMonth || 0,
 revenueMonthChange: parseFloat(data.revenueMonthChange) || 0,
 newBookings: data.newBookings || 0,
 bookingsChange: parseFloat(data.bookingsChange) || 0,
 occupancy: data.occupancy || 0,
 guests: data.guests || 0,
 });
 } catch (e) {
 console.error(e);
 } finally {
 setLoading(false);
 }
 };
 fetchStats();
 }, []);

 return (
 <div className="space-y-6">
 <div>
 <h1 className="text-2xl font-bold text-zinc-900 ">Dashboard Tổng Quan</h1>
 <p className="text-sm text-zinc-500 mt-1">Xin chào, đây là tình hình hoạt động của Homestay hôm nay.</p>
 </div>

 {loading ? (
 <div className="py-12 text-center text-zinc-500">Đang tải dữ liệu...</div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
 {/* Card 0: Revenue Today */}
 <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden group">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 ">
 <Banknote className="w-5 h-5" />
 </div>
 <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${stats.revenueChange >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
 {stats.revenueChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
 {stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange}%
 </span>
 </div>
 <h3 className="text-3xl font-bold text-zinc-900 mb-1">
 {stats.revenueToday.toLocaleString()}đ
 </h3>
 <p className="text-sm font-medium text-zinc-500">Doanh thu hôm nay</p>
 </div>

 {/* Card 1: Revenue This Month */}
 <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden group">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2 bg-emerald-100/50 rounded-lg text-emerald-600/70 ">
 <CreditCard className="w-5 h-5" />
 </div>
 <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${stats.revenueMonthChange >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
 {stats.revenueMonthChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
 {stats.revenueMonthChange >= 0 ? '+' : ''}{stats.revenueMonthChange}%
 </span>
 </div>
 <h3 className="text-3xl font-bold text-zinc-900 mb-1">
 {stats.revenueThisMonth.toLocaleString()}đ
 </h3>
 <p className="text-sm font-medium text-zinc-500">Doanh thu tháng này</p>
 </div>

 {/* Card 2 */}
 <Link href="/hms-portal-9f8b2c1a/bookings" className="block bg-white p-5 rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden group hover:border-primary hover:shadow-md transition-all cursor-pointer">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2 bg-blue-100 rounded-lg text-blue-600 ">
 <CalendarDays className="w-5 h-5" />
 </div>
 <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${stats.bookingsChange >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
 {stats.bookingsChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
 {stats.bookingsChange >= 0 ? '+' : ''}{stats.bookingsChange}%
 </span>
 </div>
 <h3 className="text-3xl font-bold text-zinc-900 mb-1">{stats.newBookings}</h3>
 <p className="text-sm font-medium text-zinc-500">Đơn đặt phòng hôm nay</p>
 </Link>

 {/* Card 3 */}
 <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden group">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2 bg-primary/10 rounded-lg text-primary ">
 <DoorOpen className="w-5 h-5" />
 </div>
 </div>
 <h3 className="text-3xl font-bold text-zinc-900 mb-1">{stats.occupancy}%</h3>
 <p className="text-sm font-medium text-zinc-500">Tỷ lệ lấp đầy hiện tại</p>
 </div>

 {/* Card 4 */}
 <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden group">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2 bg-rose-100 rounded-lg text-rose-600 ">
 <Users className="w-5 h-5" />
 </div>
 </div>
 <h3 className="text-3xl font-bold text-zinc-900 mb-1">{stats.guests}</h3>
 <p className="text-sm font-medium text-zinc-500">Khách đang lưu trú</p>
 </div>
 </div>
 )}

 {/* Chart & Tables section can go here later */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-6 shadow-sm min-h-[300px] flex items-center justify-center">
 <div className="text-center">
 <Activity className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
 <p className="text-zinc-500 text-sm">Biểu đồ doanh thu đang được cập nhật</p>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
 <h3 className="font-bold text-zinc-900 mb-4">Hoạt động gần đây</h3>
 <div className="space-y-4">
 <p className="text-sm text-zinc-500">Chưa có hoạt động nào</p>
 </div>
 </div>
 </div>
 </div>
 );
}
