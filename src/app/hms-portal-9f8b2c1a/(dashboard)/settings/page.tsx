"use client";

import { useState, useEffect } from "react";
import { Save, Building, Mail, CreditCard, Shield, ImageIcon, Upload, X } from "lucide-react";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const timeOptions = Array.from({ length: 24 }).map((_, i) => {
 const h = i.toString().padStart(2, '0');
 return `${h}:00`;
});

export default function AdminSettingsPage() {
 const [activeTab, setActiveTab] = useState("general");
 const [settings, setSettings] = useState<Record<string, string>>({
 homestay_name: "",
 hotline: "",
 contact_email: "",
 address: "",
 fanpage_url: "",
 tiktok_url: "",
 instagram_url: "",
 zalo: "",
 house_rules: "",
 smtp_host: "",
 smtp_port: "",
 smtp_from: "",
 smtp_user: "",
 smtp_pass: "",
 bank_bin: "",
 bank_account_name: "",
 bank_account_no: "",
 bank_prefix: "",
 payos_client_id: "",
 payos_api_key: "",
 payos_checksum_key: "",
 cash_payment_start_time: "",
 cash_payment_end_time: "",
 admin_notification_email: "",
 telegram_bot_token: "",
 telegram_chat_id: "",
 promo_banner_1: "",
 promo_banner_2: "",
 promo_banner_3: "",
 promo_banner_4: "",
 });
 const [uploadingBanner, setUploadingBanner] = useState<string | null>(null);
 const bannerInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
 const [loading, setLoading] = useState(true);
 const { toast } = useToast();

 const fetchData = async () => {
 setLoading(true);
 try {
 const res = await fetch('/api/settings');
 const data = await res.json();
 // Merge with default keys to ensure all inputs are controlled
 setSettings(prev => ({ ...prev, ...data }));
 } catch (e) {
 console.error(e);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchData();
 }, []);

 const handleSave = async () => {
 try {
 const res = await fetch('/api/settings', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(settings)
 });
 if (res.ok) {
 toast({ title: "Thành công", description: "Lưu cấu hình thành công!" });
 } else {
 const err = await res.json();
 toast({ title: "Lỗi", description: err.error, variant: "destructive" });
 }
 } catch (e) {
 toast({ title: "Lỗi", description: "Có lỗi xảy ra khi lưu", variant: "destructive" });
 }
 };

 const handleChange = (key: string, value: string) => {
 setSettings(prev => ({ ...prev, [key]: value }));
 };

 return (
 <div className="space-y-6 max-w-5xl">
 <div>
 <h1 className="text-2xl font-bold text-zinc-900 ">Cài đặt Hệ thống</h1>
 <p className="text-sm text-zinc-500 mt-1">Cấu hình thông tin chung, thanh toán, và email gửi tự động.</p>
 </div>

 <div className="flex flex-col md:flex-row gap-6">
 {/* Sidebar */}
 <div className="w-full md:w-64 shrink-0 space-y-1">
 <button
 onClick={() => setActiveTab("general")}
 className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
 activeTab === "general"
 ? "bg-primary/5 text-primary "
 : "text-zinc-600 hover:bg-zinc-50 :bg-zinc-800/50"
 }`}
 >
 <Building className="w-4 h-4" /> Thông tin Homestay
 </button>
  <button
  onClick={() => setActiveTab("email")}
  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
  activeTab === "email"
  ? "bg-primary/5 text-primary "
  : "text-zinc-600 hover:bg-zinc-50 :bg-zinc-800/50"
  }`}
  >
  <Mail className="w-4 h-4" /> Thông báo & Email
  </button>
 <button
 onClick={() => setActiveTab("payment")}
 className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
 activeTab === "payment"
 ? "bg-primary/5 text-primary "
 : "text-zinc-600 hover:bg-zinc-50 :bg-zinc-800/50"
 }`}
 >
 <CreditCard className="w-4 h-4" /> Cấu hình Thanh toán
 </button>
 <button
 onClick={() => setActiveTab("security")}
 className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
 activeTab === "security"
 ? "bg-primary/5 text-primary "
 : "text-zinc-600 hover:bg-zinc-50 :bg-zinc-800/50"
 }`}
 >
 <Shield className="w-4 h-4" /> Bảo mật & Khác
 </button>
 <button
  onClick={() => setActiveTab("banners")}
  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
  activeTab === "banners"
  ? "bg-primary/5 text-primary "
  : "text-zinc-600 hover:bg-zinc-50"
  }`}
  >
  <ImageIcon className="w-4 h-4" /> Banner Trang chủ
  </button>
 </div>

 {/* Content */}
 <div className="flex-1 bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
 {loading ? (
 <div className="py-12 text-center text-zinc-500">Đang tải cấu hình...</div>
 ) : (
 <>
 {activeTab === "general" && (
 <div className="space-y-6">
 <h2 className="text-lg font-bold text-zinc-900 border-b border-zinc-200 pb-3">Thông tin Homestay</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <Label>Tên Homestay</Label>
 <Input value={settings.homestay_name} onChange={e => handleChange('homestay_name', e.target.value)} className="mt-1.5" />
 </div>
 <div>
 <Label>Hotline</Label>
 <Input value={settings.hotline} onChange={e => handleChange('hotline', e.target.value)} className="mt-1.5" />
 </div>
 <div>
 <Label>Email CSKH</Label>
 <Input value={settings.contact_email || ''} onChange={e => handleChange('contact_email', e.target.value)} placeholder="cskh@homestay.com" className="mt-1.5" />
 </div>
 <div className="md:col-span-2">
 <Label>Địa chỉ chính</Label>
 <Input value={settings.address} onChange={e => handleChange('address', e.target.value)} className="mt-1.5" />
 </div>
  <div className="md:col-span-2">
  <Label>Fanpage URL</Label>
  <Input value={settings.fanpage_url || ''} onChange={e => handleChange('fanpage_url', e.target.value)} className="mt-1.5" />
  </div>
  <div className="md:col-span-2">
  <Label>TikTok URL</Label>
  <Input value={settings.tiktok_url || ''} onChange={e => handleChange('tiktok_url', e.target.value)} className="mt-1.5" placeholder="https://tiktok.com/@homestay" />
  </div>
  <div className="md:col-span-2">
  <Label>Instagram URL</Label>
  <Input value={settings.instagram_url || ''} onChange={e => handleChange('instagram_url', e.target.value)} className="mt-1.5" placeholder="https://instagram.com/homestay" />
  </div>
  <div className="md:col-span-2">
  <Label>Số Zalo (hoặc Link Zalo)</Label>
  <Input value={settings.zalo || ''} onChange={e => handleChange('zalo', e.target.value)} className="mt-1.5" placeholder="VD: 0901234567" />
  </div>
 </div>
 </div>
 )}

 {activeTab === "email" && (
   <div className="space-y-6">
   <h2 className="text-lg font-bold text-zinc-900 border-b border-zinc-200 pb-3">Kênh Nhận Thông Báo (Khi có đơn mới)</h2>
   
   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
     {/* Cấu hình Telegram */}
     <div className="bg-[#2ca5e0]/5 p-4 rounded-xl border border-[#2ca5e0]/30 md:col-span-2">
       <Label className="text-[#2ca5e0] font-bold">Telegram Bot Thông báo</Label>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1.5">
         <div>
           <Label className="text-xs text-zinc-600">Bot Token</Label>
           <Input 
             value={settings.telegram_bot_token || ''} 
             onChange={e => handleChange('telegram_bot_token', e.target.value)} 
             placeholder="1234567890:ABCdefGhI..." 
             className="mt-1 bg-white" 
           />
         </div>
         <div>
           <Label className="text-xs text-zinc-600">Chat ID</Label>
           <Input 
             value={settings.telegram_chat_id || ''} 
             onChange={e => handleChange('telegram_chat_id', e.target.value)} 
             placeholder="-1001234567890" 
             className="mt-1 bg-white" 
           />
         </div>
       </div>
       <p className="text-xs text-zinc-500 mt-3 leading-relaxed">Nhận tin nhắn Telegram ngay lập tức khi có khách chốt phòng.</p>
     </div>
   </div>

   <h2 className="text-lg font-bold text-zinc-900 border-b border-zinc-200 pb-3">Cấu hình Email Gửi đi (Nodemailer SMTP)</h2>
   <p className="text-sm text-zinc-500">Thông tin này được dùng để gửi email từ hệ thống (gửi mật khẩu phòng cho khách, gửi thông báo cho Admin...).</p>


  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="md:col-span-2">
 <Label>SMTP Host</Label>
 <Input value={settings.smtp_host} onChange={e => handleChange('smtp_host', e.target.value)} placeholder="smtp.gmail.com" className="mt-1.5" />
 </div>
 <div>
 <Label>SMTP Port</Label>
 <Input value={settings.smtp_port} onChange={e => handleChange('smtp_port', e.target.value)} placeholder="587" className="mt-1.5" />
 </div>
 <div>
 <Label>Email người gửi (From)</Label>
 <Input value={settings.smtp_from} onChange={e => handleChange('smtp_from', e.target.value)} className="mt-1.5" />
 </div>
 <div>
 <Label>SMTP Username</Label>
 <Input value={settings.smtp_user} onChange={e => handleChange('smtp_user', e.target.value)} className="mt-1.5" />
 </div>
 <div>
 <Label>SMTP Password (App Password)</Label>
 <Input type="password" value={settings.smtp_pass} onChange={e => handleChange('smtp_pass', e.target.value)} placeholder="********" className="mt-1.5" />
 </div>
 </div>
 </div>
 )}

 {activeTab === "payment" && (
 <div className="space-y-6">
          <h2 className="text-lg font-bold text-zinc-900 border-b border-zinc-200 pb-3">Cấu hình Thanh toán (PayOS)</h2>
          <p className="text-sm text-zinc-500">Hệ thống sẽ dùng thông tin này để tự động tạo link thanh toán PayOS và duyệt đơn.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>PayOS Client ID</Label>
              <Input value={settings.payos_client_id} onChange={e => handleChange('payos_client_id', e.target.value)} placeholder="Nhập Client ID" className="mt-1.5" />
            </div>
            <div className="md:col-span-2">
              <Label>PayOS API Key</Label>
              <Input value={settings.payos_api_key} onChange={e => handleChange('payos_api_key', e.target.value)} placeholder="Nhập API Key" className="mt-1.5" />
            </div>
            <div className="md:col-span-2">
              <Label>PayOS Checksum Key</Label>
              <Input value={settings.payos_checksum_key} onChange={e => handleChange('payos_checksum_key', e.target.value)} placeholder="Nhập Checksum Key" className="mt-1.5" />
            </div>
          </div>



 <h3 className="text-md font-bold text-zinc-900 mt-8 mb-4 border-b border-zinc-200 pb-2">Thiết lập khung giờ Tiền mặt</h3>
 <p className="text-sm text-zinc-500 mb-4">Khách hàng chỉ được phép chọn thanh toán Tiền mặt trong khoảng thời gian này. Để trống nếu muốn cho phép thanh toán 24/24.</p>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <Label>Giờ bắt đầu</Label>
 <select
 value={settings.cash_payment_start_time || ''}
 onChange={e => handleChange('cash_payment_start_time', e.target.value)}
 className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
 >
 <option value="">-- Bất kỳ lúc nào --</option>
 {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
 </select>
 </div>
 <div>
 <Label>Giờ kết thúc</Label>
 <select
 value={settings.cash_payment_end_time || ''}
 onChange={e => handleChange('cash_payment_end_time', e.target.value)}
 className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
 >
 <option value="">-- Bất kỳ lúc nào --</option>
 {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
 </select>
 </div>
 </div>
 </div>
 )}

  {activeTab === "banners" && (
  <div className="space-y-6">
  <h2 className="text-lg font-bold text-zinc-900 border-b border-zinc-200 pb-3">Banner Khuyến mãi Trang chủ</h2>
  <p className="text-sm text-zinc-500">Upload 4 hình ảnh khuyến mãi hiển thị xung quanh khung giờ trống trên trang chủ. Khuyến nghị kích thước 600x450px.</p>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {[1, 2, 3, 4].map(n => {
    const key = `promo_banner_${n}` as string;
    const pos = n === 1 ? 'Trên - Trái' : n === 2 ? 'Trên - Phải' : n === 3 ? 'Dưới - Trái' : 'Dưới - Phải';
    return (
      <div key={n} className="space-y-3">
        <Label className="text-sm font-semibold">Banner {n} <span className="font-normal text-zinc-400">({pos})</span></Label>
        <div className="relative aspect-[4/3] rounded-xl border-2 border-dashed border-zinc-300 overflow-hidden bg-zinc-50 hover:border-primary/50 transition-colors group">
          {settings[key] ? (
            <>
              <img src={settings[key]} alt={`Banner ${n}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => bannerInputRefs.current[key]?.click()}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-zinc-50"
                  title="Thay đổi"
                >
                  <Upload className="w-4 h-4 text-zinc-700" />
                </button>
                <button
                  onClick={() => handleChange(key, '')}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50"
                  title="Xóa"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => bannerInputRefs.current[key]?.click()}
              className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer"
            >
              {uploadingBanner === key ? (
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-zinc-300" />
                  <span className="text-xs text-zinc-400">Click để upload</span>
                </>
              )}
            </button>
          )}
          <input
            ref={el => { bannerInputRefs.current[key] = el; }}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadingBanner(key);
              try {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.url) {
                  handleChange(key, data.url);
                  toast({ title: 'Thành công', description: `Đã upload banner ${n}` });
                }
              } catch (err) {
                toast({ title: 'Lỗi', description: 'Upload thất bại', variant: 'destructive' });
              } finally {
                setUploadingBanner(null);
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>
    );
  })}
  </div>
  </div>
  )}

 <div className="mt-8 pt-6 border-t border-zinc-200 flex justify-end">
 <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary">
 <Save className="w-4 h-4 mr-2" />
 Lưu thay đổi
 </Button>
 </div>
 </>
 )}
 </div>
 </div>
 </div>
 );
}
