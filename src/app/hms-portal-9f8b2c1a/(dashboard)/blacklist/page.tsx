"use client";

import { useState, useEffect } from "react";
import { 
 Search, 
 Plus, 
 MoreVertical, 
 Trash2, 
 ShieldAlert,
 Edit
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
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

export default function AdminBlacklistPage() {
 const [searchTerm, setSearchTerm] = useState("");
 const [blacklist, setBlacklist] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const { toast } = useToast();
 const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean, id: string | null, type: string }>({ isOpen: false, id: null, type: "" });

 const [isAddOpen, setIsAddOpen] = useState(false);
 const [editId, setEditId] = useState<string | null>(null);
 const [newType, setNewType] = useState("Phone");
 const [newValue, setNewValue] = useState("");
 const [newReason, setNewReason] = useState("");
 const [submitting, setSubmitting] = useState(false);

 const fetchBlacklist = async () => {
 try {
 setLoading(true);
 const res = await fetch(`/api/blacklist?search=${searchTerm}`);
 if (!res.ok) throw new Error("Failed to fetch blacklist");
 const data = await res.json();
 setBlacklist(data);
 } catch (error) {
 console.error(error);
 toast({
 title: "Lỗi",
 description: "Không thể lấy danh sách Blacklist",
 variant: "destructive"
 });
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchBlacklist();
 }, [searchTerm]);

 const handleSave = async () => {
 if (!newValue && !editId) {
 toast({ title: "Lỗi", description: "Vui lòng nhập giá trị", variant: "destructive" });
 return;
 }
 try {
 setSubmitting(true);
 const url = editId ? `/api/blacklist/${editId}` : "/api/blacklist";
 const method = editId ? "PUT" : "POST";

 const res = await fetch(url, {
 method,
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ type: newType, value: newValue, reason: newReason })
 });
 if (!res.ok) {
 const errorData = await res.json();
 throw new Error(errorData.error || "Lỗi khi lưu");
 }
 toast({ title: "Thành công", description: editId ? "Đã cập nhật" : "Đã thêm vào Blacklist" });
 setIsAddOpen(false);
 resetForm();
 fetchBlacklist();
 } catch (error: any) {
 toast({ title: "Lỗi", description: error.message, variant: "destructive" });
 } finally {
 setSubmitting(false);
 }
 };

 const handleDelete = async (id: string, type: string) => {
 setConfirmDelete({ isOpen: true, id, type });
 };

 const executeDelete = async () => {
 if (!confirmDelete.id || !confirmDelete.type) return;
 try {
 const res = await fetch(`/api/blacklist/${confirmDelete.id}?type=${confirmDelete.type}`, {
 method: "DELETE"
 });
 if (!res.ok) throw new Error("Failed to delete");
 toast({ title: "Thành công", description: "Đã gỡ khỏi Blacklist" });
 fetchBlacklist();
 } catch (error) {
 toast({ title: "Lỗi", description: "Không thể xóa khỏi Blacklist", variant: "destructive" });
 } finally {
 setConfirmDelete({ isOpen: false, id: null, type: "" });
 }
 };

 const resetForm = () => {
 setEditId(null);
 setNewType("Phone");
 setNewValue("");
 setNewReason("");
 };

 const openEdit = (item: any) => {
 setEditId(item.id);
 setNewType(item.type);
 setNewValue(item.value);
 setNewReason(item.reason || "");
 setIsAddOpen(true);
 };

 return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <h1 className="text-2xl font-bold text-zinc-900 ">Blacklist (Danh sách đen)</h1>
 <p className="text-sm text-zinc-500 mt-1">Chặn đặt phòng từ các SĐT, Email hoặc IP có dấu hiệu spam, gian lận.</p>
 </div>
 <Button 
 className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-md"
 onClick={() => {
 resetForm();
 setIsAddOpen(true);
 }}
 >
 <Plus className="w-4 h-4 mr-2" />
 Thêm vào Blacklist
 </Button>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-zinc-200 ">
 <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
 <div className="relative w-full sm:max-w-xs">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
 <Input 
 placeholder="Tìm kiếm..." 
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
 <TableHead className="w-12"></TableHead>
 <TableHead className="font-semibold">Loại</TableHead>
 <TableHead className="font-semibold">Giá trị</TableHead>
 <TableHead className="font-semibold">Lý do</TableHead>
 <TableHead className="font-semibold text-right">Ngày thêm</TableHead>
 <TableHead className="font-semibold text-right">Hành động</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {loading ? (
 <TableRow>
 <TableCell colSpan={6} className="text-center py-8 text-zinc-500">Đang tải...</TableCell>
 </TableRow>
 ) : blacklist.length === 0 ? (
 <TableRow>
 <TableCell colSpan={6} className="text-center py-8 text-zinc-500">Chưa có dữ liệu</TableCell>
 </TableRow>
 ) : blacklist.map((item) => (
 <TableRow key={item.id} className="hover:bg-zinc-50 :bg-zinc-800/50">
 <TableCell>
 <ShieldAlert className="w-4 h-4 text-rose-500" />
 </TableCell>
 <TableCell>
 <span className="text-sm font-medium text-zinc-900 ">{item.type}</span>
 </TableCell>
 <TableCell className="font-mono text-sm">{item.value}</TableCell>
 <TableCell className="text-sm text-zinc-600 ">{item.reason}</TableCell>
 <TableCell className="text-right text-sm text-zinc-500">{format(new Date(item.createdAt), "HH:mm dd/MM/yyyy")}</TableCell>
 <TableCell className="text-right">
 <DropdownMenu>
 <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-zinc-100 :bg-zinc-800 h-8 w-8 p-0 outline-none transition-colors">
 <span className="sr-only">Open menu</span>
 <MoreVertical className="h-4 w-4" />
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-48">
 <DropdownMenuLabel>Hành động</DropdownMenuLabel>
 <DropdownMenuSeparator />
 <DropdownMenuItem onClick={() => openEdit(item)}>
 <Edit className="w-4 h-4 mr-2" />
 Chỉnh sửa
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem 
 className="text-emerald-600 focus:text-emerald-600"
 onClick={() => handleDelete(item.id, item.type)}
 >
 <Trash2 className="w-4 h-4 mr-2" />
 Gỡ khỏi Blacklist
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 </div>

 <Dialog open={isAddOpen} onOpenChange={(open) => {
 setIsAddOpen(open);
 if (!open) resetForm();
 }}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>{editId ? "Chỉnh sửa Blacklist" : "Thêm vào Blacklist"}</DialogTitle>
 <DialogDescription>
 Người dùng khớp với thông tin này sẽ không thể đặt phòng trên hệ thống.
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-4 py-4">
 <div className="space-y-2">
 <Label>Loại chặn</Label>
 <select 
 disabled={!!editId}
 className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 :ring-zinc-300"
 value={newType}
 onChange={(e) => setNewType(e.target.value)}
 >
 <option value="Phone">Số điện thoại</option>
 <option value="Email">Email</option>
 <option value="IP">IP Address</option>
 </select>
 </div>
 <div className="space-y-2">
 <Label>Giá trị ({newType})</Label>
 <Input 
 disabled={!!editId}
 placeholder={newType === "Phone" ? "0987654321" : newType === "Email" ? "email@example.com" : "192.168.1.1"}
 value={newValue}
 onChange={(e) => setNewValue(e.target.value)}
 />
 </div>
 <div className="space-y-2">
 <Label>Lý do (Tùy chọn)</Label>
 <Input 
 placeholder="VD: Boom hàng nhiều lần"
 value={newReason}
 onChange={(e) => setNewReason(e.target.value)}
 />
 </div>
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setIsAddOpen(false)}>Hủy</Button>
 <Button onClick={handleSave} disabled={submitting}>
 {submitting ? "Đang xử lý..." : "Lưu thay đổi"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 <ConfirmModal
 isOpen={confirmDelete.isOpen}
 onClose={() => setConfirmDelete({ isOpen: false, id: null, type: "" })}
 onConfirm={executeDelete}
 title="Gỡ khỏi Blacklist"
 description="Bạn có chắc chắn muốn gỡ thông tin này khỏi Blacklist? Khách hàng sẽ có thể đặt phòng trở lại."
 confirmText="Gỡ bỏ"
 />
 </div>
 );
}
