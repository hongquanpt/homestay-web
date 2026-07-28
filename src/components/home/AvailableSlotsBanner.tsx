"use client";

import { motion } from "motion/react";
import Link from "next/link";
import Image from "next/image";

interface AvailableSlotsBannerProps {
  availableSlots: number;
  promoBanners: string[];
}

export function AvailableSlotsBanner({ availableSlots, promoBanners }: AvailableSlotsBannerProps) {
  const b1 = promoBanners[0] || "";
  const b2 = promoBanners[1] || "";
  const b3 = promoBanners[2] || "";
  const b4 = promoBanners[3] || "";

  return (
    <section className="relative bg-transparent py-16 md:py-24 overflow-hidden border-t border-zinc-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-center relative">
        
        {/* Left Column - Banners 1 & 3 */}
        <div className="flex flex-col gap-6 w-full lg:w-[420px] z-0">
          {b1 && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative aspect-[4/3] rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-500 border border-zinc-100 group"
            >
              <Image src={b1} alt="Khuyến mãi 1" fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 1024px) 100vw, 350px" />
            </motion.div>
          )}
          {b3 && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative aspect-[4/3] rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-500 border border-zinc-100 group"
            >
              <Image src={b3} alt="Khuyến mãi 3" fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 1024px) 100vw, 350px" />
            </motion.div>
          )}
        </div>

        {/* Center Column - Airplane Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 70 }}
          className="w-full lg:w-[460px] lg:mx-[-20px] flex justify-center flex-shrink-0 z-10 py-8 lg:py-0"
        >
          {/* Outer Frame */}
          <div className="relative w-[380px] h-[640px] bg-white/30 backdrop-blur-sm rounded-[160px] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/50 flex items-center justify-center">
            
            {/* Middle Frame */}
            <div className="w-full h-full rounded-[145px] bg-white/40 p-2 shadow-[inset_0_4px_15px_rgba(0,0,0,0.02),0_2px_4px_rgba(255,255,255,0.5)]">
              
              {/* Inner Frame */}
              <div className="w-full h-full rounded-[135px] bg-white/60 p-3 shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_-2px_8px_rgba(0,0,0,0.02)] relative flex flex-col">
                
                {/* Handle */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-16 h-2.5 bg-gradient-to-b from-[#e8c888] to-[#cca457] rounded-full shadow-[inset_0_1px_3px_rgba(255,255,255,0.6),0_2px_5px_rgba(0,0,0,0.2)] z-20" />

                {/* The Glass */}
                <div className="relative w-full h-full rounded-[120px] overflow-hidden shadow-[inset_0_10px_35px_rgba(0,0,0,0.3)] bg-[#8bc7f7]">
                  {/* Sky background image */}
                  <Image src="/sky-clouds-v2.png" alt="Sky" fill className="object-cover" priority />
                  
                  {/* Sunburst effect (optional CSS glow to mimic image) */}
                  <div className="absolute top-[-50px] left-[-50px] w-[200px] h-[200px] bg-white/40 blur-[50px] rounded-full" />
                  
                  {/* Content Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#4fa9e8]/40 via-transparent to-[#ffffff]/30 flex flex-col items-center justify-start pt-[110px] px-4 text-center z-10">
                    <span className="text-[#55819e] font-oswald text-[16px] uppercase tracking-[0.15em] drop-shadow-sm mb-2">Hôm nay còn</span>
                    
                    <motion.span
                        key={availableSlots}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 100 }}
                        className="text-[140px] font-oswald font-bold text-[#55819e] drop-shadow-sm leading-[1] my-0"
                    >
                        {availableSlots}
                    </motion.span>
                    
                    <span className="text-[#55819e] font-oswald text-[16px] uppercase tracking-[0.15em] drop-shadow-sm mt-2">Khung giờ trống</span>
                    
                    {/* Cloud Button */}
                    <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2">
                        <Link href="#booking-board" className="group relative flex flex-col items-center justify-center">
                          {/* Cloud Icon intersecting the pill */}
                          <svg className="w-12 h-8 text-white drop-shadow-md absolute -top-4 z-10 group-hover:-translate-y-1 transition-transform" viewBox="0 0 24 24" fill="white" stroke="#7abef0" strokeWidth="1">
                             <path d="M17.5 19c2.5 0 4.5-2 4.5-4.5a4.5 4.5 0 0 0-4-4.47A7 7 0 0 0 4.3 11.2 4.5 4.5 0 0 0 4.5 20h13z" />
                          </svg>
                          
                          {/* Pill shape */}
                          <div className="px-8 py-3 bg-white/95 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.1)] border-2 border-white relative z-0 group-hover:bg-white group-hover:scale-105 transition-all">
                             <span className="text-[#55819e] font-bold text-[13px] uppercase tracking-[0.1em]">
                                Đặt ngay
                             </span>
                          </div>
                        </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column - Banners 2 & 4 */}
        <div className="flex flex-col gap-6 w-full lg:w-[420px] z-0">
          {b2 && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative aspect-[4/3] rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-500 border border-zinc-100 group"
            >
              <Image src={b2} alt="Khuyến mãi 2" fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 1024px) 100vw, 350px" />
            </motion.div>
          )}
          {b4 && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative aspect-[4/3] rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-500 border border-zinc-100 group"
            >
              <Image src={b4} alt="Khuyến mãi 4" fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 1024px) 100vw, 350px" />
            </motion.div>
          )}
        </div>
        
      </div>
    </section>
  );
}
