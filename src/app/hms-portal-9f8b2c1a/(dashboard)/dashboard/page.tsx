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
 Banknote,
 AlertTriangle
} from "lucide-react";
import { RevenueChart } from "./revenue-chart";

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
 adminLeaderboardToday: [],
 adminLeaderboardMonth: [],
 adminLeaderboardYear: [],
 revenueChartData: [],
 showPasswordReminder: false,
 });
 const [leaderboardTab, setLeaderboardTab] = useState<'today' | 'month' | 'year'>('month');
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
 adminLeaderboardToday: data.adminLeaderboardToday || [],
 adminLeaderboardMonth: data.adminLeaderboardMonth || [],
 adminLeaderboardYear: data.adminLeaderboardYear || [],
 revenueChartData: data.revenueChartData || [],
 showPasswordReminder: data.showPasswordReminder || false,
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
 {stats.showPasswordReminder && (
    <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl shadow-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="p-2 bg-orange-100 text-orange-600 rounded-lg shrink-0">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-orange-800 font-bold text-sm mb-1">Nhắc nhở định kỳ: Thay đổi Mật khẩu cửa/phòng</h3>
        <p className="text-orange-700 text-xs">Hôm nay là ngày quy định (15 hoặc cuối tháng). Quản trị viên vui lòng tiến hành thay đổi toàn bộ mật khẩu các phòng để đảm bảo an ninh cho hệ thống.</p>
      </div>
    </div>
  )}

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

 {/* Chart & Tables section */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-6 shadow-sm min-h-[300px] flex flex-col">
  <div className="flex justify-between items-center mb-6">
  <h3 className="font-bold text-zinc-900">Doanh thu 7 ngày qua</h3>
  </div>
  <div className="flex-1 w-full min-h-[250px]">
  <RevenueChart data={stats.revenueChartData} />
  </div>
  </div>
 <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
 <div className="flex justify-between items-center mb-4">
 <h3 className="font-bold text-zinc-900">BXH Chốt Đơn (Tiền mặt)</h3>
 <div className="flex bg-zinc-100 rounded-lg p-1">
 <button 
 onClick={() => setLeaderboardTab('today')}
 className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${leaderboardTab === 'today' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
 >
 Hôm nay
 </button>
 <button 
 onClick={() => setLeaderboardTab('month')}
 className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${leaderboardTab === 'month' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
 >
 Tháng này
 </button>
 <button 
 onClick={() => setLeaderboardTab('year')}
 className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${leaderboardTab === 'year' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
 >
 Năm nay
 </button>
 </div>
 </div>
 
 <div className="space-y-4">
 {(leaderboardTab === 'today' ? stats.adminLeaderboardToday : leaderboardTab === 'month' ? stats.adminLeaderboardMonth : stats.adminLeaderboardYear).length === 0 ? (
 <p className="text-sm text-zinc-500 text-center py-6">Chưa có dữ liệu</p>
 ) : (
 (leaderboardTab === 'today' ? stats.adminLeaderboardToday : leaderboardTab === 'month' ? stats.adminLeaderboardMonth : stats.adminLeaderboardYear).map((admin: any, index: number) => (
 <div key={admin.adminId} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-100">
 <div className="flex items-center gap-3">
 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
 index === 0 ? 'bg-yellow-100 text-yellow-700' :
 index === 1 ? 'bg-slate-200 text-slate-700' :
 index === 2 ? 'bg-orange-100 text-orange-700' :
 'bg-zinc-200 text-zinc-600'
 }`}>
 #{index + 1}
 </div>
 <div>
 <p className="font-semibold text-zinc-900 text-sm">{admin.adminName}</p>
 <p className="text-xs text-zinc-500">{admin.count} đơn</p>
 </div>
 </div>
 <div className="text-right">
 <p className="font-bold text-emerald-600">{admin.totalAmount.toLocaleString()}đ</p>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
