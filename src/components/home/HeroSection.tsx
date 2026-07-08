"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Navigation, Autoplay, Pagination } from 'swiper/modules';
import { RoomDetailDialog } from "./RoomDetailDialog";
import { useEffect, useState } from "react";

import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export function HeroSection({ hotline, homestayName, rooms }: { hotline: string; homestayName: string; rooms: any[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!rooms || rooms.length === 0) return null;

  return (
    <section className="relative h-screen w-full flex items-center overflow-hidden bg-black hero-swiper-wrapper">
      {mounted && (
      <Swiper
        effect={'fade'}
        fadeEffect={{ crossFade: true }}
        navigation={{
          prevEl: '.hero-prev',
          nextEl: '.hero-next',
        }}
        pagination={{
          el: '.hero-pagination',
          clickable: true,
          renderBullet: function (index, className) {
            return '<span class="' + className + ' w-2 h-2 rounded-full bg-white opacity-40 mx-1 transition-opacity"></span>';
          },
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop={true}
        modules={[EffectFade, Navigation, Autoplay, Pagination]}
        className="w-full h-full"
      >
        {rooms.map((room) => {
          const [firstWord, ...rest] = room.name.split(' ');
          const secondPart = rest.join(' ');

          return (
            <SwiperSlide key={room.id} className="w-full h-full">
              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                <img 
                  src={room.image} 
                  alt={room.name} 
                  className="w-full h-full object-cover opacity-80 animate-slow-zoom"
                />
                {/* Subtle dark gradient overlay to make text pop */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/60" />
              </div>
              
              {/* Content Container */}
              <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 w-full z-10 flex flex-col justify-center h-full pt-20">
                
                {/* Left Side: Title & Price */}
                <div className="max-w-xl">
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-primary font-oswald tracking-widest text-sm mb-4 uppercase"
                  >
                    {homestayName}
                  </motion.div>
                  <motion.h1 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-5xl md:text-7xl font-bold text-white font-oswald uppercase tracking-wider leading-[1.1] mb-6 drop-shadow-lg"
                  >
                    {firstWord}<br />{secondPart}
                  </motion.h1>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex items-center gap-6 mb-8"
                  >
                    <span className="text-white/90 font-light text-lg tracking-widest uppercase">
                      giá từ: <span className="text-white font-bold">{room.priceNight}</span>
                    </span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                  >
                    <RoomDetailDialog room={room}>
                      <button className="inline-block border border-[#A3B18A] text-[#A3B18A] px-8 py-2.5 text-sm uppercase tracking-[0.2em] hover:bg-[#A3B18A] hover:text-white transition-colors duration-300">
                        xem chi tiết
                      </button>
                    </RoomDetailDialog>
                  </motion.div>
                </div>

              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
      )}

      {/* Bottom Right: Rooms link */}
      <div className="absolute bottom-32 right-6 lg:right-12 text-right z-20 hidden md:block">
        <Link href="#rooms" className="inline-block border border-white/50 text-white px-8 py-2.5 text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors duration-300">
          Xem tất cả phòng
        </Link>
      </div>

      {/* Carousel Indicators & Controls */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-4 z-20">
        <button className="hero-prev text-white/70 hover:text-white transition-colors cursor-pointer">
          <ChevronLeft strokeWidth={1} className="w-6 h-6" />
        </button>
        <div className="hero-pagination flex gap-2 items-center"></div>
        <button className="hero-next text-white/70 hover:text-white transition-colors cursor-pointer">
          <ChevronRight strokeWidth={1} className="w-6 h-6" />
        </button>
      </div>

      <style jsx global>{`
        .hero-swiper-wrapper .swiper-pagination-bullet-active {
          opacity: 1 !important;
          background: #A3B18A !important;
        }
        @keyframes slowZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
        .animate-slow-zoom {
          animation: slowZoom 20s alternate infinite linear;
        }
      `}</style>
    </section>
  );
}
