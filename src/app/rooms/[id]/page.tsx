import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import * as Icons from "lucide-react";

export const dynamic = 'force-dynamic';

import {
 BedDouble,
 Phone,
 ArrowLeft,
 Star,
 Clock,
 Moon,
 CheckCircle2
} from "lucide-react";
import { BookingWidget } from "@/components/booking/BookingWidget";
import { RoomImageGallery } from "@/components/room/RoomImageGallery";

function formatVND(num: number) {
 return num.toLocaleString("vi-VN") + "đ";
}

export default async function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = await params;
 
 const dbRoom = await prisma.room.findUnique({
 where: { id },
 include: {
 roomType: true,
 amenities: true,
 images: true,
 discounts: true,
 }
 });

 const surcharges = await (prisma as any).surchargeRule.findMany();

 if (!dbRoom) {
 notFound();
 }

 const imageUrls = dbRoom.images.length > 0 
 ? dbRoom.images.map(img => img.url) 
 : ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80"];

 // Lấy hotline từ DB
 const hotlineSetting = await prisma.systemSetting.findUnique({
 where: { key: 'hotline' }
 });
 const hotline = hotlineSetting?.value || "0901 234 567";

 const houseRulesSetting = await prisma.systemSetting.findUnique({
   where: { key: 'house_rules' }
 });
 const houseRules = houseRulesSetting?.value || null;

 const room = {
 id: dbRoom.id,
 name: dbRoom.name,
 type: dbRoom.roomType.name,
 description: dbRoom.description || "Chưa có mô tả",
 images: imageUrls,
 amenities: dbRoom.amenities.map(a => {
 // @ts-ignore
 const IconComponent = Icons[a.icon] || CheckCircle2;
 return { name: a.name, icon: IconComponent };
 }),
 pricing: [
  { label: "11:00 - 14:00", price: dbRoom.priceNoon ?? 260000 },
  { label: "14:30 - 17:30", price: dbRoom.priceAfternoon ?? 260000 },
  { label: "18:00 - 21:00", price: dbRoom.priceEvening ?? 260000 },
  { label: "Qua đêm (21:30 - 10:30)", price: dbRoom.priceOvernight ?? 420000 }
  ],
 };

 return (
 <div className="min-h-screen bg-white ">
 {/* Header */}
 <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100 ">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
 <Link href="/#rooms" className="flex items-center gap-2 text-zinc-600 hover:text-primary transition-colors">
 <ArrowLeft className="w-4 h-4" />
 <span className="text-sm font-medium">Quay lại</span>
 </Link>
 <Link href="/" className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary flex items-center justify-center">
 <BedDouble className="w-5 h-5 text-white" />
 </div>
 </Link>
 <a href={`tel:${hotline.replace(/\s+/g, '')}`} className="flex items-center gap-2 text-sm font-medium text-primary">
 <Phone className="w-4 h-4" />
 <span className="hidden sm:inline">{hotline}</span>
 </a>
 </div>
 </header>

 <div className="pt-20 pb-32 lg:pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
 {/* Left: Image gallery & Details */}
 <div className="lg:col-span-3 space-y-6">
 
 <RoomImageGallery images={room.images} type={room.type} />

 {/* Room info */}
 <div>
 <h1 className="text-3xl font-bold text-zinc-900 ">{room.name}</h1>
 <div className="flex items-center gap-3 mt-2">
 <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-lg">
 {room.type}
 </span>
 <div className="flex items-center gap-1 text-primary">
 {[...Array(5)].map((_, i) => (
 <Star key={i} className="w-4 h-4 fill-current" />
 ))}
 </div>
 </div>
 </div>

 {/* Amenities */}
 <div>
 <h2 className="text-lg font-bold text-zinc-900 mb-4">Tiện ích</h2>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
 {room.amenities.map((amenity) => (
 <div
 key={amenity.name}
 className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200"
 >
 <div className="w-10 h-10 rounded-[1rem] bg-primary/10 flex items-center justify-center">
 <amenity.icon className="w-5 h-5 text-primary" strokeWidth={2.5} />
 </div>
 <span className="text-sm font-medium text-zinc-700 ">{amenity.name}</span>
 </div>
 ))}
 </div>
 </div>

 {/* Description */}
 <div>
 <h2 className="text-lg font-bold text-zinc-900 mb-3">Mô tả chi tiết</h2>
 <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">{room.description}</p>
 <div className="hidden debug-discounts">{JSON.stringify(dbRoom.discounts)}</div>
 </div>

 {/* House Rules */}
 {houseRules && (
 <div className="card-bubble p-6 bg-orange-50/50 border-orange-200/50 mt-8">
 <h2 className="text-lg font-bold text-orange-900 mb-3 flex items-center gap-2">
 <span className="text-2xl drop-shadow-sm">📋</span>
 Nội quy Homestay
 </h2>
 <div className="text-orange-800/90 leading-relaxed whitespace-pre-wrap text-sm font-medium">
 {houseRules}
 </div>
 </div>
 )}
 </div>

 {/* Right: Pricing & Booking CTA */}
 <div className="lg:col-span-2">
 <div className="sticky top-24 space-y-6">
 {/* Pricing card */}
 <div className="card-bubble p-6">
 <h2 className="text-lg font-bold text-zinc-900 mb-4">Bảng giá</h2>
 <div className="space-y-3">
 {room.pricing.map((p, idx) => (
 <div
 key={p.label}
 className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
 idx === 0
 ? "border-primary/30 bg-primary/5/50 "
 : "border-zinc-200 hover:border-primary/20 :border-primary/20"
 }`}
 >
 <div className="flex items-center gap-3">
 {idx < 2 ? (
 <Clock className="w-4 h-4 text-primary" />
 ) : (
 <Moon className="w-4 h-4 text-indigo-500" />
 )}
 <span className="text-sm font-medium text-zinc-700 ">{p.label}</span>
 </div>
 <span className="text-lg font-bold text-primary">{formatVND(p.price)}</span>
 </div>
 ))}
 </div>
 <p className="text-[11px] text-zinc-500 mt-3 font-medium italic">
    * Bảng giá gốc chưa bao gồm các chương trình giảm giá. Vui lòng chọn ngày trên lịch để xem giá khuyến mãi.
  </p>
 </div>

 {/* Embedded Booking Widget */}
 <div id="booking-section" className="scroll-mt-24">
  <div className="lg:sticky lg:top-24">
    <BookingWidget roomId={room.id} roomName={room.name} room={dbRoom} surcharges={surcharges} />
  </div>
 </div>

 {/* Info notes */}
 <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 ">
 <h3 className="text-sm font-semibold text-zinc-700 mb-3">Lưu ý</h3>
 <ul className="space-y-2 text-xs text-zinc-500 ">
 <li className="flex items-start gap-2">
 <span className="text-primary mt-0.5">•</span>
 Thông tin check-in (địa chỉ, mật khẩu) sẽ được gửi qua email sau khi thanh toán.
 </li>
 <li className="flex items-start gap-2">
 <span className="text-primary mt-0.5">•</span>
 Không cần đăng nhập, không cần gặp lễ tân.
 </li>
 <li className="flex items-start gap-2">
 <span className="text-primary mt-0.5">•</span>
 Vui lòng chuẩn bị CCCD để upload khi đặt phòng.
 </li>
 </ul>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Mobile Fixed Bottom Bar */}
 <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 p-4 lg:hidden shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
 <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
 <div>
 <p className="text-sm text-zinc-500 ">Giá chỉ từ</p>
 <p className="text-lg font-bold text-primary">
 {formatVND(room.pricing[0].price)}
 <span className="text-sm font-normal text-zinc-500 "> / 3h</span>
 </p>
 </div>
 <a 
 href="#booking-section"
 className="flex-1 bg-gradient-to-r from-primary to-primary text-white font-medium text-center py-3 rounded-xl shadow-md active:scale-95 transition-transform"
 >
 Đặt phòng ngay
 </a>
 </div>
 </div>
 </div>
 );
}
