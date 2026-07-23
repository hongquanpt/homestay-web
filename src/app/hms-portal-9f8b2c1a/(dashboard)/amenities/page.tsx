"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AdminAmenitiesPage() {
 const { toast } = useToast();
 const [amenities, setAmenities] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState("");

 const [isOpen, setIsOpen] = useState(false);
 const [editId, setEditId] = useState<string | null>(null);
 const [formData, setFormData] = useState({ name: "", icon: "" });

 const [confirmAction, setConfirmAction] = useState<{ isOpen: boolean; id: string | null }>({
 isOpen: false,
 id: null
 });

 const fetchData = async () => {
 setLoading(true);
 try {
 const res = await fetch('/api/amenities');
 const data = await res.json();
 setAmenities(data);
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
 setFormData({ name: "", icon: "" });
 };

 const handleSave = async () => {
 try {
 const url = editId ? `/api/amenities/${editId}` : '/api/amenities';
 const method = editId ? 'PUT' : 'POST';

 const res = await fetch(url, {
 method,
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(formData)
 });
 if (res.ok) {
 setIsOpen(false);
 resetForm();
 fetchData();
 toast({ title: "Thành công", description: "Lưu tiện ích thành công!" });
 } else {
 const err = await res.json();
 toast({ title: "Lỗi", description: err.error, variant: "destructive" });
 }
 } catch (e) {
 toast({ title: "Lỗi", description: "Có lỗi xảy ra", variant: "destructive" });
 }
 };

 const executeDelete = async () => {
 if (!confirmAction.id) return;
 try {
 const res = await fetch(`/api/amenities/${confirmAction.id}`, { method: 'DELETE' });
 if (res.ok) {
 fetchData();
 } else {
 const err = await res.json();
 toast({ title: "Lỗi", description: err.error, variant: "destructive" });
 }
 } catch (e) {
 toast({ title: "Lỗi", description: "Có lỗi xảy ra", variant: "destructive" });
 }
 setConfirmAction({ isOpen: false, id: null });
 };

 const openEdit = (amenity: any) => {
 setEditId(amenity.id);
 setFormData({ name: amenity.name, icon: amenity.icon || "" });
 setIsOpen(true);
 };

 const filteredAmenities = amenities.filter((a: any) =>
 a.name.toLowerCase().includes(searchTerm.toLowerCase())
 );

 return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Quản lý Tiện ích</h1>
 <p className="text-zinc-500 mt-1">Quản lý danh sách các tiện ích có sẵn cho phòng</p>
 </div>
 <Dialog open={isOpen} onOpenChange={(v) => { setIsOpen(v); if (!v) resetForm(); }}>
 <DialogTrigger render={<Button className="bg-primary hover:bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all" />}>
 <Plus className="w-4 h-4 mr-2" /> Thêm tiện ích mới
 </DialogTrigger>
 <DialogContent className="sm:max-w-[425px]">
 <DialogHeader>
 <DialogTitle>{editId ? "Chỉnh sửa tiện ích" : "Thêm tiện ích mới"}</DialogTitle>
 </DialogHeader>
 <div className="space-y-4 pt-4">
 <div>
 <Label>Tên tiện ích (VD: Bếp, Máy chiếu, Netflix...)</Label>
 <Input 
 value={formData.name}
 onChange={e => setFormData({...formData, name: e.target.value})}
 placeholder="Nhập tên tiện ích..." className="mt-1.5" 
 />
 </div>
 <div>
 <Label>Tên Icon (lucide-react - Tùy chọn)</Label>
 <Input 
 value={formData.icon}
 onChange={e => setFormData({...formData, icon: e.target.value})}
 placeholder="VD: Tv, Wifi, Coffee..." className="mt-1.5" 
 />
 <p className="text-xs text-zinc-500 mt-1">Tìm icon tại: lucide.dev/icons</p>
 </div>
 <div className="pt-4 flex justify-end gap-2">
 <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
 <Button onClick={handleSave}>Lưu thay đổi</Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-zinc-200 ">
 <div className="p-4 border-b border-zinc-200 ">
 <div className="relative w-full sm:max-w-xs">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
 <Input 
 placeholder="Tìm tiện ích..." 
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
 <TableHead className="w-16 text-center">STT</TableHead>
 <TableHead>Tên tiện ích</TableHead>
 <TableHead>Icon</TableHead>
 <TableHead className="text-right">Hành động</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {loading ? (
 <TableRow>
 <TableCell colSpan={4} className="text-center py-8 text-zinc-500">Đang tải dữ liệu...</TableCell>
 </TableRow>
 ) : filteredAmenities.length === 0 ? (
 <TableRow>
 <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
 Không tìm thấy tiện ích nào
 </TableCell>
 </TableRow>
 ) : (
 filteredAmenities.map((amenity: any, index: number) => (
 <TableRow key={amenity.id} className="hover:bg-zinc-50/50 :bg-zinc-800/50">
 <TableCell className="text-center text-zinc-500 font-medium">{index + 1}</TableCell>
 <TableCell className="font-semibold text-zinc-900 ">
 {amenity.name}
 </TableCell>
 <TableCell>
 {amenity.icon ? (
 <div className="flex items-center gap-2">
 <Zap className="w-4 h-4 text-primary" />
 <span className="text-zinc-500 text-sm">{amenity.icon}</span>
 </div>
 ) : <span className="text-zinc-400 text-sm italic">Không có</span>}
 </TableCell>
 <TableCell className="text-right">
 <div className="flex justify-end gap-2">
 <Button variant="ghost" size="icon" onClick={() => openEdit(amenity)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 :bg-blue-900/20">
 <Pencil className="w-4 h-4" />
 </Button>
 <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ isOpen: true, id: amenity.id })} className="text-red-600 hover:text-red-700 hover:bg-red-50 :bg-red-900/20">
 <Trash2 className="w-4 h-4" />
 </Button>
 </div>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </div>
 </div>

 <Dialog open={confirmAction.isOpen} onOpenChange={(v) => setConfirmAction({ ...confirmAction, isOpen: v })}>
 <DialogContent className="sm:max-w-[425px]">
 <DialogHeader>
 <DialogTitle className="text-red-600">Xác nhận xóa</DialogTitle>
 </DialogHeader>
 <div className="py-4">
 <p className="text-zinc-600 ">Bạn có chắc chắn muốn xóa tiện ích này không? Hành động này không thể hoàn tác.</p>
 </div>
 <div className="flex justify-end gap-3">
 <Button variant="outline" onClick={() => setConfirmAction({ isOpen: false, id: null })}>Hủy</Button>
 <Button variant="destructive" onClick={executeDelete}>Xóa vĩnh viễn</Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
