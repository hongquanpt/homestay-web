import Link from "next/link";
import { Phone, MapPin, BedDouble } from "lucide-react";
import * as Icons from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

import { HeroSection } from "@/components/home/HeroSection";
import { FeatureSection } from "@/components/home/FeatureSection";
import { HomeHeader } from "@/components/home/HomeHeader";
import { BookingBoardSection } from "@/components/home/BookingBoardSection";
import { AllRoomsSection } from "@/components/home/AllRoomsSection";
import { ContactSection } from "@/components/home/ContactSection";
import { PromotionsSection } from "@/components/home/PromotionsSection";
import { TodayDiscountsBanner } from "@/components/home/TodayDiscountsBanner";
import { AvailableSlotsBanner } from "@/components/home/AvailableSlotsBanner";

function formatVND(num: number) {
 return num.toLocaleString("vi-VN") + "đ";
}

export default async function HomePage() {
 const dbSettings = await prisma.systemSetting.findMany();
 const settings = dbSettings.reduce((acc, curr) => {
 acc[curr.key] = curr.value;
 return acc;
 }, {} as Record<string, string>);

 const hotline = settings.hotline || "0901 234 567";
 const address = settings.address || "Chưa cập nhật địa chỉ";
 const homestayName = settings.homestay_name || "Homestay";
 const email = settings.contact_email || settings.email || "hello@homestay.com";
 const zalo = settings.zalo || settings.hotline || "0901 234 567";
 const facebook = settings.fanpage_url || settings.facebook || "https://facebook.com";
 const tiktok = settings.tiktok_url || "";
 const instagram = settings.instagram_url || "";
  const promoBanners = [
    settings.promo_banner_1 || "",
    settings.promo_banner_2 || "",
    settings.promo_banner_3 || "",
    settings.promo_banner_4 || "",
  ];
  const vnTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
  const todayDayOfWeek = vnTime.getDay();

  const dbRooms = await prisma.room.findMany({
    where: { status: "ACTIVE" },
    include: { 
      roomType: true, 
      amenities: true, 
      images: true,
      discounts: {
        where: { dayOfWeek: todayDayOfWeek }
      }
    },
  });

  const todayDiscounts: any[] = [];
  dbRooms.forEach(room => {
    room.discounts.forEach((d: any) => {
      todayDiscounts.push({
        roomName: room.name,
        packageId: d.packageId,
        discountPct: d.discountPct,
        discountAmt: d.discountAmt
      });
    });
  });

  const rooms = dbRooms.map(r => {
   const prices = [r.priceNoon, r.priceAfternoon, r.priceEvening, r.priceOvernight].filter(Boolean) as number[];
   const minPrice = prices.length > 0 ? Math.min(...prices) : 260000;
   
   return {
     id: r.id,
     name: r.name,
     facilityId: r.facilityId,
     type: r.roomType.name,
     image: r.images[0]?.url || "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
     images: r.images.map(img => img.url),
     price3h: formatVND(r.priceNoon ?? 260000),
     priceNight: formatVND(minPrice),
     description: r.description || "Chưa có mô tả",
     amenities: r.amenities.map(a => a.name),
   };
  });

 const dbCoupons = await prisma.coupon.findMany({
 where: { 
 validTo: { gte: new Date() },
 isPublic: true
 },
 take: 3,
 orderBy: { createdAt: 'desc' }
 });
 
 const promotions = dbCoupons.map(c => ({
 title: `Giảm ${c.discountPct ? c.discountPct + '%' : formatVND(c.discountAmt || 0)}`,
 desc: `Dành cho các lượt đặt phòng trước ${new Date(c.validTo).toLocaleDateString('vi-VN')}`,
 code: c.code
 }));

 const minPrice3h = dbRooms.length > 0 ? Math.min(...dbRooms.map(r => r.priceNoon ?? 260000)) : 260000;
 const minPriceNight = dbRooms.length > 0 ? Math.min(...dbRooms.map(r => r.priceOvernight ?? 420000)) : 420000;

  const topAmenities = await prisma.amenity.findMany({ take: 4 });

  const todayStr = vnTime.toISOString().split('T')[0];
  const todayStart = new Date(`${todayStr}T00:00:00+07:00`);
  const todayEnd = new Date(`${todayStr}T23:59:59+07:00`);

  const dbBookings = await prisma.bookingDetail.findMany({
    where: {
      startTime: { lt: todayEnd },
      endTime: { gt: todayStart },
      booking: {
        status: { notIn: ['CANCELLED'] }
      }
    },
    select: { roomId: true, startTime: true, endTime: true }
  });

  const defaultPackages = [
    { id: "noon", start: "11:00", end: "14:00" },
    { id: "afternoon", start: "14:30", end: "17:30" },
    { id: "evening", start: "18:00", end: "21:00" },
    { id: "overnight", start: "21:30", end: "10:30" }
  ];

  let availableSlotsToday = 0;
  dbRooms.forEach(room => {
    defaultPackages.forEach(pkg => {
      const pkgStart = new Date(`${todayStr}T${pkg.start}:00+07:00`).getTime();
      const pkgEndObj = new Date(`${todayStr}T${pkg.end}:00+07:00`);
      if (pkg.id === 'overnight') pkgEndObj.setDate(pkgEndObj.getDate() + 1);
      const pkgEnd = pkgEndObj.getTime();
      
      const isBooked = dbBookings.some((b) => {
        const bStart = new Date(b.startTime).getTime();
        const bEnd = new Date(b.endTime).getTime();
        return b.roomId === room.id && pkgStart < bEnd && pkgEnd > bStart;
      });

      if (!isBooked) {
        availableSlotsToday++;
      }
    });
  });

  return (
 <div className="min-h-screen bg-background">
 <HomeHeader hotline={hotline} homestayName={homestayName} hasBanner={todayDiscounts.length > 0} />
 {todayDiscounts.length > 0 && <TodayDiscountsBanner discounts={todayDiscounts} />}

 <HeroSection hotline={hotline} homestayName={homestayName} rooms={rooms} />
 <AvailableSlotsBanner availableSlots={availableSlotsToday} promoBanners={promoBanners} />
 <BookingBoardSection />
 <AllRoomsSection rooms={rooms} homestayName={homestayName} />
 <PromotionsSection promotions={promotions} />
 <FeatureSection />
 <ContactSection 
    hotline={hotline}
    address={address}
    email={email}
    zalo={zalo}
    facebook={facebook}
    tiktok={tiktok}
    instagram={instagram}
    homestayName={homestayName}
  />

 {/* Footer */}
 <footer id="footer" className="py-16 bg-transparent text-zinc-900 border-t border-zinc-200">
 <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-12">
 <div className="flex items-center gap-3">
 <BedDouble strokeWidth={1} className="w-8 h-8 text-zinc-900" />
 <div className="flex flex-col leading-none">
 <span className="text-lg font-bold font-oswald tracking-[0.15em] uppercase text-zinc-900">
 {homestayName.split(' ')[0]}
 </span>
 <span className="text-xs font-light tracking-[0.2em] uppercase text-primary">
 {homestayName.split(' ').slice(1).join(' ') || "HOUSE"}
 </span>
 </div>
 </div>

 <div className="flex flex-col md:flex-row gap-12 text-center md:text-left text-xs font-light tracking-wide text-zinc-600">
 <div>
 <h4 className="font-oswald uppercase tracking-[0.2em] text-zinc-900 mb-2">ĐỊA CHỈ:</h4>
 <p className="opacity-80">{address}</p>
 </div>
 <div>
 <h4 className="font-oswald uppercase tracking-[0.2em] text-zinc-900 mb-2">MÃ BƯU ĐIỆN:</h4>
 <p className="opacity-80">220125</p>
 </div>
 <div>
 <h4 className="font-oswald uppercase tracking-[0.2em] text-zinc-900 mb-2">ĐIỆN THOẠI:</h4>
 <p className="opacity-80">{hotline}</p>
 </div>
 </div>
 </div>
 </footer>
 </div>
 );
}
