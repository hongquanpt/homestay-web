"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export function BlockIpButton({ ip, isBlocked }: { ip: string, isBlocked: boolean }) {
 const [loading, setLoading] = useState(false);
 const [isConfirmOpen, setIsConfirmOpen] = useState(false);
 const router = useRouter();
 const { toast } = useToast();

 const handleBlock = async () => {
 setLoading(true);
 try {
 const res = await fetch("/api/blacklist", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ type: "IP", value: ip, reason: "Bị chặn từ màn hình Lịch sử truy cập" })
 });
 if (res.ok) {
 toast({ title: "Thành công", description: "Đã chặn IP này thành công!" });
 router.refresh();
 } else {
 const err = await res.json();
 toast({ title: "Lỗi", description: err.error, variant: "destructive" });
 }
 } catch (e) {
 toast({ title: "Lỗi", description: "Có lỗi xảy ra khi chặn IP", variant: "destructive" });
 } finally {
 setLoading(false);
 }
 };

 if (isBlocked) {
 return (
 <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-red-100 text-red-700 ">
 <ShieldAlert className="w-3 h-3 mr-1" />
 Đã chặn
 </span>
 );
 }

 return (
 <>
 <div className="flex items-center justify-center gap-2">
 <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 ">
 <ShieldCheck className="w-3 h-3 mr-1" />
 Cho phép
 </span>
 <Button 
 variant="destructive" 
 size="sm" 
 onClick={() => setIsConfirmOpen(true)} 
 disabled={loading}
 className="h-6 px-2 text-[10px] rounded"
 title="Đưa vào danh sách đen"
 >
 <ShieldAlert className="w-3 h-3 mr-1" />
 {loading ? "..." : "Chặn IP"}
 </Button>
 </div>

 <ConfirmModal
 isOpen={isConfirmOpen}
 onClose={() => setIsConfirmOpen(false)}
 onConfirm={handleBlock}
 title="Xác nhận chặn IP"
 description={`Bạn có chắc chắn muốn đưa IP [${ip}] vào danh sách đen? Kết nối từ IP này sẽ bị vô hiệu hóa.`}
 confirmText="Chặn IP"
 />
 </>
 );
}
