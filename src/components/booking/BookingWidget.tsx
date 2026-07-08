"use client";

import { useState, useMemo, useEffect } from "react";
import { Calendar, Clock, ChevronLeft, ChevronRight, Upload, CreditCard, QrCode, Banknote, CheckCircle, ArrowLeft, Moon, Sun, XCircle } from "lucide-react";
import Swal from 'sweetalert2';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Defined Packages
const defaultBookingPackages = [
 { id: "noon", label: "11:00 - 14:00", price: 260000, start: "11:00", end: "14:00", icon: "sun" },
 { id: "afternoon", label: "14:30 - 17:30", price: 260000, start: "14:30", end: "17:30", icon: "sun" },
 { id: "evening", label: "18:00 - 21:00", price: 260000, start: "18:00", end: "21:00", icon: "sun" },
 { id: "overnight", label: "21:30 - 10:30", price: 420000, start: "21:30", end: "10:30", icon: "moon" }
];

function getBookingPackages(room: any, selectedDate: string | null, surcharges: any[] = []) {
  if (!room) return defaultBookingPackages;

  let dayOfWeek = -1;
  if (selectedDate) {
    const dateObj = new Date(selectedDate);
    dayOfWeek = dateObj.getDay();
  }

  const getDiscountedPrice = (pkgId: string, originalPrice: number) => {
    if (!room.discounts || dayOfWeek === -1) return { originalPrice, finalPrice: originalPrice, discount: null };
    const discount = room.discounts.find((d: any) => d.dayOfWeek === dayOfWeek && (d.packageId === pkgId || d.packageId === 'ALL'));
    if (!discount) return { originalPrice, finalPrice: originalPrice, discount: null };

    let finalPrice = originalPrice;
    if (discount.discountPct) {
      finalPrice = originalPrice * (1 - discount.discountPct / 100);
    } else if (discount.discountAmt) {
      finalPrice = Math.max(0, originalPrice - discount.discountAmt);
    }
    return { originalPrice, finalPrice, discount };
  };

  return defaultBookingPackages.map(pkg => {
    let originalPrice = 260000;
    if (pkg.id === 'noon') originalPrice = room.priceNoon ?? 260000;
    else if (pkg.id === 'afternoon') originalPrice = room.priceAfternoon ?? 260000;
    else if (pkg.id === 'evening') originalPrice = room.priceEvening ?? 260000;
    else if (pkg.id === 'overnight') originalPrice = room.priceOvernight ?? 420000;

    const applicableSurcharges = surcharges.filter((s: any) => {
      if (s.packageId !== 'ALL' && s.packageId !== pkg.id) return false;
      if (s.type === 'DATE' && selectedDate) {
        return new Date(s.targetDate).toISOString().split('T')[0] === selectedDate;
      }
      if (s.type === 'DAY_OF_WEEK') {
        return s.dayOfWeek === dayOfWeek;
      }
      return false;
    });

    let surchargeAmt = 0;
    let hasHoliday = false;
    applicableSurcharges.forEach((s: any) => {
      if (s.type === 'DATE') hasHoliday = true;
      if (s.surchargeAmt) surchargeAmt += s.surchargeAmt;
      if (s.surchargePct) surchargeAmt += (originalPrice * s.surchargePct) / 100;
    });

    const basePriceWithSurcharge = originalPrice + surchargeAmt;
    const { finalPrice, discount } = getDiscountedPrice(pkg.id, basePriceWithSurcharge);

    return {
      ...pkg,
      basePkgPrice: originalPrice,
      originalPrice: basePriceWithSurcharge,
      price: finalPrice,
      discount,
      hasHoliday,
      surchargeAmt
    };
  });
}

function formatVND(num: number) {
 return num.toLocaleString("vi-VN") + "đ";
}

function getDaysInMonth(year: number, month: number) {
 return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
 return new Date(year, month, 1).getDay();
}

