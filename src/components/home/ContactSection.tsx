"use client";

import { Phone, Mail, MapPin, MessageCircle, BedDouble } from "lucide-react";
import Link from "next/link";

interface ContactSectionProps {
  hotline: string;
  address: string;
  email: string;
  zalo: string;
  facebook: string;
  tiktok?: string;
  instagram?: string;
  homestayName: string;
}

export function ContactSection({ hotline, address, email, zalo, facebook, tiktok, instagram, homestayName }: ContactSectionProps) {
  // Extract coordinates or use a general search query for the map
  const mapQuery = encodeURIComponent(address || homestayName);

  return (
    <section id="contact" className="py-24 bg-transparent border-t border-zinc-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-oswald uppercase tracking-[0.2em] text-zinc-900 inline-block border-b border-zinc-900 pb-2 mb-6">
            LIÊN HỆ
          </h2>
          <p className="text-zinc-500 font-light tracking-wider text-sm sm:text-base uppercase max-w-2xl mx-auto">
            Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7. Vui lòng liên hệ qua các kênh trực tuyến hoặc ghé thăm trực tiếp.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Info */}
          <div className="flex flex-col gap-12">
            <div>
              <h3 className="text-xl font-oswald uppercase tracking-widest text-zinc-900 mb-8 border-b border-zinc-200 pb-4">
                THÔNG TIN LIÊN LẠC
              </h3>
              <div className="space-y-8 text-zinc-600 font-light tracking-wide">
                
                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 border border-zinc-200 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-colors duration-300">
                    <MapPin strokeWidth={1} className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-oswald uppercase tracking-widest text-zinc-900 mb-1">Địa chỉ</h4>
                    <p className="leading-relaxed">{address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 border border-zinc-200 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-colors duration-300">
                    <Phone strokeWidth={1} className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-oswald uppercase tracking-widest text-zinc-900 mb-1">Điện thoại</h4>
                    <a href={`tel:${hotline.replace(/\s+/g, '')}`} className="hover:text-primary transition-colors">{hotline}</a>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 border border-zinc-200 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-colors duration-300">
                    <Mail strokeWidth={1} className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-oswald uppercase tracking-widest text-zinc-900 mb-1">Email</h4>
                    <a href={`mailto:${email}`} className="hover:text-primary transition-colors">{email}</a>
                  </div>
                </div>

              </div>
            </div>

            <div>
              <h3 className="text-xl font-oswald uppercase tracking-widest text-zinc-900 mb-8 border-b border-zinc-200 pb-4">
                THEO DÕI CHÚNG MÌNH QUA
              </h3>
              <div className="flex flex-wrap gap-4">
                <a 
                  href={facebook.startsWith('http') ? facebook : `https://${facebook}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-12 h-12 border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-primary hover:border-primary hover:text-white transition-colors duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                <a 
                  href={`https://zalo.me/${zalo.replace(/\s+/g, '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-12 h-12 border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-primary hover:border-primary hover:text-white transition-colors duration-300"
                  title="Zalo"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 11.5C21 6.25 16.97 2 12 2C7.03 2 3 6.25 3 11.5C3 16.75 7.03 21 12 21C13.44 21 14.79 20.66 16 20.04L20.5 21.5L19.26 17.16C20.36 15.59 21 13.63 21 11.5Z" />
                    <text x="12" y="14.5" fill="currentColor" stroke="none" fontSize="8" fontWeight="bold" textAnchor="middle">Zalo</text>
                  </svg>
                </a>
                {tiktok && (
                  <a 
                    href={tiktok.startsWith('http') ? tiktok : `https://${tiktok}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-12 h-12 border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-primary hover:border-primary hover:text-white transition-colors duration-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 448 512" fill="currentColor">
                      <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
                    </svg>
                  </a>
                )}
                {instagram && (
                  <a 
                    href={instagram.startsWith('http') ? instagram : `https://${instagram}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-12 h-12 border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-primary hover:border-primary hover:text-white transition-colors duration-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="w-full h-[400px] lg:h-full min-h-[400px] bg-zinc-100 relative">
            <iframe
              title="Google Map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}
