"use client";

import { motion, useReducedMotion } from "motion/react";

export function FeatureSection() {
 const reduce = useReducedMotion();

 const features = [
    {
      icon: <span className="text-4xl font-light text-primary">01</span>,
      title: "Tự động hoàn toàn",
      desc: "Đặt phòng, thanh toán và nhận mã cửa tự động trong 1 phút.",
    },
    {
      icon: <span className="text-4xl font-light text-primary">02</span>,
      title: "Riêng tư tuyệt đối",
      desc: "Không gian của riêng bạn. Check-in/out tự do, bảo mật 100%.",
    },
    {
      icon: <span className="text-4xl font-light text-primary">03</span>,
      title: "Giải trí đỉnh cao",
      desc: "Smart TV siêu lớn tích hợp Netflix Premium. Wifi riêng tốc độ cao.",
    },
    {
      icon: <span className="text-4xl font-light text-primary">04</span>,
      title: "Sạch sẽ tinh tươm",
      desc: "Tiêu chuẩn vệ sinh khách sạn 5 sao. Không gian luôn thơm mát.",
    }
 ];

 const containerVariants = {
 hidden: { opacity: 0 },
 visible: {
 opacity: 1,
 transition: {
 staggerChildren: 0.15
 }
 }
 };

 const itemVariants: any = {
 hidden: { opacity: 0, y: 40 },
 visible: { 
 opacity: 1, 
 y: 0,
 transition: { type: "spring", stiffness: 100, damping: 15 }
 }
 };

 return (
 <section id="why-us" className="py-24 bg-transparent border-t border-zinc-100">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <motion.div 
 initial={{ opacity: 0, y: reduce ? 0 : 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: "-100px" }}
 transition={{ duration: reduce ? 0.2 : 0.5 }}
 className="text-center mb-16"
 >
 <h2 className="text-3xl sm:text-4xl font-oswald uppercase tracking-[0.2em] text-zinc-900 inline-block border-b border-zinc-900 pb-2 mb-2">
 VÌ SAO CHỌN CHÚNG TÔI
 </h2>
 <p className="mt-4 text-lg text-zinc-500 max-w-2xl mx-auto font-medium">
 Trải nghiệm nghỉ dưỡng hoàn hảo và tiện lợi nhất.
 </p>
 </motion.div>

 <motion.div 
 variants={containerVariants}
 initial="hidden"
 whileInView="visible"
 viewport={{ once: true, margin: "-50px" }}
 className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
 >
 {features.map((f, idx) => (
 <motion.div 
 key={idx}
 variants={itemVariants}
 className="group p-8 border border-zinc-200 bg-white hover:border-primary transition-colors duration-500"
 >
 <div className="mb-6 font-oswald">
 {f.icon}
 </div>
 <h3 className="text-xl font-oswald uppercase tracking-widest text-zinc-900 mb-3">
 {f.title}
 </h3>
 <p className="text-zinc-500 leading-relaxed font-light text-sm">
 {f.desc}
 </p>
 </motion.div>
 ))}
 </motion.div>
  </div>
  </section>
 );
}
