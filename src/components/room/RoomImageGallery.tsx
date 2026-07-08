"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function RoomImageGallery({ images, type }: { images: string[], type: string }) {
  const [currentImage, setCurrentImage] = useState(0);

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="space-y-4">
      {/* Image slider */}
      <div className="relative overflow-hidden bg-black aspect-[16/10] group">
        <img
          src={images[currentImage] || "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80"}
          alt={`Ảnh ${currentImage + 1}`}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        <button
          onClick={prevImage}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-colors opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft strokeWidth={1} className="w-5 h-5" />
        </button>
        <button
          onClick={nextImage}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-colors opacity-0 group-hover:opacity-100"
        >
          <ChevronRight strokeWidth={1} className="w-5 h-5" />
        </button>

        {/* Type badge */}
        <div className="absolute top-4 left-4">
          <span className="px-4 py-1.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-oswald tracking-widest uppercase border border-white/20">
            {type}
          </span>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentImage(idx)}
            className={`flex-shrink-0 w-24 h-16 overflow-hidden border transition-all ${
              idx === currentImage
                ? "border-primary opacity-100"
                : "border-transparent opacity-50 hover:opacity-100"
            }`}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
