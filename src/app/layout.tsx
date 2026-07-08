import type { Metadata } from "next";
import { Montserrat, Oswald } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { trackAndCheckIp } from "@/lib/ip-tracking";
import { ShieldAlert } from "lucide-react";

const fontJost = Montserrat({
  variable: "--font-jost",
  subsets: ["latin", "latin-ext", "vietnamese"],
});

const fontOswald = Oswald({
 variable: "--font-oswald",
 subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Homestay Booking | Hệ thống đặt phòng nhanh chóng",
  description: "Trải nghiệm đặt phòng homestay tiện lợi, nhanh chóng và an toàn.",
};

export default async function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 const checkIp = await trackAndCheckIp();

 if (checkIp.isBlocked) {
 return (
 <html lang="en" data-scroll-behavior="smooth" className={`${fontJost.variable} ${fontOswald.variable} h-full antialiased`}>
 <body className="min-h-full flex items-center justify-center bg-zinc-50 p-4">
 <div className="max-w-md w-full bg-white border border-red-200 rounded-2xl p-8 text-center shadow-2xl">
 <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
 <ShieldAlert className="w-8 h-8" />
 </div>
 <h1 className="text-2xl font-bold text-zinc-900 mb-3">Truy cập bị từ chối</h1>
 <p className="text-zinc-600 mb-6 leading-relaxed">
 Địa chỉ IP của bạn ({checkIp.ip}) đã bị hạn chế truy cập vào hệ thống.
 </p>
 <div className="bg-red-50 rounded-xl p-4 text-sm text-red-800 font-medium">
 Lý do: {checkIp.reason}
 </div>
 <p className="mt-8 text-xs text-zinc-400">
 Vui lòng liên hệ bộ phận hỗ trợ nếu bạn cho rằng đây là sự nhầm lẫn.
 </p>
 </div>
 </body>
 </html>
 );
 }

 return (
 <html
 lang="en"
 data-scroll-behavior="smooth"
 className={`${fontJost.variable} ${fontOswald.variable} h-full antialiased font-jost`}
 >
 <body className="min-h-full flex flex-col">
 <SessionProvider>
 {children}
 </SessionProvider>
 </body>
 </html>
 );
}
