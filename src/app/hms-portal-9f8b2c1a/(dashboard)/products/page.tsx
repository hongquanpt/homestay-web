"use client";

import { useState, useEffect } from "react";
import { 
 Search, 
 Plus, 
 MoreVertical, 
 Edit, 
 Trash2, 
 Package
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
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";

export default function AdminProductsPage() {
 const [searchTerm, setSearchTerm] = useState("");
 const [products, setProducts] = useState<any[]>([]);
 const [categories, setCategories] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const { toast } = useToast();
 const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

 const [isOpen, setIsOpen] = useState(false);
 const [editId, setEditId] = useState<string | null>(null);
 const [formData, setFormData] = useState({
 name: "",
 categoryId: "",
 price: "",
 maxQuantity: "99",
 });

 const fetchData = async () => {
 setLoading(true);
 try {
 const [prodRes, catRes] = await Promise.all([
 fetch('/api/products'),
 fetch('/api/product-categories')
 ]);
 const prodData = await prodRes.json();
 const catData = await catRes.json();
 setProducts(prodData);
 setCategories(catData);
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
 setFormData({ name: "", categoryId: "", price: "", maxQuantity: "99" });
 };

 const handleSave = async () => {
 try {
 const url = editId ? `/api/products/${editId}` : '/api/products';
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
 toast({ title: "Thành công", description: "Đã lưu sản phẩm!" });
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
 const res = await fetch(`/api/products/${confirmDeleteId}`, { method: 'DELETE' });
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

 const openEdit = (product: any) => {
 setEditId(product.id);
 setFormData({
 name: product.name,
 categoryId: product.categoryId || "",
 price: product.price.toString(),
 maxQuantity: product.maxQuantity.toString(),
 });
 setIsOpen(true);
 };

 const handleAddCategory = async () => {
   const name = window.prompt("Nhập tên danh mục mới:");
   if (!name?.trim()) return;
   try {
     const res = await fetch("/api/product-categories", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ name: name.trim() })
     });
     if (res.ok) {
       toast({ title: "Thành công", description: "Đã thêm danh mục mới" });
       fetchData();
     } else {
       const err = await res.json();
       toast({ title: "Lỗi", description: err.error, variant: "destructive" });
     }
   } catch (e) {
     toast({ title: "Lỗi", description: "Không thể thêm danh mục", variant: "destructive" });
   }
 };

 const filteredProducts = products.filter(p => 
 p.name.toLowerCase().includes(searchTerm.toLowerCase())
 );

 return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <h1 className="text-2xl font-bold text-zinc-900 ">Sản phẩm & Dịch vụ</h1>
 <p className="text-sm text-zinc-500 mt-1">Quản lý đồ ăn, thức uống và các gói trang trí.</p>
 </div>
 
 <Dialog open={isOpen} onOpenChange={(open) => {
 setIsOpen(open);
 if (!open) resetForm();
 }}>
 <DialogTrigger className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white shadow-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500">
 <Plus className="w-4 h-4 mr-2" />
 Thêm sản phẩm
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>{editId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</DialogTitle>
 </DialogHeader>
 <div className="space-y-4 pt-4">
 <div>
 <Label>Tên sản phẩm</Label>
 <Input 
 value={formData.name}
 onChange={e => setFormData({...formData, name: e.target.value})}
 placeholder="VD: Nước khoáng Lavie" className="mt-1.5" 
 />
 </div>
 <div>
 <Label>Danh mục</Label>
 <div className="flex items-center gap-2 mt-1.5">
   <Select value={formData.categoryId} onValueChange={v => setFormData({...formData, categoryId: v || ""})}>
   <SelectTrigger className="flex-1">
   <SelectValue placeholder="Chọn danh mục">
   {formData.categoryId ? categories.find((c: any) => c.id === formData.categoryId)?.name : "Chọn danh mục"}
   </SelectValue>
   </SelectTrigger>
   <SelectContent>
   {categories.map((c: any) => (
   <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
   ))}
   </SelectContent>
   </Select>
   <Button variant="outline" size="icon" type="button" onClick={handleAddCategory} title="Thêm danh mục mới">
     <Plus className="w-4 h-4" />
   </Button>
 </div>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <Label>Giá bán (VNĐ)</Label>
 <Input 
 type="number"
 value={formData.price}
 onChange={e => setFormData({...formData, price: e.target.value})}
 placeholder="15000" className="mt-1.5" 
 />
 </div>
 <div>
 <Label>Tối đa/đơn</Label>
 <Input 
 type="number"
 value={formData.maxQuantity}
 onChange={e => setFormData({...formData, maxQuantity: e.target.value})}
 placeholder="99" className="mt-1.5" 
 />
 </div>
 </div>
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
 placeholder="Tìm tên sản phẩm..." 
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
 <TableHead className="font-semibold">Tên sản phẩm</TableHead>
 <TableHead className="font-semibold">Danh mục</TableHead>
 <TableHead className="font-semibold text-right">Giá bán</TableHead>
 <TableHead className="font-semibold text-center">Tối đa/đơn</TableHead>
 <TableHead className="font-semibold text-right">Hành động</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {loading ? (
 <TableRow>
 <TableCell colSpan={6} className="text-center py-8 text-zinc-500">Đang tải dữ liệu...</TableCell>
 </TableRow>
 ) : filteredProducts.length === 0 ? (
 <TableRow>
 <TableCell colSpan={6} className="text-center py-8 text-zinc-500">Không có sản phẩm nào</TableCell>
 </TableRow>
 ) : filteredProducts.map((product) => (
 <TableRow key={product.id} className="hover:bg-zinc-50 :bg-zinc-800/50">
 <TableCell>
 <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
 <Package className="w-5 h-5 text-zinc-400" />
 </div>
 </TableCell>
 <TableCell className="font-medium text-zinc-900 ">
 {product.name}
 </TableCell>
 <TableCell>
 <span className="text-sm text-zinc-600 ">{product.category?.name}</span>
 </TableCell>
 <TableCell className="text-right font-medium text-primary">
 {product.price.toLocaleString()}đ
 </TableCell>
 <TableCell className="text-center font-medium">
 {product.maxQuantity}
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
 <DropdownMenuItem onClick={() => openEdit(product)}>
 <Edit className="w-4 h-4 mr-2" />
 Chỉnh sửa
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem 
 className="text-red-600 focus:text-red-600"
 onClick={() => setConfirmDeleteId(product.id)}
 >
 <Trash2 className="w-4 h-4 mr-2" />
 Xóa sản phẩm
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
 title="Xác nhận xóa sản phẩm"
 description="Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác."
 confirmText="Xóa sản phẩm"
 />
 </div>
 );
}
