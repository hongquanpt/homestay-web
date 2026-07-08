"use client";

import { Info } from "lucide-react";

interface DiscountInfo {
  roomName: string;
  packageId: string;
  discountPct: number | null;
  discountAmt: number | null;
}

export function TodayDiscountsBanner({ discounts }: { discounts: DiscountInfo[] }) {
  if (!discounts || discounts.length === 0) return null;

  const packageLabels: Record<string, string> = {
    'noon': '11:00-14:00',
    'afternoon': '14:30-17:30',
    'evening': '18:00-21:00',
    'overnight': 'Qua đêm',
    'ALL': 'Tất cả các khung giờ'
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-primary/95 border-b border-primary/20 overflow-hidden flex items-center h-10 shadow-md">
      <div className="absolute left-0 top-0 bottom-0 bg-primary px-4 flex items-center gap-2 z-10 border-r border-white/20 shadow-sm">
        <Info className="w-4 h-4 text-white" />
        <span className="text-xs font-oswald uppercase tracking-widest text-white hidden sm:inline whitespace-nowrap">
          GIẢM GIÁ HÔM NAY
        </span>
      </div>
      
      <div className="flex-1 overflow-hidden ml-12 sm:ml-48 relative h-full flex items-center">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-12 text-sm font-light text-white">
          {[...discounts, ...discounts, ...discounts, ...discounts].map((d, idx) => (
            <span key={idx} className="flex items-center gap-2">
              <span className="font-medium text-white">{d.roomName}</span>
              <span className="text-xs text-white/80">({packageLabels[d.packageId] || d.packageId}):</span>
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                {d.discountPct ? `-${d.discountPct}%` : `-${d.discountAmt?.toLocaleString('vi-VN')}đ`}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
