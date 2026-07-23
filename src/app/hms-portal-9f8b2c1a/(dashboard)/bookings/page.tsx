"use client";

import { useState, useEffect } from "react";
import { 
 Search, 
 Filter, 
 MoreVertical, 
 CheckCircle, 
 Mail, 
 XCircle, 
 Eye,
 FileText,
 ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string, color: string }> = {
 PENDING_PAYMENT: { label: "Chờ thanh toán", color: "bg-rose-100 text-rose-700 " },
 PAYMENT_VERIFICATION_PENDING: { label: "Chờ XN thanh toán", color: "bg-primary/10 text-primary " },
 PAID: { label: "Đã thanh toán", color: "bg-emerald-100 text-emerald-700 " },
 EMAIL_SENT: { label: "Đã gửi email", color: "bg-blue-100 text-blue-700 " },
 CHECKED_IN: { label: "Đã Check-in", color: "bg-indigo-100 text-indigo-700 " },
 COMPLETED: { label: "Hoàn thành", color: "bg-zinc-100 text-zinc-700 " },
 CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-700 " },
};

export default function AdminBookingsPage() {
 const [searchTerm, setSearchTerm] = useState("");
 const [bookings, setBookings] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const { toast } = useToast();
 const [confirmAction, setConfirmAction] = useState<{ isOpen: boolean, type: string, value: string }>({ isOpen: false, type: "", value: "" });
 const [selectedBooking, setSelectedBooking] = useState<any>(null);
 const [isEditingEmail, setIsEditingEmail] = useState(false);
 const [editedEmail, setEditedEmail] = useState("");
 const [isEditingPhone, setIsEditingPhone] = useState(false);
 const [editedPhone, setEditedPhone] = useState("");

 const fetchBookings = async () => {
 try {
 setLoading(true);
 const res = await fetch(`/api/bookings?search=${searchTerm}`);
 if (!res.ok) throw new Error("Failed to fetch bookings");
 const data = await res.json();
 setBookings(data);
 } catch (error) {
 console.error(error);
 toast({
 title: "Lỗi",
 description: "Không thể lấy danh sách đơn đặt phòng",
 variant: "destructive"
 });
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchBookings();
 }, [searchTerm]);

 // SSE Listener for Realtime New Bookings
 useEffect(() => {
 const eventSource = new EventSource('/api/bookings/stream');

 eventSource.onmessage = (event) => {
 try {
 const data = JSON.parse(event.data);
 if (data.type === 'NEW_BOOKING') {
 const booking = data.payload;
 toast({
 title: "🎉 Đơn đặt phòng mới!",
 description: `Khách hàng ${booking.customerName} vừa đặt phòng (${booking.customerPhone}).`,
 variant: "default",
 });
 // Refresh the list to get full details
 fetchBookings();
 }
 } catch (err) {
 console.error("SSE Parse error:", err);
 }
 };

 return () => {
 eventSource.close();
 };
 }, []);

 const handleUpdateStatus = async (id: string, status: string) => {
 try {
 const res = await fetch(`/api/bookings/${id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ status })
 });
 if (!res.ok) throw new Error("Failed to update status");
 
 if (status === "PAID") {
 toast({ title: "Đang xử lý", description: "Đã xác nhận thanh toán, hệ thống đang gửi email..." });
 await handleSendEmail(id);
 } else {
 toast({ title: "Thành công", description: "Đã cập nhật trạng thái đơn" });
 fetchBookings();
 }
 } catch (error) {
 toast({ title: "Lỗi", description: "Không thể cập nhật trạng thái", variant: "destructive" });
 }
 };

 const handleBlock = async (type: string, value: string) => {
 setConfirmAction({ isOpen: true, type, value });
 };

 const executeBlock = async () => {
 if (!confirmAction.type || !confirmAction.value) return;
 try {
 const res = await fetch("/api/blacklist", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ type: confirmAction.type, value: confirmAction.value, reason: "Bị chặn từ Quản lý Đơn đặt phòng" })
 });
 if (res.ok) {
 toast({ title: "Thành công", description: `Đã chặn ${confirmAction.value} thành công!` });
 } else {
 const err = await res.json();
 toast({ title: "Lỗi", description: err.error || "Không thể chặn", variant: "destructive" });
 }
 } catch (error) {
 toast({ title: "Lỗi", description: "Có lỗi xảy ra", variant: "destructive" });
 } finally {
 setConfirmAction({ isOpen: false, type: "", value: "" });
 }
 };

 const handleUpdatePhone = async () => {
   if (!selectedBooking) return;
   try {
     const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
       method: "PUT",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ customerPhone: editedPhone })
     });
     if (!res.ok) throw new Error("Failed to update phone");
     
     toast({ title: "Thành công", description: "Đã cập nhật số điện thoại khách hàng" });
     setSelectedBooking({ ...selectedBooking, customerPhone: editedPhone });
     setIsEditingPhone(false);
     fetchBookings();
   } catch (error) {
     toast({ title: "Lỗi", description: "Không thể cập nhật số điện thoại", variant: "destructive" });
   }
 };

 const handleUpdateEmail = async () => {
   if (!selectedBooking) return;
   try {
     const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
       method: "PUT",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ customerEmail: editedEmail })
     });
     if (!res.ok) throw new Error("Failed to update email");
     
     toast({ title: "Thành công", description: "Đã cập nhật email khách hàng" });
     setSelectedBooking({ ...selectedBooking, customerEmail: editedEmail });
     setIsEditingEmail(false);
     fetchBookings();
   } catch (error) {
     toast({ title: "Lỗi", description: "Không thể cập nhật email", variant: "destructive" });
   }
 };

 const handleSendEmail = async (id: string) => {
 try {
 const res = await fetch(`/api/bookings/${id}/send-email`, {
 method: "POST"
 });
 if (res.ok) {
 fetchBookings();
 toast({ title: "Thành công", description: "Đã gửi email thành công!" });
 } else {
 const err = await res.json();
 toast({ title: "Lỗi", description: err.error || "Gửi email thất bại", variant: "destructive" });
 }
 } catch (e) {
 toast({ title: "Lỗi", description: "Có lỗi xảy ra khi gửi email", variant: "destructive" });
 }
 };

 return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <h1 className="text-2xl font-bold text-zinc-900 ">Quản lý Đơn đặt phòng</h1>
 <p className="text-sm text-zinc-500 mt-1">Quản lý tất cả đơn đặt phòng từ khách hàng.</p>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-zinc-200 ">
 <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
 <div className="relative w-full sm:max-w-xs">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
 <Input 
 placeholder="Tìm theo mã đơn, sđt..." 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-9 w-full"
 />
 </div>
 <div className="flex items-center gap-2 w-full sm:w-auto">
 <Button variant="outline" className="w-full sm:w-auto">
 <Filter className="w-4 h-4 mr-2" />
 Lọc trạng thái
 </Button>
 <Button variant="outline" className="w-full sm:w-auto">
 <FileText className="w-4 h-4 mr-2" />
 Xuất Excel
 </Button>
 </div>
 </div>

 <div className="overflow-x-auto">
 <Table>
 <TableHeader>
 <TableRow className="bg-zinc-50 ">
 <TableHead className="font-semibold">Mã đơn</TableHead>
 <TableHead className="font-semibold">Khách hàng</TableHead>
 <TableHead className="font-semibold">Phòng</TableHead>
 <TableHead className="font-semibold">Thời gian</TableHead>
 <TableHead className="font-semibold text-right">Tổng tiền</TableHead>
 <TableHead className="font-semibold text-center">Trạng thái</TableHead>
 <TableHead className="font-semibold text-right">Hành động</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {loading ? (
 <TableRow>
 <TableCell colSpan={7} className="text-center py-8 text-zinc-500">Đang tải...</TableCell>
 </TableRow>
 ) : bookings.length === 0 ? (
 <TableRow>
 <TableCell colSpan={7} className="text-center py-8 text-zinc-500">Không tìm thấy đơn nào</TableCell>
 </TableRow>
 ) : bookings.map((booking) => (
 <TableRow key={booking.id} className="hover:bg-zinc-50 :bg-zinc-800/50">
 <TableCell className="font-mono text-xs font-medium">{booking.id.substring(0, 8).toUpperCase()}</TableCell>
 <TableCell>
 <div className="flex items-center gap-2">
   <p className="font-medium text-zinc-900 ">{booking.customerName}</p>
   {booking.visitCount > 1 ? (
     <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 whitespace-nowrap">Khách quen (x{booking.visitCount})</span>
   ) : (
     <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 whitespace-nowrap">Khách mới</span>
   )}
 </div>
 <p className="text-xs text-zinc-500 mt-0.5">{booking.customerPhone}</p>
 {booking.customerEmail && <p className="text-xs text-zinc-500">{booking.customerEmail}</p>}
 </TableCell>
 <TableCell className="text-sm">
 {booking.details?.map((d: any) => d.room?.name).join(", ")}
 </TableCell>
 <TableCell className="text-sm text-zinc-600 ">
 {booking.details?.[0] ? `${format(new Date(booking.details[0].startTime), "HH:mm dd/MM")} - ${format(new Date(booking.details[0].endTime), "HH:mm dd/MM")}` : ""}
 </TableCell>
 <TableCell className="text-right font-semibold text-primary">
 {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalAmount || 0)}
 </TableCell>
 <TableCell className="text-center">
 <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[booking.status]?.color || "bg-zinc-100 text-zinc-700"}`}>
 {statusConfig[booking.status]?.label || booking.status}
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
 <DropdownMenuItem onClick={() => setSelectedBooking(booking)}>
 <Eye className="w-4 h-4 mr-2" />
 Xem chi tiết
 </DropdownMenuItem>
 {booking.status === "PENDING_PAYMENT" && (
 <DropdownMenuItem 
 className="text-emerald-600 focus:text-emerald-600"
 onClick={() => handleUpdateStatus(booking.id, "PAID")}
 >
 <CheckCircle className="w-4 h-4 mr-2" />
 Xác nhận đã nhận tiền
 </DropdownMenuItem>
 )}
 {(booking.status === "PAID" || booking.status === "EMAIL_SENT") && (
 <DropdownMenuItem 
 className="text-blue-600 focus:text-blue-600"
 onClick={() => handleSendEmail(booking.id)}
 >
 <Mail className="w-4 h-4 mr-2" />
 Gửi lại Email Check-in
 </DropdownMenuItem>
 )}
 <DropdownMenuSeparator />
 <DropdownMenuItem 
 className="text-red-600 focus:text-red-600"
 onClick={() => handleUpdateStatus(booking.id, "CANCELLED")}
 >
 <XCircle className="w-4 h-4 mr-2" />
 Hủy đơn
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem 
 className="text-red-600 focus:text-red-600"
 onClick={() => handleBlock("Phone", booking.customerPhone)}
 >
 <ShieldAlert className="w-4 h-4 mr-2" />
 Chặn Số điện thoại
 </DropdownMenuItem>
 {booking.customerEmail && (
 <DropdownMenuItem 
 className="text-red-600 focus:text-red-600"
 onClick={() => handleBlock("Email", booking.customerEmail)}
 >
 <ShieldAlert className="w-4 h-4 mr-2" />
 Chặn Email
 </DropdownMenuItem>
 )}
 </DropdownMenuContent>
 </DropdownMenu>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 </div>

 <ConfirmModal
 isOpen={confirmAction.isOpen}
 onClose={() => setConfirmAction({ isOpen: false, type: "", value: "" })}
 onConfirm={executeBlock}
 title="Xác nhận chặn"
 description={`Bạn có chắc muốn đưa ${confirmAction.type} [${confirmAction.value}] vào danh sách đen? Họ sẽ không thể tiếp tục đặt phòng.`}
 confirmText="Chặn"
 />

 <Dialog open={!!selectedBooking} onOpenChange={(open) => {
   if (!open) {
     setSelectedBooking(null);
     setIsEditingEmail(false);
     setIsEditingPhone(false);
   }
 }}>
  <DialogContent className="max-w-xl">
    <DialogHeader>
      <DialogTitle>Chi tiết đơn đặt phòng</DialogTitle>
      <DialogDescription>
        Tất cả thông tin do khách hàng cung cấp khi đặt phòng.
      </DialogDescription>
    </DialogHeader>
    
    {selectedBooking && (
      <div className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-zinc-500">Họ và tên</p>
            <p className="font-medium text-base">{selectedBooking.customerName}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Số điện thoại</p>
            {isEditingPhone ? (
              <div className="flex items-center gap-2 mt-1">
                <Input 
                  value={editedPhone} 
                  onChange={(e) => setEditedPhone(e.target.value)} 
                  className="h-8 text-sm w-full"
                  placeholder="Nhập SĐT mới"
                />
                <Button size="sm" onClick={handleUpdatePhone} className="h-8">Lưu</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingPhone(false)} className="h-8 px-2">Hủy</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <p className="font-medium text-base">{selectedBooking.customerPhone}</p>
                <button 
                  onClick={() => {
                    setEditedPhone(selectedBooking.customerPhone || "");
                    setIsEditingPhone(true);
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Sửa
                </button>
                {selectedBooking.visitCount > 1 ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">Khách quen (x{selectedBooking.visitCount})</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">Khách mới</span>
                )}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-zinc-500">Email</p>
            {isEditingEmail ? (
              <div className="flex items-center gap-2 mt-1">
                <Input 
                  value={editedEmail} 
                  onChange={(e) => setEditedEmail(e.target.value)} 
                  className="h-8 text-sm w-full"
                  placeholder="Nhập email mới"
                />
                <Button size="sm" onClick={handleUpdateEmail} className="h-8">Lưu</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingEmail(false)} className="h-8 px-2">Hủy</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-medium text-base">{selectedBooking.customerEmail || "Không có"}</p>
                <button 
                  onClick={() => {
                    setEditedEmail(selectedBooking.customerEmail || "");
                    setIsEditingEmail(true);
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Sửa
                </button>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-zinc-500">Số khách</p>
            <p className="font-medium text-base">{selectedBooking.numGuests || 1} người</p>
          </div>
        </div>
        
        <div>
          <p className="text-sm text-zinc-500 mb-1">Ghi chú của khách</p>
          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 min-h-[60px] text-sm text-zinc-800 whitespace-pre-wrap">
            {selectedBooking.notes || <span className="text-zinc-400 italic">Không có ghi chú</span>}
          </div>
        </div>
        
        {(() => {
          // Parse idCardsJson if available
          const idCards: { frontUrl: string | null, backUrl: string | null }[] = (() => {
            try {
              if (selectedBooking.idCardsJson) {
                return JSON.parse(selectedBooking.idCardsJson);
              }
            } catch (e) {}
            // Fallback to legacy single CCCD
            if (selectedBooking.frontIdCardUrl || selectedBooking.backIdCardUrl) {
              return [{ frontUrl: selectedBooking.frontIdCardUrl, backUrl: selectedBooking.backIdCardUrl }];
            }
            return [];
          })();

          if (idCards.length === 0) return null;

          return (
            <div className="border-t border-zinc-200 pt-4 mt-2">
              <p className="text-sm font-semibold mb-3">Hình ảnh CCCD {idCards.length > 1 ? `(${idCards.length} khách)` : ''}</p>
              <div className="space-y-4">
                {idCards.map((card, idx) => (
                  <div key={idx}>
                    {idCards.length > 1 && (
                      <p className="text-xs font-medium text-zinc-700 mb-2 pb-1 border-b border-zinc-100">
                        CCCD Khách {idx + 1}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-zinc-500 mb-2">Mặt trước</p>
                        {card.frontUrl ? (
                          <a href={card.frontUrl} target="_blank" rel="noreferrer" className="block w-full h-32 rounded-lg border border-zinc-200 overflow-hidden hover:opacity-90 transition-opacity">
                            <img src={card.frontUrl} alt={`Mặt trước CCCD ${idCards.length > 1 ? `khách ${idx + 1}` : ''}`} className="w-full h-full object-cover" />
                          </a>
                        ) : (
                          <div className="w-full h-32 bg-zinc-50 rounded-lg border border-zinc-200 flex items-center justify-center">
                            <span className="text-sm text-zinc-400">Không có ảnh</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-2">Mặt sau</p>
                        {card.backUrl ? (
                          <a href={card.backUrl} target="_blank" rel="noreferrer" className="block w-full h-32 rounded-lg border border-zinc-200 overflow-hidden hover:opacity-90 transition-opacity">
                            <img src={card.backUrl} alt={`Mặt sau CCCD ${idCards.length > 1 ? `khách ${idx + 1}` : ''}`} className="w-full h-full object-cover" />
                          </a>
                        ) : (
                          <div className="w-full h-32 bg-zinc-50 rounded-lg border border-zinc-200 flex items-center justify-center">
                            <span className="text-sm text-zinc-400">Không có ảnh</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {selectedBooking.products && selectedBooking.products.length > 0 && (
          <div className="border-t border-zinc-200 pt-4 mt-2">
            <p className="text-sm font-semibold mb-3">Sản phẩm & Dịch vụ đã đặt</p>
            <div className="space-y-2">
              {selectedBooking.products.map((bp: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                  <div className="flex flex-col">
                    <span className="font-medium">{bp.product?.name || "Sản phẩm"}</span>
                    <span className="text-xs text-zinc-500">
                      {bp.quantity} x {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bp.price)}
                    </span>
                  </div>
                  <span className="font-semibold text-zinc-700">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bp.price * bp.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="border-t border-zinc-200 pt-4 mt-2">
          <p className="text-sm font-semibold mb-3">Thông tin phòng & Thanh toán</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-zinc-500">Phòng</p>
              <p className="font-medium">{selectedBooking.details?.map((d: any) => d.room?.name).join(", ")}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500 mb-1">Trạng thái</p>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[selectedBooking.status]?.color || "bg-zinc-100 text-zinc-700"}`}>
                {statusConfig[selectedBooking.status]?.label || selectedBooking.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Thời gian nhận/trả</p>
              <p className="font-medium text-sm">
                {selectedBooking.details?.[0] ? `${format(new Date(selectedBooking.details[0].startTime), "HH:mm dd/MM/yyyy")} - ${format(new Date(selectedBooking.details[0].endTime), "HH:mm dd/MM/yyyy")}` : ""}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Tổng tiền</p>
              <p className="font-bold text-primary text-lg">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedBooking.totalAmount || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    )}
  </DialogContent>
 </Dialog>
 </div>
 );
}
