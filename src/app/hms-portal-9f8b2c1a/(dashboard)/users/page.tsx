"use client";

import { useState, useEffect } from "react";
import { 
 Search, 
 Plus, 
 MoreVertical, 
 Edit, 
 Trash2, 
 UserCircle,
 ShieldCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
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

export default function AdminUsersPage() {
 const [searchTerm, setSearchTerm] = useState("");
 const [users, setUsers] = useState<any[]>([]);
 const [roles, setRoles] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const { toast } = useToast();
 const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

 const [isOpen, setIsOpen] = useState(false);
 const [editId, setEditId] = useState<string | null>(null);
 const [formData, setFormData] = useState({
 name: "",
 email: "",
 password: "",
 roleId: "",
 });

 const fetchData = async () => {
 setLoading(true);
 try {
 const [usersRes, rolesRes] = await Promise.all([
 fetch('/api/users'),
 fetch('/api/roles')
 ]);
 setUsers(await usersRes.json());
 setRoles(await rolesRes.json());
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
 const url = editId ? `/api/users/${editId}` : '/api/users';
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
 toast({ title: "Thành công", description: "Lưu thông tin thành công!" });
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
 const res = await fetch(`/api/users/${confirmDeleteId}`, { method: 'DELETE' });
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

 const resetForm = () => {
 setEditId(null);
 setFormData({ name: "", email: "", password: "", roleId: "" });
 };

 const openEdit = (user: any) => {
 setEditId(user.id);
 setFormData({
 name: user.name,
 email: user.email,
 password: "",
 roleId: user.roleId || "",
 });
 setIsOpen(true);
 };

 const filteredUsers = users.filter(user => 
 (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
 (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
 );

 return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <h1 className="text-2xl font-bold text-zinc-900 ">Tài khoản Nội bộ</h1>
 <p className="text-sm text-zinc-500 mt-1">Quản lý tài khoản và phân quyền cho nhân viên.</p>
 </div>
 
 <Dialog open={isOpen} onOpenChange={(open) => {
 setIsOpen(open);
 if (!open) resetForm();
 }}>
 <DialogTrigger className="inline-flex items-center justify-center rounded-lg h-10 px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white shadow-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500">
 <Plus className="w-4 h-4 mr-2" />
 Thêm tài khoản
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>{editId ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới"}</DialogTitle>
 </DialogHeader>
 <div className="space-y-4 pt-4">
 <div>
 <Label>Họ và tên</Label>
 <Input 
 value={formData.name}
 onChange={e => setFormData({...formData, name: e.target.value})}
 className="mt-1.5" 
 />
 </div>
 <div>
 <Label>Email</Label>
 <Input 
 disabled={!!editId}
 value={formData.email}
 onChange={e => setFormData({...formData, email: e.target.value})}
 className="mt-1.5" 
 />
 </div>
 <div>
 <Label>Mật khẩu {editId && "(Bỏ trống nếu không muốn đổi)"}</Label>
 <Input 
 type="password"
 value={formData.password}
 onChange={e => setFormData({...formData, password: e.target.value})}
 className="mt-1.5" 
 />
 </div>
 {/* Ẩn chọn Quyền vì chỉ có 1 quyền mặc định
 <div>
 <Label>Quyền (Role)</Label>
 <Select value={formData.roleId} onValueChange={v => setFormData({...formData, roleId: v || ""})}>
 <SelectTrigger className="mt-1.5">
 <SelectValue placeholder="Chọn quyền">
 {formData.roleId ? roles.find((r: any) => r.id === formData.roleId)?.name : "Chọn quyền"}
 </SelectValue>
 </SelectTrigger>
 <SelectContent>
 {roles.map((r: any) => (
 <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 */}
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
 placeholder="Tìm theo tên, email..." 
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
 <TableHead className="font-semibold">Nhân viên</TableHead>
 {/* <TableHead className="font-semibold">Quyền (Role)</TableHead> */}
 <TableHead className="font-semibold text-center">Trạng thái</TableHead>
 <TableHead className="font-semibold text-right">Hành động</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {loading ? (
 <TableRow>
 <TableCell colSpan={3} className="text-center py-8 text-zinc-500">Đang tải dữ liệu...</TableCell>
 </TableRow>
 ) : filteredUsers.length === 0 ? (
 <TableRow>
 <TableCell colSpan={3} className="text-center py-8 text-zinc-500">Chưa có tài khoản nào</TableCell>
 </TableRow>
 ) : filteredUsers.map((user) => (
 <TableRow key={user.id} className="hover:bg-zinc-50 :bg-zinc-800/50">
 <TableCell>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
 <UserCircle className="w-6 h-6 text-zinc-400" />
 </div>
 <div>
 <p className="font-medium text-zinc-900 ">{user.name}</p>
 <p className="text-xs text-zinc-500">{user.email}</p>
 </div>
 </div>
 </TableCell>
 {/* <TableCell>
 <div className="flex items-center gap-1.5">
 <ShieldCheck className={`w-4 h-4 ${user.role?.name === "Super Admin" ? "text-primary" : "text-zinc-400"}`} />
 <span className="text-sm font-medium">{user.role?.name || "No Role"}</span>
 </div>
 </TableCell> */}
 <TableCell className="text-center">
 <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 ">
 Hoạt động
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
 <DropdownMenuItem onClick={() => openEdit(user)}>
 <Edit className="w-4 h-4 mr-2" />
 Chỉnh sửa
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem 
 className="text-red-600 focus:text-red-600"
 onClick={() => setConfirmDeleteId(user.id)}
 >
 <Trash2 className="w-4 h-4 mr-2" />
 Xóa tài khoản
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
 title="Xác nhận xóa tài khoản"
 description="Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác."
 confirmText="Xóa tài khoản"
 />
 </div>
 );
}
