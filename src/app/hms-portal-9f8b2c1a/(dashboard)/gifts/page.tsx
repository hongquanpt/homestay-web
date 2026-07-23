"use client";

import { useState, useEffect } from "react";
import { 
 Search, 
 Plus, 
 MoreVertical, 
 Edit, 
 Trash2, 
 Gift
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

export default function AdminGiftsPage() {
 const [searchTerm, setSearchTerm] = useState("");
 const [campaigns, setCampaigns] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const { toast } = useToast();
 const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

 const [isOpen, setIsOpen] = useState(false);
 const [editId, setEditId] = useState<string | null>(null);
 const [formData, setFormData] = useState({
 name: "",
 conditionText: "",
 isActive: true
 });

 const fetchData = async () => {
 setLoading(true);
 try {
 const res = await fetch('/api/gifts');
 const data = await res.json();
 setCampaigns(data);
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
 setFormData({ name: "", conditionText: "", isActive: true });
 };

 const handleSave = async () => {
 try {
 const url = editId ? `/api/gifts/${editId}` : '/api/gifts';
 const method = editId ? 'PUT' : 'POST';

 const res = await fetch(url, {
 method,
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 name: formData.name,
 condition: { text: formData.conditionText },
 isActive: formData.isActive
 })
 });
 if (res.ok) {
 setIsOpen(false);
 resetForm();
 fetchData();
 toast({ title: "Thành công", description: "Đã lưu chương trình quà tặng!" });
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
 const res = await fetch(`/api/gifts/${confirmDeleteId}`, { method: 'DELETE' });
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

 const openEdit = (camp: any) => {
 setEditId(camp.id);
 setFormData({
 name: camp.name,
 conditionText: camp.condition?.text || "",
 isActive: camp.isActive
 });
 setIsOpen(true);
 };

 const filteredCampaigns = campaigns.filter(c => 
 c.name.toLowerCase().includes(searchTerm.toLowerCase())
 );

 return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <h1 className="text-2xl font-bold text-zinc-900 ">Chương trình Quà tặng</h1>
 <p className="text-sm text-zinc-500 mt-1">Cấu hình quà tặng kèm theo điều kiện đặt phòng.</p>
 </div>
 
 <Dialog open={isOpen} onOpenChange={(open) => {
 setIsOpen(open);
 if (!open) resetForm();
 }}>
 <DialogTrigger className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white shadow-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500">
 <Plus className="w-4 h-4 mr-2" />
 Thêm quà tặng
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>{editId ? "Chỉnh sửa quà tặng" : "Tạo chương trình quà tặng"}</DialogTitle>
 </DialogHeader>
 <div className="space-y-4 pt-4">
 <div>
 <Label>Tên quà tặng</Label>
 <Input 
 value={formData.name}
 onChange={e => setFormData({...formData, name: e.target.value})}
 placeholder="VD: Tặng 2 chai nước suối" className="mt-1.5" 
 />
 </div>
 <div>
 <Label>Mô tả điều kiện áp dụng</Label>
 <Input 
 value={formData.conditionText}
 onChange={e => setFormData({...formData, conditionText: e.target.value})}
 placeholder="VD: Áp dụng cho mọi đơn đặt phòng" className="mt-1.5" 
 />
 </div>
 {editId && (
 <div className="flex items-center gap-2 mt-2">
 <input 
 type="checkbox" 
 id="isActive"
 checked={formData.isActive}
 onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
 className="rounded border-zinc-300 text-primary focus:ring-amber-500"
 />
 <Label htmlFor="isActive" className="cursor-pointer">Kích hoạt</Label>
 </div>
 )}
 <div className="pt-2 flex justify-end gap-2">
 <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
 <Button onClick={handleSave}>Lưu thay đổi</Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-zinc-200 ">
 <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
 <div className="relative w-full sm:max-w-xs">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
 <Input 
 placeholder="Tìm tên quà tặng..." 
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
 <TableHead className="font-semibold">Tên quà tặng</TableHead>
 <TableHead className="font-semibold">Điều kiện áp dụng</TableHead>
 <TableHead className="font-semibold text-center">Trạng thái</TableHead>
 <TableHead className="font-semibold text-right">Hành động</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {loading ? (
 <TableRow>
 <TableCell colSpan={4} className="text-center py-8 text-zinc-500">Đang tải dữ liệu...</TableCell>
 </TableRow>
 ) : filteredCampaigns.length === 0 ? (
 <TableRow>
 <TableCell colSpan={4} className="text-center py-8 text-zinc-500">Chưa có quà tặng nào</TableCell>
 </TableRow>
 ) : filteredCampaigns.map((camp) => (
 <TableRow key={camp.id} className="hover:bg-zinc-50 :bg-zinc-800/50">
 <TableCell>
 <div className="flex items-center gap-2">
 <Gift className="w-4 h-4 text-rose-500" />
 <span className="font-medium text-zinc-900 ">{camp.name}</span>
 </div>
 </TableCell>
 <TableCell className="text-sm text-zinc-600 ">
 {camp.condition?.text || "Không có mô tả"}
 </TableCell>
 <TableCell className="text-center">
 <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
 camp.isActive
 ? "bg-emerald-100 text-emerald-700 "
 : "bg-zinc-100 text-zinc-500 "
 }`}>
 {camp.isActive ? "Đang áp dụng" : "Đã tắt"}
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
 <DropdownMenuItem onClick={() => openEdit(camp)}>
 <Edit className="w-4 h-4 mr-2" />
 Chỉnh sửa
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem 
 className="text-red-600 focus:text-red-600"
 onClick={() => setConfirmDeleteId(camp.id)}
 >
 <Trash2 className="w-4 h-4 mr-2" />
 Xóa quà tặng
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

 <ConfirmModal
 isOpen={!!confirmDeleteId}
 onClose={() => setConfirmDeleteId(null)}
 onConfirm={executeDelete}
 title="Xác nhận xóa quà tặng"
 description="Bạn có chắc chắn muốn xóa phần quà này? Khách hàng sẽ không còn nhận được quà này khi đặt phòng nữa."
 confirmText="Xóa quà tặng"
 />
 </div>
 );
}
