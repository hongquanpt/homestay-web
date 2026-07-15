"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import Swal from 'sweetalert2';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, addMonths } from "date-fns";
import { vi } from "date-fns/locale";

const defaultBookingPackages = [
  { id: "noon", label: "11:00 - 14:00", start: "11:00", end: "14:00" },
  { id: "afternoon", label: "14:30 - 17:30", start: "14:30", end: "17:30" },
  { id: "evening", label: "18:00 - 21:00", start: "18:00", end: "21:00" },
  { id: "overnight", label: "21:30 - 10:30", start: "21:30", end: "10:30" }
];

const formatDate = (date: Date) => date.toISOString().split('T')[0];

export function BookingBoardSection() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [boardData, setBoardData] = useState<{ rooms: any[], bookings: any[], facilities: any[], settings?: { discount_2_slots: number, discount_3_slots: number, discount_4_slots: number } }>({ rooms: [], bookings: [], facilities: [] });
  const [gridData, setGridData] = useState<any[]>([]);
  const [selectedCells, setSelectedCells] = useState<{ roomId: string, dateStr: string, pkgId: string, startMs: number, endMs: number, price: number }[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

  const fetchBoardData = () => {
    fetch(`/api/board?date=${formatDate(currentDate)}&t=${Date.now()}${selectedFacilityId ? `&facilityId=${selectedFacilityId}` : ''}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setBoardData(res.data);
          generateGrid(res.data.rooms, res.data.bookings, res.data.surcharges || []);
        }
      })
      .finally(() => setLoading(false));
  };

  const getDiscountedPrice = (pkgId: string, price: number, discounts: any[], dayOfWeek: number) => {
    const discount = discounts.find((d: any) => 
      d.dayOfWeek === dayOfWeek && (d.packageId === pkgId || d.packageId === 'ALL')
    );
    if (!discount) return { finalPrice: price, discount: null };
    let finalPrice = price;
    if (discount.discountPct) finalPrice = price * (1 - discount.discountPct / 100);
    else if (discount.discountAmt) finalPrice = Math.max(0, price - discount.discountAmt);
    return { finalPrice, discount };
  };

  const generateGrid = (rooms: any[], bookings: any[], surcharges: any[]) => {
    const next7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(currentDate);
      d.setDate(currentDate.getDate() + i);
      const isToday = d.toDateString() === new Date().toDateString();
      return { dateStr: formatDate(d), dayOfWeek: d.getDay(), displayDate: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`, displayDay: isToday ? "Hôm nay" : ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()] };
    });

    const grid = next7Days.map(day => {
      const roomCells = rooms.map(room => {
        return defaultBookingPackages.map(pkg => {
          const isBooked = bookings.some((b: any) => {
             const pkgStart = new Date(`${day.dateStr}T${pkg.start}:00+07:00`).getTime();
             const pkgEndObj = new Date(`${day.dateStr}T${pkg.end}:00+07:00`);
             if (pkg.id === 'overnight') pkgEndObj.setDate(pkgEndObj.getDate() + 1);
             const pkgEnd = pkgEndObj.getTime();
             const bStart = new Date(b.startTime).getTime();
             const bEnd = new Date(b.endTime).getTime();
             return b.roomId === room.id && pkgStart < bEnd && pkgEnd > bStart;
          });

          const pkgPrice = pkg.id === "noon" ? room.priceNoon ?? 260000 : pkg.id === "afternoon" ? room.priceAfternoon ?? 260000 : pkg.id === "evening" ? room.priceEvening ?? 260000 : room.priceOvernight ?? 420000;

          const applicableSurcharges = surcharges.filter((s: any) => {
            if (s.packageId !== 'ALL' && s.packageId !== pkg.id) return false;
            if (s.type === 'DATE') return new Date(s.targetDate).toISOString().split('T')[0] === day.dateStr;
            if (s.type === 'DAY_OF_WEEK') return s.dayOfWeek === day.dayOfWeek;
            return false;
          });

          let surchargeAmt = 0;
          let hasHoliday = false;
          applicableSurcharges.forEach((s: any) => {
            if (s.type === 'DATE') hasHoliday = true;
            if (s.surchargeAmt) surchargeAmt += s.surchargeAmt;
            if (s.surchargePct) surchargeAmt += (pkgPrice * s.surchargePct) / 100;
          });

          const basePriceWithSurcharge = pkgPrice + surchargeAmt;
          const { finalPrice, discount } = getDiscountedPrice(pkg.id, basePriceWithSurcharge, room.discounts || [], day.dayOfWeek);

          return {
            ...pkg,
            roomId: room.id,
            dateStr: day.dateStr,
            basePkgPrice: pkgPrice,
            originalPrice: basePriceWithSurcharge,
            price: finalPrice,
            discount,
            surchargeAmt,
            hasHoliday,
            isBooked
          };
        });
      });
      return { ...day, roomCells };
    });
    setGridData(grid);
  };

  useEffect(() => {
    fetchBoardData();
    const eventSource = new EventSource('/api/board/stream');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'UPDATE') fetchBoardData();
      } catch (e) { console.error('SSE Error:', e); }
    };
    return () => eventSource.close();
  }, [selectedFacilityId, currentDate]);

  const formatPrice = (price: number) => (price / 1000) + 'k';

  const handleCellClick = (cell: any) => {
    if (cell.isBooked) return;
    const { roomId, dateStr, id: pkgId, price } = cell;
    const pkg = defaultBookingPackages.find(p => p.id === pkgId)!;
    const pkgStart = new Date(`${dateStr}T${pkg.start}:00+07:00`).getTime();
    const pkgEndObj = new Date(`${dateStr}T${pkg.end}:00+07:00`);
    if (pkgId === 'overnight') pkgEndObj.setDate(pkgEndObj.getDate() + 1);
    const pkgEnd = pkgEndObj.getTime();

    setSelectedCells(prev => {
      const exists = prev.find(c => c.roomId === roomId && c.dateStr === dateStr && c.pkgId === pkgId);
      if (exists) {
        return prev.filter(c => !(c.roomId === roomId && c.dateStr === dateStr && c.pkgId === pkgId));
      }
      if (prev.length > 0 && prev[0].roomId !== roomId) return [{ roomId, dateStr, pkgId, startMs: pkgStart, endMs: pkgEnd, price }];
      
      const newSelection = [...prev, { roomId, dateStr, pkgId, startMs: pkgStart, endMs: pkgEnd, price }];
      const sorted = [...newSelection].sort((a, b) => a.startMs - b.startMs);
      let isConsecutive = true;
      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = sorted[i+1].startMs - sorted[i].endMs;
        if (gap > 1800000 || gap < 0) {
          isConsecutive = false;
          break;
        }
      }
      
      if (!isConsecutive) {
        Swal.fire({ 
          icon: 'warning', 
          title: 'Không thể chọn', 
          text: 'Chỉ được chọn nhiều khung giờ nếu chúng liền kề nhau!',
          confirmButtonColor: '#ea580c'
        });
        return prev;
      }
      
      return newSelection;
    });
  };

  const getMergedSelection = () => {
    if (selectedCells.length === 0) return null;
    const sorted = [...selectedCells].sort((a, b) => a.startMs - b.startMs);
    const basePrice = sorted.reduce((sum, c) => sum + c.price, 0);
    let discountPct = 0;
    if (sorted.length === 2) discountPct = boardData.settings?.discount_2_slots ?? 5;
    if (sorted.length === 3) discountPct = boardData.settings?.discount_3_slots ?? 10;
    if (sorted.length >= 4) discountPct = boardData.settings?.discount_4_slots ?? 15;
    const finalPrice = basePrice * (1 - discountPct / 100);
    return { roomId: sorted[0].roomId, count: sorted.length, basePrice, discountPct, finalPrice, firstDate: sorted[0].dateStr, startMs: sorted[0].startMs, endMs: sorted[sorted.length - 1].endMs, label: sorted.length > 1 ? `${sorted.length} ca liên tiếp (Thông tầm)` : `${sorted.length} ca riêng lẻ`, discountAmt: basePrice - finalPrice };
  };

  const handleProceedToBooking = () => {
    const mergedInfo = getMergedSelection();
    if (!mergedInfo) return;
    
    localStorage.setItem('prefillBooking', JSON.stringify({
      roomId: mergedInfo.roomId,
      date: mergedInfo.firstDate,
      packageId: 'custom',
      customDetails: {
        label: mergedInfo.label,
        price: mergedInfo.finalPrice,
        originalPrice: mergedInfo.basePrice,
        startTime: new Date(mergedInfo.startMs).toISOString(),
        endTime: new Date(mergedInfo.endMs).toISOString(),
        discount: mergedInfo.discountAmt
      }
    }));
    router.push('/booking');
  };

  const mergedInfo = getMergedSelection();

  return (
    <section id="booking-board" className="py-24 bg-white border-y border-zinc-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-oswald uppercase tracking-[0.2em] text-zinc-900 inline-block border-b border-zinc-900 pb-2 mb-6">
            BẢNG ĐẶT PHÒNG
          </h2>
          <p className="text-zinc-500 font-light tracking-wider text-sm sm:text-base uppercase max-w-2xl mx-auto">
            Xem tổng quan tình trạng trống của tất cả các phòng và chọn ngay giờ bạn muốn.
          </p>
          
          <div className="flex items-center justify-center gap-8 mt-8 text-xs font-oswald tracking-widest uppercase mb-12">
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-zinc-200 border border-zinc-300"></div> Đã đặt</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-white border border-zinc-300"></div> Còn trống</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-primary border border-primary"></div> Đang chọn</div>
          </div>

          {/* FACILITY SELECTOR CAROUSEL */}
          {boardData.facilities && boardData.facilities.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xl font-oswald uppercase tracking-widest text-zinc-400 mb-6 relative">
                <span className="bg-white px-4">CHỌN CƠ SỞ (HOUSE SELECTION)</span>
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-zinc-200 -z-10"></div>
              </h3>
              
              <div className="flex overflow-x-auto custom-scrollbar gap-6 pb-6 px-4 snap-x justify-start lg:justify-center">
                {/* Option: All facilities if needed, or default to first if none selected. For now, let's just make the first one active by default if selectedFacilityId is null */}
                <button
                  onClick={() => {
                    setSelectedFacilityId(null);
                    window.dispatchEvent(new CustomEvent('facilityChange', { detail: null }));
                  }}
                  className={`relative flex-shrink-0 w-64 h-80 rounded-xl overflow-hidden snap-center group transition-all duration-300 ${!selectedFacilityId ? 'ring-4 ring-primary scale-[1.02] shadow-2xl' : 'opacity-60 hover:opacity-100'}`}
                >
                  <div className="absolute inset-0 bg-zinc-900/40 group-hover:bg-zinc-900/20 transition-colors z-10" />
                  <img src="https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=600&auto=format&fit=crop" alt="All" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 w-full p-6 z-20 text-left bg-gradient-to-t from-black/80 to-transparent">
                    <h4 className="text-white font-oswald text-xl uppercase tracking-widest">TẤT CẢ CƠ SỞ</h4>
                    <p className="text-zinc-300 text-sm mt-1">Xem toàn bộ hệ thống</p>
                  </div>
                </button>

                {boardData.facilities.map((f: any) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFacilityId(f.id);
                      window.dispatchEvent(new CustomEvent('facilityChange', { detail: f.id }));
                    }}
                    className={`relative flex-shrink-0 w-64 h-80 rounded-xl overflow-hidden snap-center group transition-all duration-300 ${selectedFacilityId === f.id ? 'ring-4 ring-primary scale-[1.02] shadow-2xl' : 'opacity-60 hover:opacity-100'}`}
                  >
                    <div className="absolute inset-0 bg-zinc-900/40 group-hover:bg-zinc-900/20 transition-colors z-10" />
                    <img src={f.imageUrl || "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=600&auto=format&fit=crop"} alt={f.name} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 w-full p-6 z-20 text-left bg-gradient-to-t from-black/80 to-transparent">
                      <h4 className="text-white font-oswald text-xl uppercase tracking-widest">{f.name}</h4>
                      <p className="text-zinc-300 text-sm mt-1 line-clamp-1">{f.address || "Chi nhánh"}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="border border-zinc-200 bg-white relative">
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50 gap-4">
              <span className="font-oswald tracking-widest text-zinc-500 uppercase text-sm">Hiển thị lịch cho 7 ngày tính từ ngày đã chọn</span>
              <Popover>
                <PopoverTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-zinc-300 bg-white hover:bg-zinc-100 hover:text-zinc-900 shadow-sm h-9 px-4 py-2 font-oswald tracking-widest text-zinc-700">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(currentDate, "dd/MM/yyyy", { locale: vi })}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={(date) => {
                      if (date) setCurrentDate(date);
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today || date > addMonths(today, 2);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse min-w-[800px] text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 top-0 z-30 bg-white text-zinc-900 border-b border-r border-zinc-200 p-4 text-left w-24 align-middle font-oswald uppercase text-xs tracking-widest">
                      Tên phòng
                    </th>
                    {boardData.rooms.map((room, idx) => (
                      <th key={`room-${room.id}`} colSpan={4} className={`sticky top-0 z-20 bg-zinc-50 text-zinc-900 border-b p-4 text-center font-oswald tracking-widest uppercase text-sm ${idx === boardData.rooms.length - 1 ? 'border-r border-zinc-200' : 'border-r-2 border-r-zinc-300'}`}>
                        {room.name}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className="sticky left-0 top-[53px] z-30 bg-zinc-50 text-zinc-500 border-b border-r border-zinc-200 p-3 text-center text-[10px] font-oswald uppercase tracking-widest">
                      Thứ / Ngày
                    </th>
                    {boardData.rooms.map((room, rIdx) => (
                      defaultBookingPackages.map((pkg, pIdx) => {
                        const isLastRoom = rIdx === boardData.rooms.length - 1;
                        const isLastPkg = pIdx === defaultBookingPackages.length - 1;
                        const borderClass = (isLastPkg && !isLastRoom) ? 'border-r-2 border-r-zinc-300' : 'border-r border-zinc-200';
                        return (
                          <th key={`pkg-${room.id}-${pkg.id}`} className={`sticky top-[53px] z-20 bg-white text-zinc-600 border-b p-3 text-center text-xs w-24 font-light tracking-wider ${borderClass}`}>
                            <div className="text-zinc-900">{pkg.start} - {pkg.end}</div>
                          </th>
                        );
                      })
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gridData.map((day, rowIdx) => (
                    <tr key={day.dateStr} className="hover:bg-zinc-50 transition-colors">
                      <td className="sticky left-0 z-10 bg-white text-zinc-500 border-b border-r border-zinc-200 p-4 text-center text-xs font-light tracking-widest">
                        <div className={rowIdx === 0 ? "text-primary font-oswald" : "font-oswald text-zinc-900"}>{day.displayDay}</div>
                        <div className="mt-1">{day.displayDate}</div>
                      </td>
                      {day.roomCells.map((roomPkgs: any[], roomIdx: number) => (
                        roomPkgs.map((cell, cellIdx) => {
                          const isSelected = selectedCells.some(c => c.roomId === cell.roomId && c.dateStr === cell.dateStr && c.pkgId === cell.id);
                          const isLastRoom = roomIdx === day.roomCells.length - 1;
                          const isLastPkg = cellIdx === roomPkgs.length - 1;
                          const borderClass = (isLastPkg && !isLastRoom) ? 'border-r-2 border-r-zinc-300' : 'border-r border-zinc-200';
                          
                          let cellClass = `cursor-pointer transition-colors border-b p-1 text-center h-20 relative ${borderClass} `;
                          if (cell.isBooked) {
                            cellClass += "bg-zinc-100 text-zinc-400 cursor-not-allowed";
                          } else if (isSelected) {
                            cellClass += "bg-primary text-white";
                          } else {
                            cellClass += "bg-white hover:bg-zinc-50";
                          }

                          return (
                            <td 
                              key={`cell-${cell.roomId}-${cell.dateStr}-${cell.id}`} 
                              className={cellClass}
                              onClick={() => handleCellClick(cell)}
                            >
                              {cell.isBooked ? (
                                <div className="flex flex-col justify-center items-center h-full w-full">
                                  <div className="border-[1.5px] border-red-400/50 bg-gradient-to-tr from-white/40 via-white/70 to-white/95 backdrop-blur-md text-red-600 font-oswald text-[10px] font-bold w-12 h-12 flex items-center justify-center rounded-full tracking-widest transform -rotate-12 select-none shadow-[0_8px_16px_rgba(220,38,38,0.25)] ring-[1.5px] ring-inset ring-white">
                                    <span className="text-center leading-tight drop-shadow-sm">ĐÃ<br/>ĐẶT</span>
                                  </div>
                                </div>
                              ) : isSelected ? (
                                <div className="flex flex-col justify-center items-center h-full w-full">
                                  <span className="font-oswald tracking-widest text-[10px] mb-1">ĐÃ CHỌN</span>
                                  <span className="text-xs font-bold">{formatPrice(cell.price)}</span>
                                </div>
                              ) : (
                                <div className="flex flex-col justify-center items-center h-full w-full">
                                  {cell.hasHoliday && <span className="absolute top-0 left-0 bg-yellow-500 text-white text-[8px] px-1 font-bold">LỄ</span>}
                                  {(cell.discount || cell.surchargeAmt > 0) && (
                                    <span className="text-[10px] line-through text-zinc-400">{formatPrice(cell.basePkgPrice)}</span>
                                  )}
                                  <span className={`text-xs font-bold ${cell.surchargeAmt > 0 ? "text-yellow-600" : "text-primary"}`}>{formatPrice(cell.price)}</span>
                                  {cell.discount && (
                                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] px-1 font-bold">
                                      {cell.discount.discountPct ? `-${cell.discount.discountPct}%` : `-${formatPrice(cell.discount.discountAmt!)}`}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Bottom Bar */}
            <div className="border-t border-zinc-200 bg-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="text-sm font-light text-zinc-600 uppercase tracking-widest mb-1">
                  Tổng tạm tính
                </div>
                <div className="text-2xl md:text-3xl font-oswald text-primary tracking-wider">
                  {mergedInfo ? mergedInfo.finalPrice.toLocaleString('vi-VN') : 0} <span className="text-xl">VNĐ</span>
                  {mergedInfo && mergedInfo.discountPct > 0 && (
                    <span className="ml-3 text-lg text-zinc-400 line-through">{mergedInfo.basePrice.toLocaleString('vi-VN')}</span>
                  )}
                </div>
                {mergedInfo && mergedInfo.discountPct > 0 && (
                  <div className="text-xs font-oswald tracking-widest text-white bg-primary px-3 py-1 mt-2 uppercase">
                    Đã giảm {mergedInfo.discountPct}% & +30p thông tầm
                  </div>
                )}
              </div>
              <button 
                onClick={handleProceedToBooking}
                disabled={selectedCells.length === 0}
                className="w-full md:w-auto px-10 py-4 bg-primary text-white text-sm font-bold uppercase tracking-[0.2em] hover:bg-zinc-900 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
              >
                ĐẶT PHÒNG {mergedInfo?.count ? `(${mergedInfo.count} Ô)` : ''}
                <ChevronRight strokeWidth={1} className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
