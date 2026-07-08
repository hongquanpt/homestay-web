"use client";

import { Tag, Copy, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useToast } from "@/hooks/use-toast";

interface Promotion {
 title: string;
 desc: string;
 code: string;
}

export function PromotionsSection({ promotions }: { promotions: Promotion[] }) {
 const { toast } = useToast();
 const reduce = useReducedMotion();

 if (!promotions || promotions.length === 0) return null;

 const handleCopy = (code: string) => {
 navigator.clipboard.writeText(code);
 toast({
 title: "Đã sao chép",
 description: `Mã ${code} đã được lưu vào khay nhớ tạm!`,
 });
 };

 const containerVariants = {
 hidden: { opacity: 0 },
 visible: {
 opacity: 1,
 transition: {
 staggerChildren: reduce ? 0 : 0.15
 }
 }
 };

 const itemVariants: any = {
 hidden: { opacity: 0, x: reduce ? 0 : -40 },
 visible: { 
 opacity: 1, 
 x: 0,
 transition: { type: "spring", stiffness: 100, damping: 15 }
 }
 };

 return (
 <section id="promotions" className="py-24 bg-background overflow-hidden border-t border-primary/10">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <motion.div 
 initial={{ opacity: 0, y: reduce ? 0 : 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: "-100px" }}
 transition={{ duration: reduce ? 0.2 : 0.5 }}
 className="flex flex-col sm:flex-row items-center justify-between mb-16 gap-6"
 >
  <div className="text-center w-full">
  <h2 className="text-3xl sm:text-4xl font-oswald uppercase tracking-[0.2em] text-zinc-900 inline-block border-b border-zinc-900 pb-2 mb-2">
  KHUYẾN MÃI
  </h2>
  <p className="mt-4 text-xs font-light tracking-[0.4em] uppercase text-zinc-400 mb-8 max-w-2xl mx-auto">
  ƯU ĐÃI ĐẶC BIỆT
  </p>
  </div>
 </motion.div>

 <motion.div 
 variants={containerVariants}
 initial="hidden"
 whileInView="visible"
 viewport={{ once: true, margin: "-50px" }}
 className="grid grid-cols-1 lg:grid-cols-3 gap-6"
 >
 {promotions.map((promo, i) => (
  <motion.div 
  key={i}
  variants={itemVariants}
  className="relative border border-zinc-200 bg-white hover:border-primary transition-colors duration-500 p-8 flex flex-col group"
  >
  <div className="flex items-start justify-between mb-6">
  <div className="px-4 py-1 border border-primary text-primary text-[10px] font-oswald tracking-widest uppercase">
  GIÁ TỐT
  </div>
  </div>

  <h3 className="text-xl font-oswald uppercase tracking-widest text-zinc-900 mb-3">{promo.title}</h3>
  <p className="text-sm font-light text-zinc-500 mb-8 flex-1 line-clamp-3">
  {promo.desc}
  </p>

  <div className="mt-auto pt-6 border-t border-zinc-200 flex items-center justify-between gap-4">
  <div className="font-oswald tracking-wider font-bold text-lg text-zinc-900 bg-zinc-50 px-4 py-2 border border-zinc-100 truncate w-full text-center">
  {promo.code}
  </div>
  <button 
  onClick={() => handleCopy(promo.code)}
  className="shrink-0 flex items-center gap-2 px-6 py-2 border border-primary text-primary hover:bg-primary hover:text-white transition-colors duration-300 text-xs font-oswald tracking-widest uppercase"
  >
  SAO CHÉP
  </button>
  </div>
  </motion.div>
 ))}
 </motion.div>
 </div>
 </section>
 );
}
