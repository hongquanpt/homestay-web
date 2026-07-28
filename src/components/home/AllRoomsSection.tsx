"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Navigation } from 'swiper/modules';
import { RoomDetailDialog } from "./RoomDetailDialog";

import { useState, useEffect, useMemo } from "react";

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const CelestialFrame = () => (
  <svg 
    viewBox="0 0 200 320" 
    className="absolute inset-0 w-full h-full z-20 pointer-events-none" 
    fill="none" 
  >
    <g stroke="#d4b48f" strokeWidth="1.5">
      {/* Outer Pill */}
      <path d="M 20,100 A 80,80 0 0,1 180,100 L 180,220 A 80,80 0 0,1 20,220 Z" />
      {/* Middle Pill */}
      <path d="M 30,100 A 70,70 0 0,1 170,100 L 170,220 A 70,70 0 0,1 30,220 Z" />
      {/* Inner Pill */}
      <path d="M 40,100 A 60,60 0 0,1 160,100 L 160,220 A 60,60 0 0,1 40,220 Z" />

      {/* Planetary Ring */}
      <ellipse cx="100" cy="230" rx="90" ry="25" transform="rotate(-15, 100, 230)" />
    </g>

    <g fill="#d4b48f">
      {/* Top Star */}
      <path d="M 100,0 Q 100,20 115,20 Q 100,20 100,40 Q 100,20 85,20 Q 100,20 100,0 Z" />
      {/* Bottom Star */}
      <path d="M 100,280 Q 100,300 115,300 Q 100,300 100,320 Q 100,300 85,300 Q 100,300 100,280 Z" />
      
      {/* Small Stars */}
      <path d="M 130,30 Q 130,40 138,40 Q 130,40 130,50 Q 130,40 122,40 Q 130,40 130,30 Z" />
      <path d="M 80,250 Q 80,260 88,260 Q 80,260 80,270 Q 80,260 72,260 Q 80,260 80,250 Z" />
      <path d="M 130,302 Q 130,310 136,310 Q 130,310 130,318 Q 130,310 124,310 Q 130,310 130,302 Z" />
    </g>

    {/* Side Circles */}
    <circle cx="20" cy="120" r="4" fill="#18181b" stroke="#d4b48f" strokeWidth="1.5" />
    <circle cx="180" cy="200" r="4" fill="#18181b" stroke="#d4b48f" strokeWidth="1.5" />
  </svg>
);

export function AllRoomsSection({ rooms, homestayName }: { rooms: any[]; homestayName?: string }) {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

  useEffect(() => {
    const handleFacilityChange = (e: CustomEvent) => {
      setSelectedFacilityId(e.detail);
    };
    window.addEventListener('facilityChange', handleFacilityChange as EventListener);
    return () => window.removeEventListener('facilityChange', handleFacilityChange as EventListener);
  }, []);

  const filteredRooms = useMemo(() => {
    if (!selectedFacilityId) return rooms;
    return rooms.filter(r => r.facilityId === selectedFacilityId);
  }, [rooms, selectedFacilityId]);

  if (!filteredRooms || filteredRooms.length === 0) return null;

  return (
    <section id="rooms" className="py-24 bg-transparent relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-oswald uppercase tracking-[0.2em] text-zinc-900 inline-block border-b border-zinc-900 pb-2 mb-6">
            DANH SÁCH PHÒNG
          </h2>
        </div>

        {/* Coverflow Carousel */}
        <div className="w-full relative mt-16 swiper-architect-container">
          <Swiper
            key={selectedFacilityId || 'all'}
            effect={'coverflow'}
            grabCursor={true}
            centeredSlides={true}
            slidesPerView={'auto'}
            loop={filteredRooms.length > 2}
            observer={true}
            observeParents={true}
            coverflowEffect={{
              rotate: 0,
              stretch: 80,
              depth: 250,
              modifier: 1,
              slideShadows: true,
            }}
            pagination={{ clickable: true }}
            navigation={{
              prevEl: '.rooms-prev',
              nextEl: '.rooms-next',
            }}
            modules={[EffectCoverflow, Pagination, Navigation]}
            className="w-full h-[400px] md:h-[600px] rooms-swiper"
          >
            {filteredRooms.map((room) => (
              <SwiperSlide key={room.id} className="max-w-[320px] md:max-w-[360px] w-full aspect-[5/8] relative group">
                <div className="w-full h-full relative overflow-visible bg-transparent flex items-center justify-center">
                  
                  {/* The exact SVG frame */}
                  <CelestialFrame />

                  {/* The Room Image perfectly fitted inside the inner pill */}
                  <div className="absolute top-[12.5%] bottom-[12.5%] left-[20%] right-[20%] rounded-[9999px] overflow-hidden bg-zinc-900 z-10 border border-[#d4b48f]/30">
                    <img 
                      src={room.image} 
                      alt={room.name} 
                      className="w-full h-full object-cover opacity-60 group-[.swiper-slide-active]:opacity-90 transition-opacity duration-700 hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  </div>
                  
                  {/* Content overlay on active slide */}
                  <div className="absolute inset-x-[20%] bottom-[14%] flex flex-col items-center justify-end opacity-0 group-[.swiper-slide-active]:opacity-100 transition-opacity duration-500 delay-300 z-30">
                    <h3 className="text-xl md:text-2xl font-oswald font-bold uppercase text-[#d4b48f] mb-1 drop-shadow-md text-center">{room.name}</h3>
                    <p className="text-white/90 font-light tracking-wider text-[10px] md:text-xs mb-3 text-center">
                      giá từ: <span className="text-white font-bold">{room.priceNight}</span>
                    </p>
                    <div className="flex flex-col gap-2 w-[100px] md:w-[110px] mx-auto">
                      <RoomDetailDialog room={room}>
                        <button className="w-full inline-block border border-white/50 text-white bg-black/40 backdrop-blur-md py-1.5 text-[8px] md:text-[9px] uppercase tracking-[0.15em] hover:bg-white hover:text-black transition-colors">
                          chi tiết
                        </button>
                      </RoomDetailDialog>
                      <Link 
                        href={`/booking?room=${room.id}`}
                        className="w-full text-center inline-block border border-[#d4b48f] text-[#d4b48f] bg-black/40 backdrop-blur-md py-1.5 text-[8px] md:text-[9px] uppercase tracking-[0.15em] hover:bg-[#d4b48f] hover:text-black transition-colors"
                      >
                        đặt ngay
                      </Link>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          
          {/* Custom Navigation for Mobile */}
          <div className="absolute top-1/2 -translate-y-1/2 left-2 z-10 md:hidden">
            <button className="rooms-prev w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-2 z-10 md:hidden">
            <button className="rooms-next w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .swiper-architect-container .swiper-pagination-bullet {
          background: #A3B18A;
          opacity: 0.5;
        }
        .swiper-architect-container .swiper-pagination-bullet-active {
          opacity: 1;
        }
        .rooms-swiper .swiper-button-next,
        .rooms-swiper .swiper-button-prev {
          color: #A3B18A !important;
          transform: scale(0.6);
        }
        @media (max-width: 768px) {
          .rooms-swiper .swiper-button-next,
          .rooms-swiper .swiper-button-prev {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