export function BookingWidget({ roomId, roomName, room, surcharges = [] }: { roomId: string, roomName: string, room?: any, surcharges?: any[] }) {
 const today = new Date();
 const [currentMonth, setCurrentMonth] = useState(today.getMonth());
 const [currentYear, setCurrentYear] = useState(today.getFullYear());
 
 // Booking selections
 const [selectedDate, setSelectedDate] = useState<string | null>(null);
 const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
 
 const bookingPackages = useMemo(() => getBookingPackages(room, selectedDate, surcharges), [room, selectedDate, surcharges]);

 const [step, setStep] = useState<"schedule" | "form" | "payment" | "success">("schedule");
 const [paymentMethod, setPaymentMethod] = useState<"qr" | "manual">("qr");
 const [couponCode, setCouponCode] = useState("");
 const [payosUrl, setPayosUrl] = useState<string | null>(null);
 const [frontIdFile, setFrontIdFile] = useState<File | null>(null);
 const [backIdFile, setBackIdFile] = useState<File | null>(null);
 const [errorModal, setErrorModal] = useState<{isOpen: boolean, message: string}>({isOpen: false, message: ""});

 // Form fields
 const [name, setName] = useState("");
 const [phone, setPhone] = useState("");
 const [email, setEmail] = useState("");
 const [guests, setGuests] = useState("2");
 
 const [isLoading, setIsLoading] = useState(false);
 const [qrUrl, setQrUrl] = useState<string | null>(null);
 const [bookingId, setBookingId] = useState<string | null>(null);
 const [bookedIntervals, setBookedIntervals] = useState<{startTime: string, endTime: string}[]>([]);

  const [countdownStr, setCountdownStr] = useState<string>("10:00");
  const [isExpired, setIsExpired] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

 const [cashStartTime, setCashStartTime] = useState<string | null>(null);
 const [cashEndTime, setCashEndTime] = useState<string | null>(null);
 const [isCashAllowed, setIsCashAllowed] = useState(true);

 const [earlyBookingDays, setEarlyBookingDays] = useState<number>(0);
 const [earlyBookingDiscountPct, setEarlyBookingDiscountPct] = useState<number>(0);

 useEffect(() => {
 fetch(`/api/settings?t=${Date.now()}`)
 .then(res => res.json())
 .then(data => {
 if (data.cash_payment_start_time) setCashStartTime(data.cash_payment_start_time);
 if (data.cash_payment_end_time) setCashEndTime(data.cash_payment_end_time);
 if (data.early_booking_days) setEarlyBookingDays(Number(data.early_booking_days));
 if (data.early_booking_discount_pct) setEarlyBookingDiscountPct(Number(data.early_booking_discount_pct));
 })
 .catch(console.error);
 }, []);

 useEffect(() => {
 if (!cashStartTime || !cashEndTime) {
 setIsCashAllowed(true);
 return;
 }
 
 const now = new Date();
 const currentMinutes = now.getHours() * 60 + now.getMinutes();
 
 const [startH, startM] = cashStartTime.split(':').map(Number);
 const startMinutes = startH * 60 + startM;
 
 const [endH, endM] = cashEndTime.split(':').map(Number);
 const endMinutes = endH * 60 + endM;

 let allowed = true;
 if (startMinutes <= endMinutes) {
 allowed = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
 } else {
 allowed = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
 }
 
 setIsCashAllowed(allowed);
 if (!allowed && paymentMethod === "manual") {
 setPaymentMethod("qr");
 }
 }, [cashStartTime, cashEndTime, paymentMethod]);

 useEffect(() => {
 if (selectedDate) {
 fetch(`/api/rooms/availability?roomId=${roomId}&date=${selectedDate}`)
 .then(res => res.json())
 .then(data => {
 if (data.bookedIntervals) {
 setBookedIntervals(data.bookedIntervals);
 } else {
 setBookedIntervals([]);
 }
 })
 .catch(() => setBookedIntervals([]));
 } else {
 setBookedIntervals([]);
 }
 }, [roomId, selectedDate]);

  useEffect(() => {
    if (step === "success" && bookingId && !isExpired && !isPaid) {
      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/bookings/${bookingId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === "PAID" || data.status === "EMAIL_SENT" || data.status === "CHECKED_IN" || data.status === "COMPLETED") {
              setIsPaid(true);
              clearInterval(pollInterval);
            } else if (data.status === "CANCELLED") {
              setIsExpired(true);
              clearInterval(pollInterval);
            }
          }
        } catch (error) {
          console.error("Polling error", error);
        }
      }, 3000);
      return () => clearInterval(pollInterval);
    }
  }, [step, bookingId, isExpired, isPaid]);

  useEffect(() => {
  if (step === "success" && !isPaid) {
  const durationMins = paymentMethod === "manual" ? 60 : 10;
 setCountdownStr(paymentMethod === "manual" ? "60:00" : "10:00");
 
 const endTime = Date.now() + durationMins * 60 * 1000;
 const interval = setInterval(() => {
 const remaining = endTime - Date.now();
 if (remaining <= 0) {
 clearInterval(interval);
 setCountdownStr("00:00");
 setIsExpired(true);
 } else {
 const m = Math.floor(remaining / 60000).toString().padStart(2, '0');
 const s = Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0');
 setCountdownStr(`${m}:${s}`);
 }
 }, 1000);
 return () => clearInterval(interval);
  }
  }, [step, isPaid, paymentMethod]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

  const currentPkgs = useMemo(() => bookingPackages.filter(p => selectedPackages.includes(p.id)), [selectedPackages, bookingPackages]);
  
  const totalAmount = useMemo(() => {
    let sum = currentPkgs.reduce((sum, pkg) => sum + pkg.price, 0);

    // Tính toán Early Booking Discount
    if (selectedDate && earlyBookingDays > 0 && earlyBookingDiscountPct > 0) {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const bookingDate = new Date(selectedDate);
      const diffTime = bookingDate.getTime() - todayDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= earlyBookingDays) {
        sum = sum * (1 - earlyBookingDiscountPct / 100);
      }
    }

    return sum;
  }, [currentPkgs, selectedDate, earlyBookingDays, earlyBookingDiscountPct]);
  
  const earlyBookingInfo = useMemo(() => {
    if (!selectedDate || earlyBookingDays <= 0 || earlyBookingDiscountPct <= 0) return null;
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const bookingDate = new Date(selectedDate);
    const diffTime = bookingDate.getTime() - todayDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= earlyBookingDays) {
      const baseSum = currentPkgs.reduce((sum, pkg) => sum + pkg.price, 0);
      return {
        amount: baseSum * (earlyBookingDiscountPct / 100),
        pct: earlyBookingDiscountPct
      };
    }
    return null;
  }, [selectedDate, earlyBookingDays, earlyBookingDiscountPct, currentPkgs]);

  const isConsecutive = (pkgs: string[]) => {
    if (pkgs.length <= 1) return true;
    const indices = pkgs.map(id => bookingPackages.findIndex(p => p.id === id)).sort((a, b) => a - b);
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] !== indices[i - 1] + 1) return false;
    }
    return true;
  };

  const handlePackageToggle = (pkgId: string) => {
    if (selectedPackages.includes(pkgId)) {
      const newSelection = selectedPackages.filter(id => id !== pkgId);
      if (isConsecutive(newSelection)) {
        setSelectedPackages(newSelection);
      } else {
        setSelectedPackages([]);
      }
    } else {
      const newSelection = [...selectedPackages, pkgId];
      if (isConsecutive(newSelection)) {
        setSelectedPackages(newSelection);
      } else {
        setErrorModal({isOpen: true, message: "Chỉ được chọn nhiều khung giờ nếu chúng liền kề nhau. Nếu muốn đặt các khung cách xa nhau, vui lòng đặt thành 2 đơn riêng biệt!"});
      }
    }
  };

 const handleProceedToPayment = () => {
    if (!/^\d{9,12}$/.test(phone)) {
      setErrorModal({isOpen: true, message: "Số điện thoại không hợp lệ! Vui lòng nhập từ 9-12 chữ số."});
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorModal({isOpen: true, message: "Định dạng email chưa đúng (Ví dụ: ten@gmail.com)."});
      return;
    }
    setStep("payment");
  };

 const isPackageAvailable = (pkg: typeof bookingPackages[0]) => {
 if (!selectedDate) return false;
 
 const pkgStart = new Date(`${selectedDate}T${pkg.start}:00+07:00`).getTime();
 const pkgEndObj = new Date(`${selectedDate}T${pkg.end}:00+07:00`);
 if (pkg.id === 'overnight') {
 pkgEndObj.setDate(pkgEndObj.getDate() + 1);
 }
 const pkgEnd = pkgEndObj.getTime();

 for (const b of bookedIntervals) {
 const bStart = new Date(b.startTime).getTime();
 const bEnd = new Date(b.endTime).getTime();
 
 // If there is an overlap
 if (pkgStart < bEnd && pkgEnd > bStart) {
 return false;
 }
 }
 return true;
 };

  const handleDateSelect = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setSelectedPackages([]);
  };

 const handleSubmitBooking = async () => {
 if (selectedPackages.length === 0 || !selectedDate) return;
 try {
 setIsLoading(true);
 
 const startPkg = bookingPackages.find(p => p.id === selectedPackages[0]);
 const endPkg = bookingPackages.find(p => p.id === selectedPackages[selectedPackages.length - 1]);
 if (!startPkg || !endPkg) return;

 const startTimeString = `${selectedDate}T${startPkg.start}:00+07:00`;
 
 const endObj = new Date(`${selectedDate}T${endPkg.end}:00+07:00`);
 if (endPkg.id === 'overnight') {
 endObj.setDate(endObj.getDate() + 1);
 }
 const endTimeString = endObj.toISOString();
 
 const payload = {
 customerName: name,
 customerPhone: phone,
 customerEmail: email,
 numGuests: parseInt(guests) || 1,
 notes: `Gói: ${currentPkgs.map(p => p.label).join(', ')}`,
 totalAmount,
 paymentMethod: paymentMethod === "qr" ? "QR_BANKING" : "MANUAL",
 roomId: roomId,
 startTime: startTimeString,
 endTime: endTimeString,
 price: totalAmount,
 };

 const res = await fetch("/api/bookings", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(payload),
 });

 const data = await res.json();
 if (data.success) {
 setBookingId(data.data.bookingId);
 setQrUrl(data.data.qrUrl);
 setPayosUrl(data.data.payosUrl || null);
 setStep("success");
 } else {
 Swal.fire({ icon: 'error', title: 'Lỗi đặt phòng', text: data.error || "Không thể tạo đơn" });
 }
 } catch (error) {
 console.error(error);
 Swal.fire({ icon: 'error', title: 'Lỗi hệ thống', text: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại." });
 } finally {
 setIsLoading(false);
 }
 };

  const isValidToProceed = selectedDate && selectedPackages.length > 0;

 return (
 <div className="card-bubble p-6 relative overflow-hidden">
 {/* Steps indicator */}
 <div className="flex items-center justify-between mb-6">
 {[
 { key: "schedule", label: "Lịch" },
 { key: "form", label: "Thông tin" },
 { key: "payment", label: "Thanh toán" },
 ].map((s, idx) => (
 <div key={s.key} className="flex items-center gap-1.5 flex-1 justify-center relative">
 <div
 className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-colors ${
 step === s.key
 ? "bg-primary text-white shadow-md shadow-primary/20"
 : idx < ["schedule", "form", "payment", "success"].indexOf(step)
 ? "bg-emerald-500 text-white"
 : "bg-zinc-100 text-zinc-400"
 }`}
 >
 {idx < ["schedule", "form", "payment", "success"].indexOf(step) ? <CheckCircle className="w-4 h-4" /> : idx + 1}
 </div>
 {idx < 2 && (
 <div className={`absolute top-1/2 left-1/2 w-full h-[2px] -translate-y-1/2 z-0 ${
 idx < ["schedule", "form", "payment", "success"].indexOf(step) ? "bg-emerald-500" : "bg-zinc-100 "
 }`} />
 )}
 </div>
 ))}
 </div>

 {step === "schedule" && (
 <div className="space-y-6 animate-in fade-in">
 {/* Calendar */}
 <div>
 <div className="flex items-center justify-between mb-4 bg-zinc-50 rounded-xl p-2">
 <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); }} className="p-2 hover:bg-white :bg-zinc-700 rounded-lg shadow-sm transition-colors">
 <ChevronLeft className="w-4 h-4 text-zinc-600 " />
 </button>
 <h3 className="text-sm font-bold text-zinc-900 ">
 {monthNames[currentMonth]} {currentYear}
 </h3>
 <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); }} className="p-2 hover:bg-white :bg-zinc-700 rounded-lg shadow-sm transition-colors">
 <ChevronRight className="w-4 h-4 text-zinc-600 " />
 </button>
 </div>
 <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-wider">
 {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => <div key={d}>{d}</div>)}
 </div>
 <div className="grid grid-cols-7 gap-1">
 {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
 {Array.from({ length: daysInMonth }).map((_, i) => {
 const day = i + 1;
 const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
 const isSelected = selectedDate === dateStr;
 
 const dateObj = new Date(dateStr);
 const todayStr = today.toDateString();
 const maxDate = new Date(todayStr);
 maxDate.setMonth(maxDate.getMonth() + 2);
 
 const isPast = dateObj < new Date(todayStr);
 const isTooFar = dateObj > maxDate;
 const isAvailableDate = !isPast && !isTooFar;

 return (
 <button
 key={day}
 disabled={!isAvailableDate}
 onClick={() => handleDateSelect(day)}
 className={`aspect-square flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 ${
 !isAvailableDate ? "text-zinc-300 cursor-not-allowed" : isSelected ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "text-zinc-700 hover:bg-primary/5 hover:text-primary"
 }`}
 >
 {day}
 </button>
 );
 })}
 </div>
 </div>

 {/* Package Selection */}
 <div className="border-t border-zinc-100 pt-5">
 <h3 className="text-sm font-bold text-zinc-900 mb-3">
 Chọn gói thời gian <span className="text-[10px] text-zinc-400 font-normal">({room?.discounts?.length || 0} km)</span>
 </h3>
 {selectedDate ? (
 <div className="grid grid-cols-2 gap-2">
 {bookingPackages.map((pkg) => {
 const available = isPackageAvailable(pkg);
 const isSelected = selectedPackages.includes(pkg.id);
 return (
 <button
 key={pkg.id}
 disabled={!available}
 onClick={() => handlePackageToggle(pkg.id)}
 className={`flex flex-col justify-center items-center py-3 rounded-xl border-2 transition-all ${
 !available
 ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
 : isSelected
 ? "bg-gradient-to-br from-primary to-primary border-transparent text-white shadow-md scale-[1.02]"
 : "bg-primary/5 border-primary/20 text-primary hover:border-primary"
 }`}
 >
 <div className="flex items-center gap-1.5 mb-1">
 <span className="font-bold text-sm">{pkg.label}</span>
 {pkg.icon === 'sun' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
 </div>
  {(pkg as any).surchargeAmt > 0 && (pkg as any).hasHoliday && (
    <span className="absolute top-2 left-2 bg-yellow-500 text-white text-[8px] px-1 font-bold rounded">LỄ</span>
  )}
  {((pkg as any).discount || (pkg as any).surchargeAmt > 0) && (
    <div className="flex items-center gap-2 mb-1">
      <span className={`text-[10px] line-through ${isSelected ? 'text-white/70' : 'text-zinc-400'}`}>
        {formatVND((pkg as any).basePkgPrice)}
      </span>
      {(pkg as any).discount && (
        <span className="bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded">
          {(pkg as any).discount.discountPct ? `-${(pkg as any).discount.discountPct}%` : `-${formatVND((pkg as any).discount.discountAmt)}`}
        </span>
      )}
    </div>
  )}
 <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-primary'}`}>
   {formatVND(pkg.price)}
 </span>
 </button>
 );
 })}
 </div>
 ) : (
 <div className="text-xs text-zinc-500 text-center py-4 bg-zinc-50 rounded-xl">Vui lòng chọn ngày trước</div>
 )}
 </div>

 {/* Summary Box */}
  {isValidToProceed && (
    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 ">
      <div className="flex justify-between items-center text-sm mb-1 gap-2">
        <span className="text-primary font-medium shrink-0">Gói đã chọn:</span>
        <span className="font-bold text-primary text-right">{currentPkgs.map(p => p.label).join(' + ')}</span>
      </div>
      
      {earlyBookingInfo && (
        <div className="flex justify-between items-center text-sm mb-1 gap-2 text-emerald-600">
          <span className="font-medium shrink-0">Đặt sớm (-{earlyBookingInfo.pct}%):</span>
          <span className="font-bold text-right">- {formatVND(earlyBookingInfo.amount)}</span>
        </div>
      )}

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-primary/20 ">
        <span className="text-sm font-bold text-primary ">Thành tiền:</span>
        <span className="text-xl font-black text-primary ">{formatVND(totalAmount)}</span>
      </div>
    </div>
  )}

 {/* Checkout CTA */}
 <div className="pt-2">
 <button
 onClick={() => setStep("form")}
 disabled={!isValidToProceed}
 className="btn-bubble w-full py-3.5 bg-primary text-white disabled:opacity-50"
 >
 Tiếp tục — Điền thông tin
 </button>
 </div>
 </div>
 )}

 {step === "form" && (
 <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
 <h3 className="font-bold text-zinc-900 ">Thông tin liên hệ</h3>
 <div className="space-y-3">
 <div>
 <Label className="text-xs font-semibold text-zinc-600 ">Họ và tên *</Label>
 <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên của bạn" className="h-11 mt-1 rounded-2xl bg-zinc-50 border-2 border-zinc-200 focus-visible:ring-primary/20 " />
 </div>
 <div>
 <Label className="text-xs font-semibold text-zinc-600 ">Số điện thoại *</Label>
 <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="090..." className="h-11 mt-1 rounded-2xl bg-zinc-50 border-2 border-zinc-200 focus-visible:ring-primary/20 " />
 </div>
 <div>
 <Label className="text-xs font-semibold text-zinc-600 ">Email * (Để nhận pass phòng)</Label>
 <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" className="h-11 mt-1 rounded-2xl bg-zinc-50 border-2 border-zinc-200 focus-visible:ring-primary/20 " />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <Label className="text-xs font-semibold text-zinc-600 ">Khách</Label>
 <Input type="number" min="1" max="10" value={guests} onChange={(e) => setGuests(e.target.value)} className="h-11 mt-1 rounded-2xl bg-zinc-50 border-2 border-zinc-200 focus-visible:ring-primary/20 text-center" />
 </div>
 <div>
 <Label className="text-xs font-semibold text-zinc-600 ">Mã giảm giá</Label>
 <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Nhập mã" className="h-11 mt-1 rounded-2xl bg-zinc-50 border-2 border-zinc-200 focus-visible:ring-primary/20 uppercase" />
 </div>
 </div>
 <div>
 <Label className="text-xs font-semibold text-zinc-600 ">Xác minh CCCD *</Label>
 <div className="grid grid-cols-2 gap-2 mt-1.5">
 <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-zinc-300 rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 :bg-amber-900/10 bg-zinc-50 transition-colors">
 {frontIdFile ? (
 <div className="flex flex-col items-center text-emerald-500">
 <CheckCircle className="w-5 h-5 mb-1" />
 <span className="text-[10px] font-medium">Mặt trước OK</span>
 </div>
 ) : (
 <>
 <Upload className="w-5 h-5 text-zinc-400 mb-1" />
 <span className="text-[10px] font-medium text-zinc-500">Mặt trước</span>
 </>
 )}
 <input type="file" accept="image/*" className="hidden" onChange={(e) => setFrontIdFile(e.target.files?.[0] || null)} />
 </label>
 <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-zinc-300 rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 :bg-amber-900/10 bg-zinc-50 transition-colors">
 {backIdFile ? (
 <div className="flex flex-col items-center text-emerald-500">
 <CheckCircle className="w-5 h-5 mb-1" />
 <span className="text-[10px] font-medium">Mặt sau OK</span>
 </div>
 ) : (
 <>
 <Upload className="w-5 h-5 text-zinc-400 mb-1" />
 <span className="text-[10px] font-medium text-zinc-500">Mặt sau</span>
 </>
 )}
 <input type="file" accept="image/*" className="hidden" onChange={(e) => setBackIdFile(e.target.files?.[0] || null)} />
 </label>
 </div>
 </div>
 </div>
    <div className="flex gap-2 pt-4">
    <Button variant="outline" onClick={() => setStep("schedule")} className="w-12 h-12 rounded-xl shrink-0 p-0">
    <ArrowLeft className="w-5 h-5" />
    </Button>
    <button onClick={handleProceedToPayment} disabled={!name || !phone || !email || (!room?.isAutoCheckout && (!frontIdFile || !backIdFile))} className="btn-bubble w-full py-3.5 bg-primary text-white disabled:opacity-50 mt-6 uppercase font-bold text-sm tracking-wide">
    Tiếp tục thanh toán
    </button>
    </div>
 </div>
 )}

 {step === "payment" && (
 <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
 <div className="bg-primary/5 p-4 rounded-xl border border-primary/20/50 text-sm">
 <div className="flex justify-between mb-2"><span className="text-primary ">Phòng:</span><span className="font-bold text-primary ">{roomName}</span></div>
 <div className="flex justify-between mb-2"><span className="text-primary ">Ngày:</span><span className="font-medium text-primary ">{selectedDate}</span></div>
 <div className="flex justify-between mb-2 gap-2"><span className="text-primary shrink-0">Gói:</span><span className="font-medium text-primary text-right">{currentPkgs.map(p => p.label).join(' + ')}</span></div>
 <div className="flex justify-between mb-2"><span className="text-primary ">Thời gian:</span><span className="font-medium text-primary ">{currentPkgs[0]?.start} → {currentPkgs[currentPkgs.length - 1]?.end} {currentPkgs.some(p => p.id === 'overnight') && '(Hôm sau)'}</span></div>
 <div className="flex justify-between mt-3 pt-3 border-t border-primary/20/50 ">
 <span className="font-bold text-primary ">Tổng thanh toán:</span>
 <span className="font-bold text-lg text-primary">{formatVND(totalAmount)}</span>
 </div>
 </div>

 <div className="space-y-3">
 <h3 className="text-sm font-bold text-zinc-900 mb-2">Phương thức thanh toán</h3>
 <button onClick={() => setPaymentMethod("qr")} className={`relative w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${paymentMethod === "qr" ? "border-primary bg-primary/5/50 shadow-sm" : "border-zinc-200 hover:border-zinc-300"}`}>
 <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === "qr" ? "bg-primary/10 text-primary " : "bg-zinc-100 text-zinc-400 "}`}>
 <QrCode className="w-5 h-5" />
 </div>
 <div>
 <div className="text-sm font-bold text-zinc-900 ">QR Banking</div>
 <div className="text-xs text-zinc-500">Mở khóa cửa tự động 24/7</div>
 </div>
 </button>
 <button 
 onClick={() => isCashAllowed && setPaymentMethod("manual")} 
 disabled={!isCashAllowed}
 className={`relative w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${
 paymentMethod === "manual" ? "border-primary bg-primary/5/50 shadow-sm" 
 : !isCashAllowed ? "opacity-50 cursor-not-allowed border-zinc-200 bg-zinc-50 " 
 : "border-zinc-200 hover:border-zinc-300"
 }`}
 >
 <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === "manual" ? "bg-primary/10 text-primary " : "bg-zinc-100 text-zinc-400 "}`}>
 <Banknote className="w-5 h-5" />
 </div>
 <div>
 <div className="text-sm font-bold text-zinc-900 ">Tiền mặt / Chuyển khoản</div>
 <div className="text-xs text-zinc-500">Admin xác nhận thủ công</div>
 </div>
 {!isCashAllowed && (
 <div className="absolute inset-0 bg-white/50 rounded-xl flex items-center justify-center p-2 text-center backdrop-blur-[1px]">
 <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded">
 Chỉ hỗ trợ: {cashStartTime} - {cashEndTime}
 </span>
 </div>
 )}
 </button>
 </div>

 <div className="flex gap-2 pt-3">
 <Button variant="outline" onClick={() => setStep("form")} className="w-12 h-12 rounded-xl shrink-0 p-0" disabled={isLoading}>
 <ArrowLeft className="w-5 h-5" />
 </Button>
 <button onClick={handleSubmitBooking} disabled={isLoading} className="btn-bubble w-full py-3.5 bg-primary text-white disabled:opacity-50 mt-6 flex items-center justify-center gap-2">
 {isLoading ? "Đang tạo đơn..." : "Xác nhận & Tạo mã thanh toán"}
 </button>
 </div>
 </div>
 )}

 {step === "success" && (
 <div className="text-center py-6 animate-in fade-in zoom-in-95">
 <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
 <CheckCircle className="w-8 h-8" />
 </div>
 
 {isPaid ? (
   <>
     <h3 className="text-xl font-bold text-zinc-900 mb-2">Thanh toán thành công!</h3>
     <p className="text-sm text-zinc-500 mb-6">
       Thông tin nhận phòng và mật khẩu đã được gửi qua email của bạn. Cảm ơn bạn!
     </p>
     <Button onClick={() => window.location.reload()} className="w-full h-12 rounded-xl bg-primary text-white">
       Hoàn tất
     </Button>
   </>
 ) : (
   <>
     <h3 className="text-xl font-bold text-zinc-900 mb-2">Tuyệt vời!</h3>
     <p className="text-sm text-zinc-500 mb-2">
     Mã đơn của bạn: <strong className="text-primary bg-primary/5 px-2 py-0.5 rounded">{bookingId}</strong>
     </p>
     
     <div className="mb-6">
     {isExpired ? (
     <span className="inline-flex px-3 py-1 bg-red-100 text-red-600 font-bold rounded-lg text-sm border border-red-200 ">
     Đã hết thời gian giữ phòng. Vui lòng đặt lại!
     </span>
     ) : (
     <span className="inline-flex px-3 py-1 bg-primary/10 text-primary font-bold rounded-lg text-sm border border-primary/20 ">
     Thời gian giữ phòng: {countdownStr}
     </span>
     )}
     </div>

     {paymentMethod === "qr" && qrUrl ? (
     <div className={`bg-zinc-50 p-4 rounded-2xl mb-6 border border-zinc-200 transition-opacity ${isExpired ? 'opacity-50 grayscale' : ''}`}>
     <div className="bg-white p-2 rounded-xl inline-block mb-3 shadow-sm">
     <img src={qrUrl} alt="QR Code" className="w-48 h-48 object-contain" />
     </div>
     <p className="text-xs text-zinc-600 leading-relaxed px-2 mb-4">
     Quét mã QR bằng ứng dụng ngân hàng. Hệ thống sẽ tự động gửi <strong>mật khẩu cửa</strong> qua email ngay sau khi nhận được thanh toán.
     </p>
     {payosUrl && (
     <a href={payosUrl} target="_blank" className="btn-bubble block w-full py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors text-center font-bold text-sm">
     Hoặc mở trang thanh toán an toàn
     </a>
     )}
     </div>
     ) : (
     <div className={`text-sm text-primary bg-primary/5 p-4 rounded-xl mb-6 border border-primary/20/50 transition-opacity ${isExpired ? 'opacity-50 grayscale' : ''}`}>
     Vui lòng đợi Admin xác nhận thanh toán. Thông tin nhận phòng sẽ được gửi qua email.
     </div>
     )}

     <Button onClick={() => window.location.reload()} variant="outline" className="w-full h-12 rounded-xl">
     {isExpired ? "Đặt lại phòng khác" : "Đặt thêm giờ khác"}
     </Button>
   </>
 )}
 </div>
 )}
  <Dialog open={errorModal.isOpen} onOpenChange={(open) => !open && setErrorModal({isOpen: false, message: ""})}>
    <DialogContent className="sm:max-w-md text-center">
      <DialogHeader>
        <DialogTitle className="text-center text-red-600 flex flex-col items-center gap-2">
          <XCircle className="w-10 h-10" />
          Thông tin không hợp lệ
        </DialogTitle>
        <DialogDescription className="text-center text-base mt-2 text-zinc-600">
          {errorModal.message}
        </DialogDescription>
      </DialogHeader>
      <Button onClick={() => setErrorModal({isOpen: false, message: ""})} className="mt-4 w-full">Đã hiểu và Nhập lại</Button>
    </DialogContent>
  </Dialog>
  </div>
 );
}
