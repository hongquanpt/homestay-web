"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Phone } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "motion/react";

export function HomeHeader({ hotline, homestayName, hasBanner = false }: { hotline: string; homestayName: string; hasBanner?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  const [firstWord, ...rest] = homestayName.split(' ');
  const secondPart = rest.join(' ');

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed ${hasBanner ? 'top-10' : 'top-0'} left-0 right-0 z-50 transition-colors duration-500 border-b ${isScrolled
          ? "bg-white shadow-sm border-zinc-200"
          : "bg-transparent border-transparent"
        }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex items-center justify-between h-24">
        {/* Logo Area */}
        <Link href="/" className="flex items-center gap-3 group">
          <Home strokeWidth={1} className={`w-8 h-8 transition-colors ${isScrolled ? 'text-zinc-900' : 'text-white'}`} />
          <div className="flex flex-col leading-none">
            <span className={`text-lg font-bold font-oswald tracking-[0.15em] transition-colors ${isScrolled ? "text-zinc-900" : "text-white"}`}>
              {firstWord}
            </span>
            <span className={`text-sm font-medium tracking-[0.2em] uppercase transition-colors ${isScrolled ? "text-primary" : "text-primary"}`}>
              {secondPart || "HOME"}
            </span>
          </div>
        </Link>

        {/* Navigation / Contacts */}
        <div className="flex items-center gap-12">
          <nav className={`hidden md:flex items-center gap-8 text-xs font-light tracking-[0.1em] uppercase transition-colors ${isScrolled ? "text-zinc-600" : "text-white/80"}`}>
            <Link href="#rooms" className="hover:text-primary transition-colors">PHÒNG</Link>
            <Link href="#booking-board" className="hover:text-primary transition-colors">BẢNG ĐẶT PHÒNG</Link>
            <Link href="#promotions" className="hover:text-primary transition-colors">KHUYẾN MÃI</Link>
          </nav>

          <div className="flex items-center gap-8">
            <Link
              href="#contact"
              className={`hidden sm:flex items-center gap-2 text-xs font-light tracking-[0.1em] uppercase transition-colors hover:text-primary ${isScrolled ? "text-zinc-600" : "text-white/80"}`}
            >
              <span>LIÊN HỆ</span>
            </Link>
            <Link
              href="/booking"
              className={`text-xs font-light tracking-[0.1em] uppercase transition-colors hover:text-primary ${isScrolled ? "text-zinc-900 font-medium" : "text-white"}`}
            >
              ĐẶT PHÒNG
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
