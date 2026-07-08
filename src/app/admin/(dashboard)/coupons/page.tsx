"use client";

import { useState, useEffect } from "react";
import { 
 Search, 
 Plus, 
 MoreVertical, 
 Edit, 
 Trash2, 
 Ticket
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";

export default function AdminCouponsPage() {
 const [searchTerm, setSearchTerm] = useState("");
 const [coupons, setCoupons] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const { toast } = useToast();
 const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

 const [isOpen, setIsOpen] = useState(false);
 const [editId, setEditId] = useState<string | null>(null);
 const [formData, setFormData] = useState({
 code: "",
 discountPct: "",
 discountAmt: "",
 validFrom: "",
 validTo: "",
 maxUsage: "",
 isPublic: true,
 autoSendAfterBookings: ""
 });

  const [multiSlotSettings, setMultiSlotSettings] = useState({
    discount_2_slots: "5",
    discount_3_slots: "10",
    discount_4_slots: "15",
    early_booking_days: "0",
    early_booking_discount_pct: "0"
  });
  const [savingSettings, setSavingSettings] = useState(false);

 const fetchData = async () => {
 setLoading(true);
 try {
 const res = await fetch('/api/coupons');
 const data = await res.json();
 setCoupons(data);

      const settingsRes = await fetch('/api/settings');
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setMultiSlotSettings({
          discount_2_slots: settings.multi_slot_discount_2 || "5",
          discount_3_slots: settings.multi_slot_discount_3 || "10",
          discount_4_slots: settings.multi_slot_discount_4 || "15",
          early_booking_days: settings.early_booking_days || "0",
          early_booking_discount_pct: settings.early_booking_discount_pct || "0"
        });
      }
 } catch (e) {
 console.error(e);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchData();
 }, []);

 const resetForm = () => {
 setEditId(null);
 setFormData({ code: "", discountPct: "", discountAmt: "", validFrom: "", validTo: "", maxUsage: "", isPublic: true, autoSendAfterBookings: "" });
 };

 const handleSave = async () => {
 try {
 const payload = {
 code: formData.code,
 discountPct: formData.discountPct ? parseFloat(formData.discountPct) : null,
 discountAmt: formData.discountAmt ? parseFloat(formData.discountAmt) : null,
 validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : "",
 validTo: formData.validTo ? new Date(formData.validTo).toISOString() : "",
 maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : null,
 isPublic: formData.isPublic,
 autoSendAfterBookings: formData.autoSendAfterBookings ? parseInt(formData.autoSendAfterBookings) : null
 };

 const url = editId ? `/api/coupons/${editId}` : '/api/coupons';
 const method = editId ? 'PUT' : 'POST';

 const res = await fetch(url, {
 method,
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload)
 });
 
 if (res.ok) {
 setIsOpen(false);
 resetForm();
 fetchData();
 toast({ title: "Thành công", description: "Lưu mã giảm giá thành công!" });
 } else {
 const err = await res.json();
 toast({ title: "Lỗi", description: err.error, variant: "destructive" });
 }
 } catch (e) {
 toast({ title: "Lỗi", description: "Có lỗi xảy ra", variant: "destructive" });
 }
 };

 const executeDelete = async () => {
 if (!confirmDeleteId) return;
 try {
 const res = await fetch(`/api/coupons/${confirmDeleteId}`, { method: 'DELETE' });
 if (res.ok) {
 fetchData();
 } else {
 const err = await res.json();
 toast({ title: "Lỗi", description: err.error, variant: "destructive" });
 }
 } catch (e) {
 toast({ title: "Lỗi", description: "Có lỗi xảy ra", variant: "destructive" });
 } finally {
 setConfirmDeleteId(null);
 }
 };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      const payload = {
        multi_slot_discount_2: multiSlotSettings.discount_2_slots,
        multi_slot_discount_3: multiSlotSettings.discount_3_slots,
        multi_slot_discount_4: multiSlotSettings.discount_4_slots,
        early_booking_days: multiSlotSettings.early_booking_days,
        early_booking_discount_pct: multiSlotSettings.early_booking_discount_pct
      };
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast({ title: "Thành công", description: "Lưu cấu hình khuyến mãi thành công!" });
      } else {
        toast({ title: "Lỗi", description: "Không thể lưu cấu hình", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Lỗi", description: "Có lỗi xảy ra", variant: "destructive" });
    } finally {
      setSavingSettings(false);
    }
  };

 const openEdit = (coupon: any) => {
 setEditId(coupon.id);
 setFormData({
 code: coupon.code,
 discountPct: coupon.discountPct ? coupon.discountPct.toString() : "",
 discountAmt: coupon.discountAmt ? coupon.discountAmt.toString() : "",
 validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
 validTo: new Date(coupon.validTo).toISOString().split('T')[0],
 maxUsage: coupon.maxUsage ? coupon.maxUsage.toString() : "",
 isPublic: coupon.isPublic ?? true,
 autoSendAfterBookings: coupon.autoSendAfterBookings ? coupon.autoSendAfterBookings.toString() : ""
 });
 setIsOpen(true);
 };

 const filteredCoupons = coupons.filter(c => 
 c.code.toLowerCase().includes(searchTerm.toLowerCase())
 );

 return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <h1 className="text-2xl font-bold text-zinc-900 ">Mã giảm giá (Coupons)</h1>
 <p className="text-sm text-zinc-500 mt-1">Quản lý các chương trình khuyến mãi và voucher.</p>
 </div>
 
 <Dialog open={isOpen} onOpenChange={(open) => {
 setIsOpen(open);
 if (!open) resetForm();
 }}>
 <DialogTrigger className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white shadow-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500">
 <Plus className="w-4 h-4 mr-2" />
 Tạo mã mới
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>{editId ? "Chỉnh sửa mã giảm giá" : "Thêm mã giảm giá mới"}</DialogTitle>
 </DialogHeader>
 <div className="space-y-4 pt-4">
 <div>
 <Label>Mã Code</Label>
 <Input 
 value={formData.code}
 onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
 placeholder="VD: SUMMER2024" className="mt-1.5 uppercase" 
 />
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <Label>Giảm theo %</Label>
 <Input 
 type="number"
 value={formData.discountPct}
 onChange={e => setFormData({...formData, discountPct: e.target.value})}
 placeholder="10" className="mt-1.5" 
 />
 </div>
 <div>
 <Label>Giảm số tiền trực tiếp</Label>
 <Input 
 type="number"
 value={formData.discountAmt}
 onChange={e => setFormData({...formData, discountAmt: e.target.value})}
 placeholder="50000" className="mt-1.5" 
 />
 </div>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <Label>Từ ngày</Label>
 <Input 
 type="date"
 value={formData.validFrom}
 onChange={e => setFormData({...formData, validFrom: e.target.value})}
 className="mt-1.5" 
 />
 </div>
 <div>
 <Label>Đến ngày</Label>
 <Input 
 type="date"
 value={formData.validTo}
 onChange={e => setFormData({...formData, validTo: e.target.value})}
 className="mt-1.5" 
 />
 </div>
 </div>
 <div>
 <Label>Giới hạn lượt sử dụng (để trống nếu không giới hạn)</Label>
 <Input 
 type="number"
 value={formData.maxUsage}
 onChange={e => setFormData({...formData, maxUsage: e.target.value})}
 placeholder="100" className="mt-1.5" 
 />
 </div>
 <div className="flex items-center gap-2">
 <input 
 type="checkbox" 
 id="isPublic"
 checked={formData.isPublic}
 onChange={e => setFormData({...formData, isPublic: e.target.checked})}
 className="rounded border-zinc-300 text-primary focus:ring-amber-500 w-4 h-4"
 />
 <Label htmlFor="isPublic">Hiển thị công khai trên giao diện người dùng (Trang chủ)</Label>
 </div>
 <div>
 <Label>Tự động gửi mã (qua Email) sau số lần đặt phòng (để trống hoặc 0 nếu không áp dụng)</Label>
 <Input 
 type="number"
 value={formData.autoSendAfterBookings}
 onChange={e => setFormData({...formData, autoSendAfterBookings: e.target.value})}
 placeholder="Ví dụ: 1 (Gửi sau lần đặt đầu tiên)" className="mt-1.5" 
 />
 </div>
 <div className="pt-2 flex justify-end gap-2">
 <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
 <Button onClick={handleSave}>Lưu thay đổi</Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 </div>

    {/* Multi-slot settings card */}
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
      <h2 className="text-lg font-bold text-zinc-900 mb-4">Khuyến mãi đặt nhiều ca liên tiếp (Thông tầm)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 items-end">
        <div>
          <Label>Giảm giá khi đặt 2 ca (%)</Label>
          <Input 
            type="number"
            value={multiSlotSettings.discount_2_slots}
            onChange={e => setMultiSlotSettings({...multiSlotSettings, discount_2_slots: e.target.value})}
            placeholder="5" className="mt-1.5" 
          />
        </div>
        <div>
          <Label>Giảm giá khi đặt 3 ca (%)</Label>
          <Input 
            type="number"
            value={multiSlotSettings.discount_3_slots}
            onChange={e => setMultiSlotSettings({...multiSlotSettings, discount_3_slots: e.target.value})}
            placeholder="10" className="mt-1.5" 
          />
        </div>
        <div>
          <Label>Giảm giá khi đặt cả ngày (4 ca) (%)</Label>
          <Input 
            type="number"
            value={multiSlotSettings.discount_4_slots}
            onChange={e => setMultiSlotSettings({...multiSlotSettings, discount_4_slots: e.target.value})}
            placeholder="15" className="mt-1.5" 
          />
        </div>
        <div>
          <Button onClick={handleSaveSettings} disabled={savingSettings} className="w-full sm:w-auto">
            {savingSettings ? "Đang lưu..." : "Lưu cấu hình"}
          </Button>
        </div>
      </div>
      <p className="text-sm text-zinc-500 mt-3">Khách hàng sẽ tự động được gộp giờ và tặng 30 phút dọn phòng (thông tầm) khi chọn nhiều ca liên tiếp trên Bảng đặt phòng.</p>
      
      <div className="mt-8 border-t border-zinc-200 pt-6">
        <h2 className="text-lg font-bold text-zinc-900 mb-4">Giảm giá đặt trước (Early Booking)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div>
            <Label>Số ngày đặt trước tối thiểu</Label>
            <Input 
              type="number"
              value={multiSlotSettings.early_booking_days}
              onChange={e => setMultiSlotSettings({...multiSlotSettings, early_booking_days: e.target.value})}
              placeholder="0" className="mt-1.5" 
            />
          </div>
          <div>
            <Label>Giảm giá (%)</Label>
            <Input 
              type="number"
              value={multiSlotSettings.early_booking_discount_pct}
              onChange={e => setMultiSlotSettings({...multiSlotSettings, early_booking_discount_pct: e.target.value})}
              placeholder="10" className="mt-1.5" 
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <p className="text-sm text-zinc-500 mb-1">Cấu hình tự động giảm giá % tổng tiền phòng nếu khách hàng đặt trước từ số ngày quy định trở lên. Để 0 nếu không sử dụng.</p>
          </div>
        </div>
      </div>
    </div>

 <div className="bg-white rounded-xl shadow-sm border border-zinc-200 ">
 <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
 <div className="relative w-full sm:max-w-xs">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
 <Input 
 placeholder="Tìm mã giảm giá..." 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-9 w-full"
 />
 </div>
 </div>

 <div className="overflow-x-auto">
 <Table>
 <TableHeader>
 <TableRow className="bg-zinc-50 ">
 <TableHead className="font-semibold">Mã code</TableHead>
 <TableHead className="font-semibold">Mức giảm</TableHead>
 <TableHead className="font-semibold text-center">Đã dùng</TableHead>
 <TableHead className="font-semibold text-center">Hạn sử dụng</TableHead>
 <TableHead className="font-semibold text-center">Hiển thị</TableHead>
 <TableHead className="font-semibold text-center">Tự động tặng</TableHead>
 <TableHead className="font-semibold text-center">Trạng thái</TableHead>
 <TableHead className="font-semibold text-right">Hành động</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {loading ? (
 <TableRow>
 <TableCell colSpan={6} className="text-center py-8 text-zinc-500">Đang tải dữ liệu...</TableCell>
 </TableRow>
 ) : filteredCoupons.length === 0 ? (
 <TableRow>
 <TableCell colSpan={6} className="text-center py-8 text-zinc-500">Chưa có mã giảm giá nào</TableCell>
 </TableRow>
 ) : filteredCoupons.map((coupon) => {
 const isValid = new Date() >= new Date(coupon.validFrom) && new Date() <= new Date(coupon.validTo);
 return (
 <TableRow key={coupon.id} className="hover:bg-zinc-50 :bg-zinc-800/50">
 <TableCell>
 <div className="flex items-center gap-2">
 <Ticket className="w-4 h-4 text-primary" />
 <span className="font-bold text-zinc-900 uppercase tracking-wider">{coupon.code}</span>
 </div>
 </TableCell>
 <TableCell className="font-medium text-emerald-600 ">
 {coupon.discountPct ? `${coupon.discountPct}%` : `${coupon.discountAmt?.toLocaleString()}đ`}
 </TableCell>
 <TableCell className="text-center text-zinc-600 ">
 {coupon.usedCount} / {coupon.maxUsage || "∞"}
 </TableCell>
 <TableCell className="text-center text-sm text-zinc-500">
 {format(new Date(coupon.validFrom), 'dd/MM/yyyy')} - {format(new Date(coupon.validTo), 'dd/MM/yyyy')}
 </TableCell>
 <TableCell className="text-center">
 <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${coupon.isPublic ? 'bg-blue-100 text-blue-700 ' : 'bg-zinc-100 text-zinc-700 '}`}>
 {coupon.isPublic ? 'Công khai' : 'Bí mật'}
 </span>
 </TableCell>
 <TableCell className="text-center text-sm">
 {coupon.autoSendAfterBookings ? <span className="text-primary font-semibold">{coupon.autoSendAfterBookings} lần</span> : <span className="text-zinc-400">-</span>}
 </TableCell>
 <TableCell className="text-center">
 <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
 isValid 
 ? "bg-emerald-100 text-emerald-700 "
 : "bg-red-100 text-red-700 "
 }`}>
 {isValid ? "Đang chạy" : "Hết hạn"}
 </span>
 </TableCell>
 <TableCell className="text-right">
 <DropdownMenu>
 <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-zinc-100 :bg-zinc-800 h-8 w-8 p-0 outline-none transition-colors">
 <span className="sr-only">Open menu</span>
 <MoreVertical className="h-4 w-4" />
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-48">
 <DropdownMenuLabel>Hành động</DropdownMenuLabel>
 <DropdownMenuSeparator />
 <DropdownMenuItem onClick={() => openEdit(coupon)}>
 <Edit className="w-4 h-4 mr-2" />
 Chỉnh sửa
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem 
 className="text-red-600 focus:text-red-600"
 onClick={() => setConfirmDeleteId(coupon.id)}
 >
 <Trash2 className="w-4 h-4 mr-2" />
 Xóa
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </TableCell>
 </TableRow>
 );
 })}
 </TableBody>
 </Table>
 </div>
 </div>

 <ConfirmModal
 isOpen={!!confirmDeleteId}
 onClose={() => setConfirmDeleteId(null)}
 onConfirm={executeDelete}
 title="Xác nhận xóa mã giảm giá"
 description="Bạn có chắc chắn muốn xóa mã giảm giá này không? Hành động này không thể hoàn tác."
 confirmText="Xóa mã"
 />
 </div>
 );
}
