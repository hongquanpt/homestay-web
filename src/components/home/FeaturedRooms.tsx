"use client";

import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

interface Room {
 id: string;
 name: string;
 type: string;
 image: string;
 price3h: string;
 priceNight: string;
 description: string;
 amenities: string[];
}

export function FeaturedRooms({ featuredRooms }: { featuredRooms: Room[] }) {
 const reduce = useReducedMotion();

 const containerVariants = {
 hidden: {},
 visible: {
 transition: { staggerChildren: reduce ? 0 : 0.08 }
 }
 };

 const itemVariants: any = {
 hidden: { opacity: 0, y: reduce ? 0 : 20 },
 visible: { 
 opacity: 1, 
 y: 0, 
 transition: { duration: reduce ? 0.2 : 0.4, ease: "easeOut" as const } 
 }
 };

 return (
 <section id="rooms" className="py-20 bg-zinc-50 ">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <motion.div 
 initial={{ opacity: 0, y: reduce ? 0 : 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: "-100px" }}
 transition={{ duration: reduce ? 0.2 : 0.5 }}
 className="text-center mb-12"
 >
 <h2 className="text-3xl font-bold text-zinc-900 ">
 Phòng nổi bật
 </h2>
 <p className="mt-3 text-zinc-500 ">
 Lựa chọn không gian phù hợp với phong cách của bạn
 </p>
 </motion.div>

 <motion.div 
 variants={containerVariants}
 initial="hidden"
 whileInView="visible"
 viewport={{ once: true, margin: "-50px" }}
 className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
 >
 {featuredRooms.map((room) => (
 <motion.div
 key={room.id}
 variants={itemVariants}
 >
 <Link href={`/rooms/${room.id}`} className="block h-full">
 <motion.div
 whileHover={reduce ? {} : { y: -4 }}
 className="group bg-white rounded-2xl overflow-hidden border border-zinc-200 hover:shadow-xl hover:shadow-primary/20 transition-all duration-500 h-full flex flex-col"
 >
 <div className="relative h-48 overflow-hidden shrink-0">
 <motion.img
 whileHover={reduce ? {} : { scale: 1.05 }}
 transition={{ duration: 0.4 }}
 src={room.image}
 alt={room.name}
 className="w-full h-full object-cover"
 />
 <div className="absolute top-3 left-3">
 <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-semibold rounded-lg">
 {room.type}
 </span>
 </div>
 </div>
 <div className="p-5 flex flex-col flex-1">
 <h3 className="font-bold text-zinc-900 text-lg">{room.name}</h3>
 <p className="text-sm text-zinc-500 mt-1.5 line-clamp-2">
 {room.description}
 </p>
 <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
 {room.amenities.map((a) => (
 <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-medium">
 {a}
 </span>
 ))}
 </div>
 <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between">
 <div>
 <p className="text-xs text-zinc-500">Từ</p>
 <p className="text-lg font-bold text-primary">{room.price3h}<span className="text-xs font-normal text-zinc-400">/3h</span></p>
 </div>
 <div className="flex items-center gap-1 text-sm font-semibold text-primary group-hover:text-primary transition-colors">
 Chi tiết
 <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
 </div>
 </div>
 </div>
 </motion.div>
 </Link>
 </motion.div>
 ))}
 </motion.div>

 <motion.div 
 initial={{ opacity: 0 }}
 whileInView={{ opacity: 1 }}
 viewport={{ once: true }}
 className="text-center mt-10"
 >
 <Link href="/rooms">
 <motion.div
 whileHover={reduce ? {} : { scale: 1.02 }}
 whileTap={reduce ? {} : { scale: 0.98 }}
 className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-primary border-2 border-primary/20 rounded-xl hover:bg-primary/5 :bg-amber-900/10 transition-colors"
 >
 Xem tất cả phòng
 <ArrowRight className="w-4 h-4" />
 </motion.div>
 </Link>
 </motion.div>
 </div>
 </section>
 );
}
