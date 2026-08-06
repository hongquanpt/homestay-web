"use client";

import Link from "next/link";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { RoomImageGallery } from "../room/RoomImageGallery";
import * as Icons from "lucide-react";
import React from "react";

export function RoomDetailDialog({ room, children }: { room: any; children: React.ReactElement }) {
  const allImages = room.images?.length > 0 ? room.images : [room.image];
  
  return (
    <Dialog>
      <DialogTrigger render={children} />
      <DialogContent className="max-w-5xl bg-white rounded-none border-0 p-0 overflow-hidden" showCloseButton={true}>
        <DialogTitle className="sr-only">Chi tiết phòng {room.name}</DialogTitle>
        <div className="flex flex-col md:flex-row h-[85vh] md:h-[650px] overflow-y-auto md:overflow-hidden custom-scrollbar bg-white">
          <div className="w-full md:w-[55%] bg-black shrink-0 relative md:h-full md:overflow-y-auto custom-scrollbar p-0 sm:p-4 md:p-6 flex items-center">
             <div className="w-full pt-8 md:pt-0 pb-4 md:pb-0 px-4 md:px-0">
               <RoomImageGallery images={allImages} type={room.type} />
             </div>
          </div>
          <div className="w-full md:w-[45%] p-6 md:p-12 flex flex-col md:h-full md:overflow-y-auto custom-scrollbar">
            <h2 className="text-3xl md:text-4xl font-oswald uppercase tracking-wider mb-2 text-zinc-900">{room.name}</h2>
            <p className="text-xl md:text-2xl text-primary font-light tracking-widest mb-6">{room.priceNight}</p>
            
            <div className="flex-1">
              <p className="text-sm font-light text-zinc-600 mb-8 leading-relaxed whitespace-pre-wrap">
                {room.description}
              </p>
              
              {room.amenities && room.amenities.length > 0 && (
                <div className="mb-8">
                  <h4 className="font-oswald tracking-widest text-zinc-900 mb-4 uppercase">Tiện ích bao gồm</h4>
                  <ul className="grid grid-cols-2 gap-3 text-xs text-zinc-600 font-light">
                    {room.amenities.map((a: string, i: number) => {
                      const getIcon = (name: string) => {
                        const n = name.toLowerCase();
                        if (n.includes("bếp") || n.includes("nấu")) return <Icons.Utensils className="w-4 h-4 text-primary shrink-0" />;
                        if (n.includes("netflix") || n.includes("tv") || n.includes("tivi")) return <Icons.Tv className="w-4 h-4 text-primary shrink-0" />;
                        if (n.includes("vòi sen") || n.includes("tắm")) return <Icons.Bath className="w-4 h-4 text-primary shrink-0" />;
                        if (n.includes("wifi") || n.includes("internet")) return <Icons.Wifi className="w-4 h-4 text-primary shrink-0" />;
                        if (n.includes("lạnh") || n.includes("điều hoà")) return <Icons.Snowflake className="w-4 h-4 text-primary shrink-0" />;
                        if (n.includes("giường") || n.includes("nệm")) return <Icons.BedDouble className="w-4 h-4 text-primary shrink-0" />;
                        if (n.includes("cà phê") || n.includes("trà") || n.includes("nước")) return <Icons.Coffee className="w-4 h-4 text-primary shrink-0" />;
                        if (n.includes("sấy")) return <Icons.Wind className="w-4 h-4 text-primary shrink-0" />;
                        return <Icons.Sparkles className="w-4 h-4 text-primary shrink-0" />;
                      };
                      return (
                        <li key={i} className="flex items-center gap-2">
                          {getIcon(a)}
                          <span className="leading-tight">{a}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
            
            {room.status === "COMING_SOON" ? (
              <button disabled className="inline-block border border-zinc-300 bg-zinc-100 text-zinc-400 px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-center w-full mt-6 shrink-0 cursor-not-allowed">
                SẮP RA MẮT
              </button>
            ) : (
              <Link href={`/booking?room=${room.id}`} className="inline-block border border-primary bg-primary text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-zinc-900 hover:border-zinc-900 transition-colors duration-300 text-center w-full mt-6 shrink-0">
                ĐẶT PHÒNG NGAY
              </Link>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
