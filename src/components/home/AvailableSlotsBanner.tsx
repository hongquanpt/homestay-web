"use client";

import { motion } from "motion/react";
import Link from "next/link";

export function AvailableSlotsBanner({ availableSlots }: { availableSlots: number }) {
  return (
    <div className="bg-white border-b border-zinc-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          className="flex flex-col md:flex-row items-center justify-between gap-6 bg-zinc-50 p-8 md:p-10 border border-zinc-200"
        >
          <div className="text-center md:text-left">
            {availableSlots > 0 ? (
              <>
                <h3 className="text-2xl md:text-3xl font-oswald uppercase tracking-widest text-zinc-900 mb-3">
                  Hôm nay còn <span className="text-primary">{availableSlots}</span> khung giờ trống
                </h3>
                <p className="text-zinc-500 font-light text-sm md:text-base max-w-2xl">
                  Nhanh tay đặt phòng để giữ chỗ và nhận ưu đãi tốt nhất ngay hôm nay.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-2xl md:text-3xl font-oswald uppercase tracking-widest text-zinc-900 mb-3">
                  Hết khung trống trong hôm nay rồi!
                </h3>
                <p className="text-zinc-500 font-light text-sm md:text-base max-w-2xl">
                  Bạn có thể tham khảo các khung giờ hôm sau tại bảng đặt phòng bên dưới.
                </p>
              </>
            )}
          </div>
          <Link
            href="#booking-board"
            className="shrink-0 inline-block px-10 py-4 border border-primary bg-primary text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-zinc-900 hover:border-zinc-900 transition-colors duration-300"
          >
            ĐẶT NGAY
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
