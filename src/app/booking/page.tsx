"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BedDouble,
  Phone,
  ArrowLeft,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Upload,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle,
  X,
  Sun,
  Moon,
  XCircle,
} from "lucide-react";
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
import Swal from 'sweetalert2';

// Fixed time packages
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

  return [
    { ...defaultBookingPackages[0], price: room.priceNoon ?? 260000 },
    { ...defaultBookingPackages[1], price: room.priceAfternoon ?? 260000 },
    { ...defaultBookingPackages[2], price: room.priceEvening ?? 260000 },
    { ...defaultBookingPackages[3], price: room.priceOvernight ?? 420000 },
  ].map(pkg => {
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
      if (s.surchargePct) surchargeAmt += (pkg.price * s.surchargePct) / 100;
    });

    const basePriceWithSurcharge = pkg.price + surchargeAmt;
    const { finalPrice, discount } = getDiscountedPrice(pkg.id, basePriceWithSurcharge);

    return {
      ...pkg,
      basePkgPrice: pkg.price,
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

function BookingContent() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [customDetails, setCustomDetails] = useState<any>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Check for prefill from BookingBoard
    const prefillData = localStorage.getItem('prefillBooking');
    if (prefillData) {
      try {
        const parsed = JSON.parse(prefillData);
        if (parsed.roomId && parsed.date && parsed.packageId) {
          setSelectedRoom(parsed.roomId);
          setSelectedDate(parsed.date);
          setSelectedPackages([parsed.packageId]);
          if (parsed.packageId === 'custom' && parsed.customDetails) {
            setCustomDetails(parsed.customDetails);
          }
          setStep("form");
          // Clear after use so it doesn't affect future bookings
          localStorage.removeItem('prefillBooking');
        }
      } catch (e) {
        console.error("Failed to parse prefill data", e);
      }
    } else {
      const roomIdFromUrl = searchParams.get('room') || searchParams.get('roomId');
      if (roomIdFromUrl) {
        setSelectedRoom(roomIdFromUrl);
      }
    }
  }, [searchParams]);

  const filteredRooms = useMemo(() => {
    if (!selectedFacilityId) return rooms;
    return rooms.filter(r => r.facilityId === selectedFacilityId);
  }, [rooms, selectedFacilityId]);

  useEffect(() => {
    if (filteredRooms.length > 0) {
      if (!filteredRooms.find(r => r.id === selectedRoom)) {
        setSelectedRoom(filteredRooms[0].id);
      }
    }
  }, [filteredRooms, selectedRoom]);

  const [bookedIntervals, setBookedIntervals] = useState<{ startTime: string, endTime: string }[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [step, setStep] = useState<"schedule" | "form" | "payment" | "success">("schedule");
  const [paymentMethod, setPaymentMethod] = useState<"qr" | "manual">("qr");

  const currentRoom = useMemo(() => rooms.find((r: any) => r.id === selectedRoom), [rooms, selectedRoom]);
  const [surcharges, setSurcharges] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/surcharges?t=${Date.now()}`).then(res => res.json()).then(data => {
      setSurcharges(data);
    }).catch(console.error);
  }, []);

  const bookingPackages = useMemo(() => getBookingPackages(currentRoom, selectedDate, surcharges), [currentRoom, selectedDate, surcharges]);

  const currentPkgs = useMemo(() => {
    return bookingPackages.filter(p => selectedPackages.includes(p.id));
  }, [selectedPackages, bookingPackages]);



  const groupedProducts = useMemo(() => {
    const groups: Record<string, any[]> = {};
    if (Array.isArray(products)) {
      products.forEach(p => {
        const catName = p.category?.name || "Khác";
        if (!groups[catName]) groups[catName] = [];
        groups[catName].push(p);
      });
    }
    return groups;
  }, [products]);

  const updateProductQuantity = (pid: string, delta: number) => {
    setSelectedProducts(prev => {
      const p = products.find(x => x.id === pid);
      const max = p?.maxQuantity || 99; // Dùng maxQuantity làm limit
      const current = prev[pid] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      if (next === 0) {
        const nextObj = { ...prev };
        delete nextObj[pid];
        return nextObj;
      }
      return { ...prev, [pid]: next };
    });
  };

  const [couponCode, setCouponCode] = useState("");
  const [payosUrl, setPayosUrl] = useState<string | null>(null);
  const [idCardFiles, setIdCardFiles] = useState<{ front: File | null, back: File | null }[]>([{ front: null, back: null }]);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean, message: string }>({ isOpen: false, message: "" });
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discount2, setDiscount2] = useState(5);
  const [discount3, setDiscount3] = useState(10);
  const [discount4, setDiscount4] = useState(15);
  
  const [earlyBookingDays, setEarlyBookingDays] = useState<number>(0);
  const [earlyBookingDiscountPct, setEarlyBookingDiscountPct] = useState<number>(0);

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [guests, setGuests] = useState("2");
  const [notes, setNotes] = useState("");
  const [bankPrefix, setBankPrefix] = useState("");
  const [homestayName, setHomestayName] = useState("");
  const [bankBin, setBankBin] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [hotline, setHotline] = useState("0901 234 567");
  const [cashStartTime, setCashStartTime] = useState<string | null>(null);
  const [cashEndTime, setCashEndTime] = useState<string | null>(null);
  const [isCashAllowed, setIsCashAllowed] = useState(true);

  const roomSubtotalObj = useMemo(() => {
    let guestSurchargeAmt = 0;
    const gCount = parseInt(guests) || 2;
    if (gCount === 3) guestSurchargeAmt = 50000;
    else if (gCount === 4) guestSurchargeAmt = 100000;

    if (customDetails) {
      return {
        final: customDetails.price + guestSurchargeAmt,
        original: customDetails.originalPrice,
        consecutivePct: 0,
        consecutiveDiscountAmt: 0,
        totalDiscount: customDetails.discount,
        guestSurchargeAmt
      };
    }

    let baseSum = currentPkgs.reduce((sum, pkg) => sum + pkg.price, 0);
    let originalSum = currentPkgs.reduce((sum, pkg) => sum + ((pkg as any).originalPrice || pkg.price), 0);
    let consecutivePct = 0;
    
    if (currentPkgs.length === 2) consecutivePct = discount2;
    if (currentPkgs.length === 3) consecutivePct = discount3;
    if (currentPkgs.length >= 4) consecutivePct = discount4;

    let earlyBookingDiscountAmt = 0;
    let earlyBookingPct = 0;
    if (selectedDate && earlyBookingDays > 0 && earlyBookingDiscountPct > 0) {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const bookingDate = new Date(selectedDate);
      const diffTime = bookingDate.getTime() - todayDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= earlyBookingDays) {
        earlyBookingPct = earlyBookingDiscountPct;
        earlyBookingDiscountAmt = (baseSum * earlyBookingDiscountPct) / 100;
      }
    }

    const consecutiveDiscountAmt = (baseSum * consecutivePct) / 100;
    


    const finalSubtotal = baseSum - consecutiveDiscountAmt - earlyBookingDiscountAmt + guestSurchargeAmt;
    
    return {
      final: finalSubtotal,
      original: originalSum,
      consecutivePct,
      consecutiveDiscountAmt,
      earlyBookingPct,
      earlyBookingDiscountAmt,
      guestSurchargeAmt,
      totalDiscount: originalSum - (baseSum - consecutiveDiscountAmt - earlyBookingDiscountAmt)
    };
  }, [currentPkgs, customDetails, discount2, discount3, discount4, selectedDate, earlyBookingDays, earlyBookingDiscountPct, guests]);

  // Determine if multi-CCCD is required (evening or overnight selected)
  const requiresMultiCCCD = useMemo(() => {
    if (customDetails) {
      // For custom bookings from the board, check the time
      const startTime = new Date(customDetails.startTime);
      const startHour = startTime.getHours();
      return startHour >= 18; // 18:00 onwards = evening or overnight
    }
    return selectedPackages.some(pkgId => pkgId === 'evening' || pkgId === 'overnight');
  }, [selectedPackages, customDetails]);

  // Sync idCardFiles array length with guest count when multi-CCCD is required
  useEffect(() => {
    const guestCount = parseInt(guests) || 1;
    const requiredCount = requiresMultiCCCD ? guestCount : 1;
    
    setIdCardFiles(prev => {
      if (prev.length === requiredCount) return prev;
      if (prev.length < requiredCount) {
        // Add more empty entries
        return [...prev, ...Array.from({ length: requiredCount - prev.length }, () => ({ front: null, back: null }))];
      }
      // Trim excess entries
      return prev.slice(0, requiredCount);
    });
  }, [guests, requiresMultiCCCD]);
  
  const roomSubtotal = roomSubtotalObj.final;
  const roomOriginalSubtotal = roomSubtotalObj.original;
  const roomDiscountTotal = roomSubtotalObj.totalDiscount;
  const productsSubtotal = useMemo(() => {
    let sum = 0;
    Object.keys(selectedProducts).forEach(pid => {
      const p = products.find(x => x.id === pid);
      if (p) sum += (p.price * selectedProducts[pid]);
    });
    return sum;
  }, [selectedProducts, products]);

  const subTotalBeforeCoupon = roomSubtotal + productsSubtotal;

  const couponDiscountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountPct) {
      return (subTotalBeforeCoupon * appliedCoupon.discountPct) / 100;
    }
    return appliedCoupon.discountAmt || 0;
  }, [appliedCoupon, subTotalBeforeCoupon]);

  const totalAmount = Math.max(0, subTotalBeforeCoupon - couponDiscountAmount);



  useEffect(() => {
    fetch(`/api/settings?t=${Date.now()}`).then(res => res.json()).then(data => {
      if (data.bank_bin) setBankBin(data.bank_bin);
      if (data.bank_account_no) setBankAccount(data.bank_account_no);
      if (data.bank_account_name) setBankAccountName(data.bank_account_name);
      if (data.bank_prefix) setBankPrefix(data.bank_prefix);
      if (data.homestay_name) setHomestayName(data.homestay_name);
      if (data.hotline) setHotline(data.hotline);
      if (data.cash_payment_start_time) setCashStartTime(data.cash_payment_start_time);
      if (data.cash_payment_end_time) setCashEndTime(data.cash_payment_end_time);
      if (data.early_booking_days) setEarlyBookingDays(Number(data.early_booking_days));
      if (data.early_booking_discount_pct) setEarlyBookingDiscountPct(Number(data.early_booking_discount_pct));
      if (data.discount_2_slots !== undefined) setDiscount2(data.discount_2_slots);
      if (data.discount_3_slots !== undefined) setDiscount3(data.discount_3_slots);
      if (data.discount_4_slots !== undefined) setDiscount4(data.discount_4_slots);
    }).catch(console.error);
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

  // API states
  const [isLoading, setIsLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<string>("PENDING_PAYMENT");

  const [countdownStr, setCountdownStr] = useState<string>("10:00");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (step === "success") {
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

      let eventSource: EventSource | null = null;
      if (bookingId && bookingStatus === "PENDING_PAYMENT") {
        eventSource = new EventSource(`/api/bookings/${bookingId}/stream`);
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "BOOKING_UPDATED" && data.payload && data.payload.status !== "PENDING_PAYMENT") {
              setBookingStatus(data.payload.status);
              eventSource?.close();
            }
          } catch (e) {
            console.error("SSE parse error", e);
          }
        };
      }

      return () => {
        clearInterval(interval);
        if (eventSource) eventSource.close();
      };
    }
  }, [step, paymentMethod, bookingId, bookingStatus]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [roomsRes, productsRes, facilitiesRes] = await Promise.all([
          fetch('/api/rooms'),
          fetch('/api/products'),
          fetch('/api/facilities')
        ]);
        const roomsData = await roomsRes.json();
        const productsData = await productsRes.json();
        const facilitiesData = await facilitiesRes.json();
        const rData = Array.isArray(roomsData) ? roomsData : (roomsData.data || []);
        const pData = Array.isArray(productsData) ? productsData : (productsData.data || []);
        setRooms(rData);
        setProducts(pData);
        if (facilitiesData.success) {
          setFacilities(facilitiesData.data);
        }

        if (rData.length > 0) {
          setSelectedRoom(prev => prev || rData[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedRoom || !selectedDate) return;
    const fetchAvailability = async () => {
      try {
        const res = await fetch(`/api/rooms/availability?roomId=${selectedRoom}&date=${selectedDate}`);
        const data = await res.json();
        if (data.bookedIntervals) {
          setBookedIntervals(data.bookedIntervals);
        } else {
          setBookedIntervals([]);
        }
      } catch (e) {
        setBookedIntervals([]);
      }
    };
    fetchAvailability();
  }, [selectedDate, selectedRoom]);

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
      setErrorModal({ isOpen: true, message: "Số điện thoại không hợp lệ! Vui lòng nhập từ 9-12 chữ số." });
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorModal({ isOpen: true, message: "Định dạng email chưa đúng (Ví dụ: ten@gmail.com)." });
      return;
    }
    setStep("payment");
  };

  const isPackageAvailable = (pkg: any) => {
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

  const handleSubmitBooking = async () => {
    if (selectedPackages.length === 0 || !selectedDate) return;
    try {
      setIsLoading(true);

      // Upload all CCCD files
      const uploadedIdCards: { frontUrl: string | null, backUrl: string | null }[] = [];
      for (const card of idCardFiles) {
        let frontUrl: string | null = null;
        let backUrl: string | null = null;
        if (card.front) {
          const formData = new FormData();
          formData.append("file", card.front);
          const res = await fetch("/api/upload-public", { method: "POST", body: formData });
          const data = await res.json();
          if (data.url) frontUrl = data.url;
        }
        if (card.back) {
          const formData = new FormData();
          formData.append("file", card.back);
          const res = await fetch("/api/upload-public", { method: "POST", body: formData });
          const data = await res.json();
          if (data.url) backUrl = data.url;
        }
        uploadedIdCards.push({ frontUrl, backUrl });
      }

      // Backward-compatible: first guest's CCCD
      const frontIdUrl = uploadedIdCards[0]?.frontUrl || null;
      const backIdUrl = uploadedIdCards[0]?.backUrl || null;

      let pkgStartIso = "";
      let pkgEndIso = "";
      let priceToSubmit = roomSubtotal;

      if (customDetails) {
        pkgStartIso = customDetails.startTime;
        pkgEndIso = customDetails.endTime;
      } else {
        const startPkg = bookingPackages.find(p => p.id === selectedPackages[0]);
        const endPkg = bookingPackages.find(p => p.id === selectedPackages[selectedPackages.length - 1]);
        if (!startPkg || !endPkg) throw new Error("Package not found");

        const pkgStart = new Date(`${selectedDate}T${startPkg.start}:00+07:00`);
        const pkgEndObj = new Date(`${selectedDate}T${endPkg.end}:00+07:00`);
        if (endPkg.id === 'overnight') {
          pkgEndObj.setDate(pkgEndObj.getDate() + 1);
        }
        pkgStartIso = pkgStart.toISOString();
        pkgEndIso = pkgEndObj.toISOString();
      }

      const productItems = Object.entries(selectedProducts)
        .filter(([_, qty]) => qty > 0)
        .map(([pid, qty]) => {
          const p = products.find(x => x.id === pid);
          return { productId: pid, quantity: qty, price: p?.price || 0 };
        });

      const payload = {
        roomId: selectedRoom,
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        numGuests: parseInt(guests),
        notes,
        frontIdCardUrl: frontIdUrl,
        backIdCardUrl: backIdUrl,
        idCards: uploadedIdCards,
        startTime: pkgStartIso,
        endTime: pkgEndIso,
        price: priceToSubmit,
        totalAmount: totalAmount,
        paymentMethod: paymentMethod === "qr" ? "QR_BANKING" : "MANUAL",
        products: productItems,
        couponId: appliedCoupon?.id || null
      };


      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success || data.id || data.data?.bookingId) {
        setBookingId(data.data?.bookingId || data.id);
        if (data.data?.qrUrl) setQrUrl(data.data.qrUrl);
        if (data.data?.payosUrl) setPayosUrl(data.data.payosUrl);
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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      Swal.fire('Lỗi', 'Vui lòng nhập mã giảm giá', 'warning');
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon(data.data);
        Swal.fire('Thành công', 'Áp dụng mã giảm giá thành công!', 'success');
      } else {
        Swal.fire('Lỗi', data.error || 'Mã không hợp lệ', 'error');
        setAppliedCoupon(null);
      }
    } catch (e) {
      Swal.fire('Lỗi', 'Có lỗi xảy ra', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setSelectedPackages([]);
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-zinc-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-2 text-zinc-600 hover:text-primary transition-colors uppercase font-light tracking-widest text-xs">
            <ArrowLeft className="w-4 h-4" />
            <span>QUAY LẠI</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 border border-primary flex items-center justify-center text-primary bg-zinc-50 hover:bg-primary hover:text-white transition-colors">
              <BedDouble strokeWidth={1} className="w-5 h-5" />
            </div>
          </Link>
          <a href={`tel:${hotline.replace(/\s+/g, '')}`} className="flex items-center gap-2 text-xs font-light tracking-[0.1em] uppercase transition-colors hover:text-primary text-zinc-900">
            <Phone strokeWidth={1} className="w-4 h-4" />
            <span className="hidden sm:inline font-oswald">{hotline}</span>
          </a>
        </div>
      </header>

      <div className="pt-32 pb-16 max-w-5xl mx-auto px-4 sm:px-6">
        {/* Steps indicator */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-12 font-oswald uppercase tracking-widest text-xs">
          {[
            { key: "schedule", label: "01. CHỌN LỊCH" },
            { key: "form", label: "02. THÔNG TIN" },
            { key: "payment", label: "03. THANH TOÁN" },
          ].map((s, idx) => {
            const isPast = idx < ["schedule", "form", "payment"].indexOf(step);
            const isCurrent = step === s.key;
            return (
              <div key={s.key} className="flex items-center gap-4 sm:gap-8">
                <div
                  className={`flex items-center gap-2 transition-colors ${isCurrent
                      ? "text-primary border-b border-primary pb-1"
                      : isPast
                        ? "text-zinc-900"
                        : "text-zinc-400"
                    }`}
                >
                  <span>{s.label}</span>
                </div>
                {idx < 2 && <div className="hidden sm:block w-8 h-px bg-zinc-300" />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Schedule */}
        {step === "schedule" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calendar */}
            <div className="border border-zinc-200 bg-white p-6 md:p-8">
              <div className="mb-4">
                <Label className="font-oswald uppercase tracking-widest text-xs text-zinc-500 mb-2 block">CƠ SỞ (TÙY CHỌN)</Label>
                <select
                  className="w-full flex h-12 border-b border-zinc-300 bg-transparent px-0 py-2 text-lg font-oswald uppercase tracking-wider text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  value={selectedFacilityId}
                  onChange={(e) => {
                    setSelectedFacilityId(e.target.value);
                  }}
                >
                  <option value="">-- TẤT CẢ CƠ SỞ --</option>
                  {facilities.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-8">
                <Label className="font-oswald uppercase tracking-widest text-xs text-zinc-500 mb-2 block">PHÒNG BẠN CHỌN</Label>
                <select
                  className="w-full flex h-12 border-b border-zinc-300 bg-transparent px-0 py-2 text-lg font-oswald uppercase tracking-wider text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  value={selectedRoom}
                  onChange={(e) => {
                    setSelectedRoom(e.target.value);
                    setSelectedPackages([]);
                  }}
                >
                  <option value="" disabled>-- CHỌN PHÒNG --</option>
                  {filteredRooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name} - TỪ {(r.priceNoon ?? 260000).toLocaleString()}Đ</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200">
                <button onClick={prevMonth} className="w-10 h-10 flex items-center justify-center border border-zinc-200 hover:bg-primary hover:text-white hover:border-primary transition-colors">
                  <ChevronLeft strokeWidth={1} className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-oswald uppercase tracking-widest text-zinc-900">
                  {monthNames[currentMonth]} {currentYear}
                </h3>
                <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center border border-zinc-200 hover:bg-primary hover:text-white hover:border-primary transition-colors">
                  <ChevronRight strokeWidth={1} className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-px bg-zinc-200 border border-zinc-200 mb-px">
                {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
                  <div key={d} className="py-3 bg-zinc-50 text-center text-xs font-oswald uppercase tracking-widest text-zinc-500">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px bg-zinc-200 border border-zinc-200">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-white" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isSelected = selectedDate === dateStr;
                  const isPast = new Date(dateStr) < new Date(today.toDateString());
                  
                  const maxDate = new Date();
                  maxDate.setMonth(today.getMonth() + 2);
                  maxDate.setHours(23, 59, 59, 999);
                  const isTooFar = new Date(dateStr) > maxDate;
                  const isDisabled = isPast || isTooFar;

                  return (
                    <button
                      key={day}
                      disabled={isDisabled}
                      onClick={() => handleDateSelect(day)}
                      className={`aspect-square flex flex-col items-center justify-center font-oswald text-lg transition-colors ${isDisabled
                          ? "bg-zinc-50 text-zinc-300 cursor-not-allowed"
                          : isSelected
                            ? "bg-primary text-white"
                            : "bg-white text-zinc-900 hover:bg-zinc-100"
                        }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            <div className="border border-zinc-200 bg-white p-6 md:p-8">
              <h3 className="text-xl font-oswald uppercase tracking-widest text-zinc-900 mb-6 border-b border-zinc-200 pb-4">
                {selectedDate ? `GÓI GIỜ NGÀY ${selectedDate.split('-').reverse().join('/')}` : "CHỌN NGÀY BÊN TRÁI"}
              </h3>

              {selectedDate ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {bookingPackages.map((pkg) => {
                      const isAvailable = isPackageAvailable(pkg);
                      const isSelected = selectedPackages.includes(pkg.id);

                      return (
                        <button
                          key={pkg.id}
                          disabled={!isAvailable}
                          onClick={() => handlePackageToggle(pkg.id)}
                          className={`relative flex flex-col justify-center items-center py-6 border transition-colors ${!isAvailable
                              ? "bg-zinc-50 border-zinc-200 text-zinc-300 cursor-not-allowed"
                              : isSelected
                                ? "bg-primary border-primary text-white"
                                : "bg-white border-zinc-200 text-zinc-900 hover:border-primary hover:text-primary"
                            }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-oswald text-lg tracking-widest uppercase">{pkg.label}</span>
                            {pkg.icon === 'sun' ? <Sun strokeWidth={1} className="w-5 h-5" /> : <Moon strokeWidth={1} className="w-5 h-5" />}
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
                          <span className={`text-sm tracking-widest ${isSelected ? 'text-white' : 'text-primary'}`}>
                            {formatVND(pkg.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-300 border border-dashed border-zinc-200">
                  <Calendar strokeWidth={1} className="w-12 h-12 mb-4" />
                  <p className="text-xs font-light tracking-widest uppercase">VUI LÒNG CHỌN NGÀY VÀ PHÒNG</p>
                </div>
              )}

              {selectedPackages.length > 0 && (
                <div className="mt-8 p-6 bg-zinc-50 border border-zinc-200 space-y-4">
                  <div className="flex items-center justify-between text-zinc-600 font-light tracking-widest text-xs uppercase">
                    <span>Giá phòng {currentPkgs.some((p: any) => p.surchargeAmt > 0) ? '(Đã bao gồm phụ thu)' : ''}:</span>
                    <span className="font-oswald text-sm text-zinc-900">
                      {formatVND(roomOriginalSubtotal)}
                    </span>
                  </div>

                  {roomDiscountTotal - (roomSubtotalObj.earlyBookingDiscountAmt || 0) > 0 ? (
                    <div className="flex items-center justify-between text-primary font-light tracking-widest text-xs uppercase">
                      <span>Giảm giá {roomSubtotalObj.consecutivePct > 0 ? `(Bao gồm xếp ca ${roomSubtotalObj.consecutivePct}%)` : ''}:</span>
                      <span className="font-oswald text-sm">- {formatVND(roomDiscountTotal - (roomSubtotalObj.earlyBookingDiscountAmt || 0))}</span>
                    </div>
                  ) : null}

                  {(roomSubtotalObj.earlyBookingDiscountAmt || 0) > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 font-light tracking-widest text-xs uppercase">
                      <span>Đặt sớm (-{roomSubtotalObj.earlyBookingPct}%):</span>
                      <span className="font-oswald text-sm">- {formatVND(roomSubtotalObj.earlyBookingDiscountAmt || 0)}</span>
                    </div>
                  )}

                  {(roomSubtotalObj.guestSurchargeAmt || 0) > 0 && (
                    <div className="flex items-center justify-between text-red-600 font-light tracking-widest text-xs uppercase">
                      <span>Phụ thu khách ({guests} người):</span>
                      <span className="font-oswald text-sm">+ {formatVND(roomSubtotalObj.guestSurchargeAmt || 0)}</span>
                    </div>
                  )}

                  {productsSubtotal > 0 && (
                    <div className="flex items-center justify-between text-zinc-600 font-light tracking-widest text-xs uppercase">
                      <span>Sản phẩm/Dịch vụ:</span>
                      <span className="font-oswald text-sm text-zinc-900">{formatVND(productsSubtotal)}</span>
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-primary font-light tracking-widest text-xs uppercase">
                      <span>Mã giảm giá ({appliedCoupon.code}):</span>
                      <span className="font-oswald text-sm">- {formatVND(couponDiscountAmount)}</span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-zinc-200 flex items-center justify-between">
                    <span className="font-oswald uppercase tracking-widest text-zinc-900">TỔNG CỘNG:</span>
                    <span className="text-2xl font-oswald text-primary">{formatVND(totalAmount)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 mt-8">
              <button
                onClick={() => setStep("form")}
                disabled={selectedPackages.length === 0}
                className="w-full py-5 bg-primary border border-primary text-white text-sm font-bold uppercase tracking-[0.2em] hover:bg-zinc-900 hover:border-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                TIẾP TỤC ĐIỀN THÔNG TIN
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Customer Form */}
        {step === "form" && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="border border-zinc-200 bg-white p-6 md:p-8">
              <h3 className="text-xl font-oswald uppercase tracking-widest text-zinc-900 mb-6 border-b border-zinc-200 pb-4">01. THÔNG TIN KHÁCH HÀNG</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="font-oswald uppercase tracking-widest text-xs text-zinc-500 mb-2 block">Họ và tên *</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" className="rounded-none border-zinc-300 focus:border-primary h-12" />
                </div>
                <div>
                  <Label htmlFor="phone" className="font-oswald uppercase tracking-widest text-xs text-zinc-500 mb-2 block">Số điện thoại *</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0912345678"
                    className="rounded-none border-zinc-300 focus:border-primary h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="font-oswald uppercase tracking-widest text-xs text-zinc-500 mb-2 block">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="rounded-none border-zinc-300 focus:border-primary h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="guests" className="font-oswald uppercase tracking-widest text-xs text-zinc-500 mb-2 block">Số lượng khách</Label>
                  <Input 
                    id="guests" 
                    type="number" 
                    min="1" 
                    max="4" 
                    value={guests} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val > 4) {
                        Swal.fire({
                          title: 'Vượt quá số lượng',
                          text: `Nếu muốn đi trên 4 người vui lòng liên hệ với home qua hotline: ${hotline}`,
                          icon: 'info',
                          confirmButtonColor: '#ea580c'
                        });
                        setGuests("4");
                      } else if (val < 1) {
                        setGuests("1");
                      } else {
                        setGuests(e.target.value);
                      }
                    }} 
                    className="rounded-none border-zinc-300 focus:border-primary h-12" 
                  />
                  {parseInt(guests) === 3 && (
                    <p className="text-[10px] text-red-500 mt-1 italic tracking-wide">* Khi đi 3 người, home phụ thu thêm 50k</p>
                  )}
                  {parseInt(guests) === 4 && (
                    <p className="text-[10px] text-red-500 mt-1 italic tracking-wide">* Khi đi 4 người, home phụ thu thêm 100k</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <Label htmlFor="notes" className="font-oswald uppercase tracking-widest text-xs text-zinc-500 mb-2 block">Ghi chú</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Yêu cầu đặc biệt (nếu có)..." className="rounded-none border-zinc-300 focus:border-primary" rows={3} />
              </div>
            </div>

            <div className="border border-zinc-200 bg-white p-6 md:p-8">
              <h3 className="text-xl font-oswald uppercase tracking-widest text-zinc-900 mb-2">02. UPLOAD CCCD</h3>
              <p className="text-xs font-light tracking-widest text-zinc-500 uppercase mb-6 pb-4 border-b border-zinc-200">
                {requiresMultiCCCD && parseInt(guests) > 1
                  ? `Khung giờ tối/qua đêm yêu cầu upload CCCD cho tất cả ${guests} khách.`
                  : 'Vui lòng upload ảnh CCCD mặt trước và mặt sau để xác minh.'
                }
              </p>
              <div className="space-y-8">
                {idCardFiles.map((card, idx) => (
                  <div key={idx}>
                    {idCardFiles.length > 1 && (
                      <h4 className="font-oswald uppercase tracking-widest text-sm text-zinc-900 mb-4 pb-2 border-b border-zinc-100">
                        CCCD KHÁCH {idx + 1}
                      </h4>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="font-oswald uppercase tracking-widest text-xs text-zinc-500 mb-2 block">
                          Mặt trước {idCardFiles.length > 1 ? `(Khách ${idx + 1})` : ''} *
                        </Label>
                        <label className="flex flex-col items-center justify-center h-40 border border-dashed border-zinc-300 bg-zinc-50 hover:bg-zinc-100 hover:border-primary transition-colors cursor-pointer">
                          {card.front ? (
                            <div className="flex items-center gap-2 text-sm text-primary font-oswald tracking-widest uppercase">
                              <CheckCircle strokeWidth={1} className="w-5 h-5" />
                              <span className="truncate max-w-[150px]">{card.front.name}</span>
                            </div>
                          ) : (
                            <>
                              <Upload strokeWidth={1} className="w-6 h-6 text-zinc-400 mb-3" />
                              <span className="font-oswald uppercase tracking-widest text-xs text-zinc-500">CLICK ĐỂ UPLOAD</span>
                            </>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setIdCardFiles(prev => prev.map((c, i) => i === idx ? { ...c, front: file } : c));
                          }} />
                        </label>
                      </div>
                      <div>
                        <Label className="font-oswald uppercase tracking-widest text-xs text-zinc-500 mb-2 block">
                          Mặt sau {idCardFiles.length > 1 ? `(Khách ${idx + 1})` : ''} *
                        </Label>
                        <label className="flex flex-col items-center justify-center h-40 border border-dashed border-zinc-300 bg-zinc-50 hover:bg-zinc-100 hover:border-primary transition-colors cursor-pointer">
                          {card.back ? (
                            <div className="flex items-center gap-2 text-sm text-primary font-oswald tracking-widest uppercase">
                              <CheckCircle strokeWidth={1} className="w-5 h-5" />
                              <span className="truncate max-w-[150px]">{card.back.name}</span>
                            </div>
                          ) : (
                            <>
                              <Upload strokeWidth={1} className="w-6 h-6 text-zinc-400 mb-3" />
                              <span className="font-oswald uppercase tracking-widest text-xs text-zinc-500">CLICK ĐỂ UPLOAD</span>
                            </>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setIdCardFiles(prev => prev.map((c, i) => i === idx ? { ...c, back: file } : c));
                          }} />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-zinc-200 bg-white p-6 md:p-8">
              <h3 className="text-xl font-oswald uppercase tracking-widest text-zinc-900 mb-2">03. SẢN PHẨM & DỊCH VỤ</h3>
              <p className="text-xs font-light tracking-widest text-zinc-500 uppercase mb-6 pb-4 border-b border-zinc-200">Mua thêm đồ ăn, thức uống hoặc các dịch vụ khác (Số lượng order bị giới hạn).</p>
              {Object.keys(groupedProducts).length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(groupedProducts).map(([catName, prods]) => (
                    <div key={catName}>
                      <h4 className="font-oswald uppercase tracking-widest text-sm text-zinc-900 mb-4">{catName}</h4>
                      <div className="grid grid-cols-1 gap-4">
                        {prods.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-4 border border-zinc-200 bg-white">
                            <div className="flex items-center gap-4">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-16 h-16 object-cover" />
                              ) : (
                                <div className="w-16 h-16 bg-zinc-100 flex items-center justify-center text-zinc-400 text-xs font-oswald tracking-widest">ẢNH</div>
                              )}
                              <div>
                                <p className="font-oswald uppercase tracking-wider text-sm text-zinc-900 mb-1">{p.name}</p>
                                <p className="text-xs text-primary font-bold tracking-widest">{p.price.toLocaleString('vi-VN')} Đ</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                className="w-8 h-8 border border-zinc-200 flex items-center justify-center hover:bg-zinc-100 transition-colors disabled:opacity-50"
                                onClick={() => updateProductQuantity(p.id, -1)}
                                disabled={!(selectedProducts[p.id] > 0)}
                              >
                                <ChevronLeft strokeWidth={1} className="w-4 h-4" />
                              </button>
                              <span className="w-6 text-center font-oswald">{selectedProducts[p.id] || 0}</span>
                              <button
                                className="w-8 h-8 border border-zinc-200 flex items-center justify-center hover:bg-zinc-100 transition-colors disabled:opacity-50"
                                onClick={() => updateProductQuantity(p.id, 1)}
                                disabled={(selectedProducts[p.id] || 0) >= (p.maxQuantity || 99)}
                              >
                                <ChevronRight strokeWidth={1} className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs font-light tracking-widest uppercase text-zinc-500">Chưa có sản phẩm / dịch vụ nào.</div>
              )}
            </div>

            <div className="border border-zinc-200 bg-white p-6 md:p-8">
              <Label htmlFor="coupon" className="font-oswald uppercase tracking-widest text-xs text-zinc-500 mb-2 block">04. MÁ GIẢM GIÁ</Label>
              <div className="flex gap-2">
                <Input id="coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="NHẬP MÃ GIẢM GIÁ" disabled={!!appliedCoupon} className="rounded-none border-zinc-300 focus:border-primary h-12 uppercase tracking-widest font-oswald" />
                {appliedCoupon ? (
                  <Button variant="outline" className="shrink-0 h-12 rounded-none border-red-500 text-red-500 hover:bg-red-50 uppercase font-oswald tracking-widest text-xs" onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}>HỦY MÃ</Button>
                ) : (
                  <Button variant="outline" className="shrink-0 h-12 rounded-none border-primary text-primary hover:bg-primary/5 uppercase font-oswald tracking-widest text-xs" onClick={handleApplyCoupon} disabled={isLoading}>ÁP DỤNG</Button>
                )}
              </div>
              {appliedCoupon && <p className="text-xs tracking-widest uppercase text-primary mt-3 font-medium border-t border-zinc-100 pt-3">Đã áp dụng mã {appliedCoupon.code} giảm {formatVND(couponDiscountAmount)}</p>}
            </div>

            <div className="p-6 md:p-8 bg-zinc-50 border border-zinc-200 space-y-4">
              <div className="flex items-center justify-between text-zinc-600 font-light tracking-widest text-xs uppercase">
                <span>Giá phòng gốc:</span>
                <span className="font-oswald text-sm text-zinc-900">
                  {formatVND(roomOriginalSubtotal || 0)}
                </span>
              </div>

              {roomDiscountTotal > 0 && (
                <div className="flex items-center justify-between text-primary font-light tracking-widest text-xs uppercase">
                  <span>Giảm giá phòng:</span>
                  <span className="font-oswald text-sm">- {formatVND(roomDiscountTotal)}</span>
                </div>
              )}

              {(roomSubtotalObj.guestSurchargeAmt || 0) > 0 && (
                <div className="flex items-center justify-between text-red-600 font-light tracking-widest text-xs uppercase">
                  <span>Phụ thu khách ({guests} người):</span>
                  <span className="font-oswald text-sm">+ {formatVND(roomSubtotalObj.guestSurchargeAmt || 0)}</span>
                </div>
              )}

              {productsSubtotal > 0 && (
                <div className="flex items-center justify-between text-zinc-600 font-light tracking-widest text-xs uppercase">
                  <span>Sản phẩm/Dịch vụ:</span>
                  <span className="font-oswald text-sm text-zinc-900">{formatVND(productsSubtotal)}</span>
                </div>
              )}

              {appliedCoupon && (
                <div className="flex items-center justify-between text-primary font-light tracking-widest text-xs uppercase">
                  <span>Mã giảm giá ({appliedCoupon.code}):</span>
                  <span className="font-oswald text-sm">- {formatVND(couponDiscountAmount)}</span>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-200 flex items-center justify-between">
                <span className="font-oswald uppercase tracking-widest text-zinc-900">TỔNG CỘNG:</span>
                <span className="text-2xl font-oswald text-primary">{formatVND(totalAmount)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" onClick={() => setStep("schedule")} className="h-16 rounded-none border-zinc-200 font-oswald uppercase tracking-widest text-xs text-zinc-600 hover:bg-zinc-50 flex-1">
                <ArrowLeft strokeWidth={1} className="w-4 h-4 mr-2" /> QUAY LẠI
              </Button>
              <button
                onClick={handleProceedToPayment}
                disabled={!name || !phone}
                className="h-16 bg-primary border border-primary text-white text-sm font-bold uppercase tracking-[0.2em] hover:bg-zinc-900 hover:border-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1"
              >
                TIẾP TỤC THANH TOÁN
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === "payment" && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="border border-zinc-200 bg-white p-6 md:p-8">
              <h3 className="text-xl font-oswald uppercase tracking-widest text-zinc-900 mb-6 border-b border-zinc-200 pb-4">01. THÔNG TIN ĐƠN HÀNG</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-zinc-100 text-sm"><span className="font-oswald uppercase tracking-widest text-xs text-zinc-500">PHÒNG:</span><span className="font-oswald uppercase tracking-widest text-zinc-900">{currentRoom?.name}</span></div>
                <div className="flex justify-between items-center pb-4 border-b border-zinc-100 text-sm"><span className="font-oswald uppercase tracking-widest text-xs text-zinc-500">NGÀY:</span><span className="font-oswald uppercase tracking-widest text-zinc-900">{selectedDate?.split("-").reverse().join("/")}</span></div>
                <div className="flex justify-between items-center pb-4 border-b border-zinc-100 text-sm"><span className="font-oswald uppercase tracking-widest text-xs text-zinc-500">GÓI GIỜ:</span><span className="font-oswald uppercase tracking-widest text-zinc-900">{customDetails ? customDetails.label : currentPkgs.map(p => p.label).join(', ')}</span></div>
                {customDetails && customDetails.discount > 0 && (
                  <div className="flex justify-between text-primary font-medium"><span>Khuyến mãi:</span><span>- {customDetails.discount.toLocaleString('vi-VN')} Đ</span></div>
                )}
                {Object.keys(selectedProducts).length > 0 && (
                  <>
                    <div className="text-xs font-oswald uppercase tracking-widest text-zinc-500 mb-2 mt-4">SẢN PHẨM & DỊCH VỤ:</div>
                    {Object.entries(selectedProducts).map(([pid, qty]) => {
                      if (qty === 0) return null;
                      const p = products.find(x => x.id === pid);
                      if (!p) return null;
                      return (
                        <div key={pid} className="flex justify-between text-zinc-600 text-sm mb-2">
                          <span className="font-oswald uppercase tracking-wider">{qty}x {p.name}</span>
                          <span className="font-oswald">{(p.price * qty).toLocaleString('vi-VN')} Đ</span>
                        </div>
                      );
                    })}
                  </>
                )}
                <div className="pt-4 flex justify-between font-bold text-lg items-center">
                  <span className="font-oswald uppercase tracking-widest text-zinc-900">TỔNG CỘNG:</span>
                  <span className="font-oswald text-2xl text-primary">{totalAmount.toLocaleString('vi-VN')} Đ</span>
                </div>
              </div>
            </div>

            <div className="border border-zinc-200 bg-white p-6 md:p-8">
              <h3 className="text-xl font-oswald uppercase tracking-widest text-zinc-900 mb-6 border-b border-zinc-200 pb-4">02. PHƯƠNG THỨC THANH TOÁN</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod("qr")}
                  className={`p-6 border text-left transition-colors flex flex-col items-start ${paymentMethod === "qr"
                      ? "border-primary bg-primary text-white"
                      : "border-zinc-200 bg-white hover:border-primary text-zinc-900"
                    }`}
                >
                  <QrCode strokeWidth={1} className={`w-8 h-8 mb-4 ${paymentMethod === "qr" ? "text-white" : "text-zinc-400"}`} />
                  <p className="font-oswald uppercase tracking-widest text-sm mb-1">QR BANKING</p>
                  <p className={`text-xs font-light tracking-widest uppercase ${paymentMethod === "qr" ? "text-white/80" : "text-zinc-500"}`}>CHUYỂN KHOẢN QUA MÃ QR</p>
                </button>
                <button
                  onClick={() => isCashAllowed && setPaymentMethod("manual")}
                  disabled={!isCashAllowed}
                  className={`relative p-6 border text-left transition-colors flex flex-col items-start ${paymentMethod === "manual"
                      ? "border-primary bg-primary text-white"
                      : !isCashAllowed
                        ? "opacity-50 cursor-not-allowed border-zinc-200 bg-zinc-50"
                        : "border-zinc-200 bg-white hover:border-primary text-zinc-900"
                    }`}
                >
                  <Banknote strokeWidth={1} className={`w-8 h-8 mb-4 ${paymentMethod === "manual" ? "text-white" : "text-zinc-400"}`} />
                  <p className="font-oswald uppercase tracking-widest text-sm mb-1">THANH TOÁN TRỰC TIẾP</p>
                  <p className={`text-xs font-light tracking-widest uppercase ${paymentMethod === "manual" ? "text-white/80" : "text-zinc-500"}`}>CHỜ ADMIN XÁC NHẬN</p>
                  {!isCashAllowed && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center p-4 text-center backdrop-blur-[1px]">
                      <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 uppercase tracking-widest border border-red-200">
                        CHỈ HỖ TRỢ: {cashStartTime} - {cashEndTime}
                      </span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" onClick={() => setStep("form")} className="h-16 rounded-none border-zinc-200 font-oswald uppercase tracking-widest text-xs text-zinc-600 hover:bg-zinc-50 flex-1" disabled={isLoading}>
                <ArrowLeft strokeWidth={1} className="w-4 h-4 mr-2" /> QUAY LẠI
              </Button>
              <button
                onClick={handleSubmitBooking}
                disabled={isLoading}
                className="h-16 bg-primary border border-primary text-white text-sm font-bold uppercase tracking-[0.2em] hover:bg-zinc-900 hover:border-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1"
              >
                {isLoading ? "ĐANG XỬ LÝ..." : (paymentMethod === "qr" ? "TẠO QR THANH TOÁN" : "GỬI ĐƠN ĐẶT PHÒNG")}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === "success" && (
          <div className="max-w-xl mx-auto space-y-6 text-center">
            <div className="border border-zinc-200 bg-white p-8 md:p-12 flex flex-col items-center">
              <div className="w-20 h-20 border border-emerald-500 text-emerald-500 flex items-center justify-center mx-auto mb-8 bg-emerald-50">
                <CheckCircle strokeWidth={1} className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-oswald uppercase tracking-widest text-zinc-900 mb-4">TUYỆT VỜI!</h3>
              <p className="text-zinc-500 mb-6 font-light tracking-widest text-sm uppercase">
                MÃ ĐƠN CỦA BẠN: <strong className="text-primary font-oswald">{bookingId}</strong>
              </p>

              {bookingStatus === "PENDING_PAYMENT" && (
                <div className="mb-8 w-full">
                  {isExpired ? (
                    <span className="inline-flex px-6 py-3 bg-red-50 text-red-600 font-oswald uppercase tracking-widest text-xs border border-red-200">
                      ĐÃ HẾT THỜI GIAN GIỮ PHÒNG. VUI LÒNG ĐẶT LẠI!
                    </span>
                  ) : (
                    <span className="inline-flex px-6 py-3 bg-primary/5 text-primary font-oswald uppercase tracking-widest text-xs border border-primary/20">
                      THỜI GIAN GIỮ PHÒNG: {countdownStr}
                    </span>
                  )}
                </div>
              )}

              {bookingStatus === "CANCELLED" ? (
                <div className="w-full text-red-600 bg-red-50 p-8 border border-red-200 mb-8 transition-opacity">
                  <h4 className="font-oswald uppercase tracking-widest text-lg mb-2">ĐÃ HỦY ĐƠN</h4>
                  <p className="text-xs font-light tracking-widest uppercase">Đơn đặt phòng này đã bị hủy.</p>
                </div>
              ) : bookingStatus !== "PENDING_PAYMENT" ? (
                <div className="w-full text-emerald-600 bg-emerald-50 p-8 border border-emerald-200 mb-8 transition-opacity">
                  <h4 className="font-oswald uppercase tracking-widest text-lg mb-2">XÁC NHẬN THÀNH CÔNG</h4>
                  <p className="text-xs font-light tracking-widest uppercase mb-4">Đơn đặt phòng của bạn đã được thanh toán và xác nhận. Thông tin phòng & mật khẩu cửa đã được gửi vào email của bạn.</p>
                  <div className="border-t border-emerald-200/50 pt-4 mt-4">
                    <p className="text-xs font-light tracking-widest uppercase mb-1">NẾU CẦN HỖ TRỢ, VUI LÒNG LIÊN HỆ:</p>
                    <p className="font-oswald text-lg">HOTLINE: {hotline}</p>
                  </div>
                </div>
              ) : paymentMethod === "qr" && qrUrl ? (
                <div className={`w-full bg-zinc-50 p-8 border border-zinc-200 mb-8 transition-opacity ${isExpired ? 'opacity-50 grayscale' : ''}`}>
                  <div className="bg-white p-4 border border-zinc-200 inline-block mb-6 shadow-sm">
                    <img src={qrUrl} alt="QR Code" className="w-64 h-64 object-contain" />
                  </div>
                  <p className="text-xs font-light tracking-widest text-zinc-600 leading-relaxed px-4 mb-8 uppercase">
                    QUÉT MÃ QR BẰNG ỨNG DỤNG NGÂN HÀNG. HỆ THỐNG SẼ TỰ ĐỘNG GỬI <strong>MẬT KHẨU CỬA</strong> QUA EMAIL NGAY SAU KHI NHẬN ĐƯỢC THANH TOÁN.
                  </p>
                  {payosUrl && (
                    <a href={payosUrl} target="_blank" className="block w-full py-5 bg-primary border border-primary text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-zinc-900 hover:border-zinc-900 transition-colors">
                      HOẶC MỞ TRANG THANH TOÁN AN TOÀN
                    </a>
                  )}
                </div>
              ) : (
                <div className={`w-full text-primary bg-primary/5 p-8 border border-primary/20 mb-8 transition-opacity ${isExpired ? 'opacity-50 grayscale' : ''}`}>
                  <h4 className="font-oswald uppercase tracking-widest text-lg mb-2">ĐANG CHỜ XÁC NHẬN</h4>
                  <p className="text-xs font-light tracking-widest uppercase">Vui lòng đợi Admin xác nhận thanh toán. Thông tin nhận phòng sẽ được gửi qua email.</p>
                </div>
              )}

              <Button onClick={() => window.location.reload()} variant="outline" className="h-16 w-full rounded-none border-zinc-200 font-oswald uppercase tracking-widest text-xs text-zinc-600 hover:bg-zinc-50">
                {isExpired ? "ĐẶT LẠI PHÒNG KHÁC" : "VỀ TRANG CHỦ"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={errorModal.isOpen} onOpenChange={(open) => !open && setErrorModal({ isOpen: false, message: "" })}>
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
          <Button onClick={() => setErrorModal({ isOpen: false, message: "" })} className="mt-4 w-full">Đã hiểu và Nhập lại</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-50 font-oswald text-xl tracking-widest text-zinc-400 uppercase">Đang tải...</div>}>
      <BookingContent />
    </Suspense>
  );
}
