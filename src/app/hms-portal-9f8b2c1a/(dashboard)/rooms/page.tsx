"use client";

import { useState, useEffect } from "react";
import { 
 Search, 
 Plus, 
 MoreVertical, 
 Edit, 
 Trash2, 
 KeyRound,
 Image as ImageIcon,
 Percent
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

export default function AdminRoomsPage() {
 const [searchTerm, setSearchTerm] = useState("");
 const [rooms, setRooms] = useState<any[]>([]);
 const [roomTypes, setRoomTypes] = useState<any[]>([]);
 const [amenities, setAmenities] = useState<any[]>([]);
 const [facilities, setFacilities] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 // Form chính
 const [isOpen, setIsOpen] = useState(false);
 const [editId, setEditId] = useState<string | null>(null);
 const [formData, setFormData] = useState({
 name: "", 
 description: "", 
 roomTypeId: "", 
 facilityId: "",
 pricePerHour: "0", 
 pricePerNight: "0", 
 priceNoon: "260000", 
 priceAfternoon: "260000", 
 priceEvening: "260000", 
 priceOvernight: "420000", 
 status: "ACTIVE",
 amenityIds: [] as string[]
 });

 // Access Info Form
 const [accessOpen, setAccessOpen] = useState(false);
 const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
 const [accessData, setAccessData] = useState({
 address: "",
 houseNumber: "",
 roomNumber: "",
 floor: "",
 roomPassword: "",
 wifiName: "",
 wifiPassword: "",
 parkingInfo: "",
 googleMapsUrl: ""
 });

 // Images Form
 const [imagesOpen, setImagesOpen] = useState(false);
 const [roomImages, setRoomImages] = useState<any[]>([]);
 const [selectedFile, setSelectedFile] = useState<File | null>(null);
 const [isUploading, setIsUploading] = useState(false);
  
 // Discount Form
 const [discountOpen, setDiscountOpen] = useState(false);
 const [roomDiscounts, setRoomDiscounts] = useState<any[]>([]);
 const [discountForm, setDiscountForm] = useState({
 dayOfWeek: "1",
 packageId: "noon",
 type: "pct",
 value: ""
 });

 const { toast } = useToast();
 const [confirmAction, setConfirmAction] = useState<{isOpen: boolean, type: "room" | "image" | null, id: string | null}>({ isOpen: false, type: null, id: null });

 const fetchData = async () => {
 setLoading(true);
 try {
 const [roomsRes, typesRes, amenitiesRes, facilitiesRes] = await Promise.all([
 fetch('/api/rooms'),
 fetch('/api/room-types'),
 fetch('/api/amenities'),
 fetch('/api/facilities')
 ]);
 const roomsData = await roomsRes.json();
 const typesData = await typesRes.json();
 const amenitiesData = await amenitiesRes.json();
 const facilitiesData = await facilitiesRes.json();
 setRooms(roomsData);
 setRoomTypes(typesData);
 setAmenities(amenitiesData);
 if (facilitiesData.success) {
  setFacilities(facilitiesData.data);
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
 setFormData({ name: "", description: "", roomTypeId: "", facilityId: "", pricePerHour: "0", pricePerNight: "0", priceNoon: "260000", priceAfternoon: "260000", priceEvening: "260000", priceOvernight: "420000", status: "ACTIVE", amenityIds: [] });
 };

 const handleSave = async () => {
 try {
 const url = editId ? `/api/rooms/${editId}` : '/api/rooms';
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
 toast({ title: "Thành công", description: "Lưu phòng thành công!" });
 } else {
 const err = await res.json();
 toast({ title: "Lỗi", description: err.error, variant: "destructive" });
 }
 } catch (e) {
 toast({ title: "Lỗi", description: "Có lỗi xảy ra", variant: "destructive" });
 }
 };

 const executeConfirmAction = async () => {
 if (!confirmAction.id || !confirmAction.type) return;

 if (confirmAction.type === "room") {
 try {
 const res = await fetch(`/api/rooms/${confirmAction.id}`, { method: 'DELETE' });
 if (res.ok) {
 fetchData();
 } else {
 const err = await res.json();
 toast({ title: "Lỗi", description: err.error, variant: "destructive" });
 }
 } catch (e) {
 toast({ title: "Lỗi", description: "Có lỗi xảy ra", variant: "destructive" });
 }
 } else if (confirmAction.type === "image") {
 try {
 const res = await fetch(`/api/rooms/${selectedRoomId}/images?imageId=${confirmAction.id}`, {
 method: 'DELETE'
 });
 if (res.ok) {
 fetchImages(selectedRoomId!);
 } else {
 const err = await res.json();
 toast({ title: "Lỗi", description: err.error, variant: "destructive" });
 }
 } catch (e) {
 toast({ title: "Lỗi", description: "Có lỗi xảy ra", variant: "destructive" });
 }
 }

 setConfirmAction({ isOpen: false, type: null, id: null });
 };

 const openEdit = (room: any) => {
 setEditId(room.id);
 setFormData({
 name: room.name,
 description: room.description || "",
 roomTypeId: room.roomType?.id || "",
 facilityId: room.facilityId || "",
 pricePerHour: room.pricePerHour?.toString() || "0",
 pricePerNight: room.pricePerNight?.toString() || "0",
 priceNoon: room.priceNoon?.toString() || "260000",
 priceAfternoon: room.priceAfternoon?.toString() || "260000",
 priceEvening: room.priceEvening?.toString() || "260000",
 priceOvernight: room.priceOvernight?.toString() || "420000",
 status: room.status || "ACTIVE",
 amenityIds: room.amenities?.map((a: any) => a.id) || []
 });
 setIsOpen(true);
 };

 const openAccessInfo = async (roomId: string) => {
 setSelectedRoomId(roomId);
 setAccessData({
 address: "", houseNumber: "", roomNumber: "", floor: "",
 roomPassword: "", wifiName: "", wifiPassword: "",
 parkingInfo: "", googleMapsUrl: ""
 });
 setAccessOpen(true);
 
 // Fetch current access info
 try {
 const res = await fetch(`/api/rooms/${roomId}/access`);
 if (res.ok) {
 const data = await res.json();
 setAccessData({
 address: data.address || "",
 houseNumber: data.houseNumber || "",
 roomNumber: data.roomNumber || "",
 floor: data.floor || "",
 roomPassword: data.roomPassword || "",
 wifiName: data.wifiName || "",
 wifiPassword: data.wifiPassword || "",
 parkingInfo: data.parkingInfo || "",
 googleMapsUrl: data.googleMapsUrl || ""
 });
 }
 } catch (e) {
 console.error(e);
 }
 };

 const handleSaveAccessInfo = async () => {
 if (!selectedRoomId) return;
 try {
 const res = await fetch(`/api/rooms/${selectedRoomId}/access`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(accessData)
 });
 if (res.ok) {
 setAccessOpen(false);
 toast({ title: "Thành công", description: "Lưu thông tin Check-in bí mật thành công!" });
 } else {
 const err = await res.json();
 toast({ title: "Lỗi", description: err.error, variant: "destructive" });
 }
 } catch (e) {
 toast({ title: "Lỗi", description: "Có lỗi xảy ra", variant: "destructive" });
 }
 };

 const openImages = async (roomId: string) => {
 setSelectedRoomId(roomId);
 setRoomImages([]);
 setImagesOpen(true);
 fetchImages(roomId);
 };

 const fetchImages = async (roomId: string) => {
 try {
 const res = await fetch(`/api/rooms/${roomId}/images`);
 if (res.ok) {
 const data = await res.json();
 setRoomImages(data);
 }
 } catch (e) {
 console.error(e);
 }
 };

 const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files[0]) {
 setSelectedFile(e.target.files[0]);
 }
 };

 const handleUploadImage = async () => {
 if (!selectedRoomId || !selectedFile) return;
 setIsUploading(true);
 try {
 const formData = new FormData();
 formData.append('file', selectedFile);

 const uploadRes = await fetch('/api/upload', {
 method: 'POST',
 body: formData
 });

 if (uploadRes.ok) {
 const data = await uploadRes.json();
 const res = await fetch(`/api/rooms/${selectedRoomId}/images`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ url: data.url })
 });
 
 if (res.ok) {
 setSelectedFile(null);
 const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
 if (fileInput) fileInput.value = '';
 fetchImages(selectedRoomId);
 toast({ title: "Thành công", description: "Tải ảnh lên thành công!" });
 } else {
 const err = await res.json();
 toast({ title: "Lỗi lưu ảnh", description: err.error, variant: "destructive" });
 }
 } else {
 const err = await uploadRes.json();
 toast({ title: "Lỗi tải ảnh lên", description: err.error, variant: "destructive" });
 }
 } catch (e) {
 toast({ title: "Lỗi", description: "Có lỗi xảy ra", variant: "destructive" });
 } finally {
 setIsUploading(false);
 }
 };

 const handleDeleteImage = async (imageId: string) => {
 if (!selectedRoomId) return;
 setConfirmAction({ isOpen: true, type: "image", id: imageId });
 };

 const openDiscounts = async (roomId: string) => {
 setSelectedRoomId(roomId);
 setDiscountOpen(true);
 fetchDiscounts(roomId);
 };

 const fetchDiscounts = async (roomId: string) => {
 try {
 const res = await fetch(`/api/rooms/${roomId}/discounts`);
 if (res.ok) {
 const data = await res.json();
 setRoomDiscounts(data);
 }
 } catch (e) {
 console.error(e);
 }
 };

 const handleSaveDiscount = async () => {
 if (!selectedRoomId || !discountForm.value) return;
 try {
 const payload = {
 dayOfWeek: parseInt(discountForm.dayOfWeek),
 packageId: discountForm.packageId,
 discountPct: discountForm.type === "pct" ? parseFloat(discountForm.value) : null,
 discountAmt: discountForm.type === "amt" ? parseFloat(discountForm.value) : null,
 };
 const res = await fetch(`/api/rooms/${selectedRoomId}/discounts`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload)
 });
 if (res.ok) {
 setDiscountForm({ ...discountForm, value: "" });
 fetchDiscounts(selectedRoomId);
 toast({ title: "Thành công", description: "Đã lưu giảm giá!" });
 } else {
 const err = await res.json();
 toast({ title: "Lỗi", description: err.error, variant: "destructive" });
 }
 } catch (e) {
 toast({ title: "Lỗi", description: "Có lỗi xảy ra", variant: "destructive" });
 }
 };

 const handleDeleteDiscount = async (discountId: string) => {
 if (!selectedRoomId) return;
 try {
 const res = await fetch(`/api/rooms/${selectedRoomId}/discounts/${discountId}`, { method: 'DELETE' });
 if (res.ok) {
 fetchDiscounts(selectedRoomId);
 toast({ title: "Thành công", description: "Đã xóa giảm giá!" });
 } else {
 const err = await res.json();
 toast({ title: "Lỗi", description: err.error, variant: "destructive" });
 }
 } catch (e) {
 toast({ title: "Lỗi", description: "Có lỗi xảy ra", variant: "destructive" });
 }
 };

 const filteredRooms = rooms.filter(r => 
 r.name.toLowerCase().includes(searchTerm.toLowerCase())
 );

 return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <h1 className="text-2xl font-bold text-zinc-900 ">Quản lý Phòng</h1>
 <p className="text-sm text-zinc-500 mt-1">Quản lý danh sách phòng, giá cả và thông tin check-in bí mật.</p>
 </div>
 
 <Dialog open={isOpen} onOpenChange={(open) => {
 setIsOpen(open);
 if (!open) resetForm();
 }}>
 <DialogTrigger className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white shadow-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500">
 <Plus className="w-4 h-4 mr-2" />
 Thêm phòng mới
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>{editId ? "Chỉnh sửa phòng" : "Thêm phòng mới"}</DialogTitle>
 </DialogHeader>
 <div className="space-y-4 pt-4">
 <div>
 <Label>Tên phòng</Label>
 <Input 
 value={formData.name}
 onChange={e => setFormData({...formData, name: e.target.value})}
 placeholder="VD: Standard Room 101" className="mt-1.5" 
 />
 </div>
 <div>
 <Label>Loại phòng</Label>
 <Select value={formData.roomTypeId} onValueChange={v => setFormData({...formData, roomTypeId: v || ""})}>
 <SelectTrigger className="mt-1.5">
 <SelectValue placeholder="Chọn loại phòng">
 {formData.roomTypeId ? roomTypes.find((rt: any) => rt.id === formData.roomTypeId)?.name : "Chọn loại phòng"}
 </SelectValue>
 </SelectTrigger>
 <SelectContent>
 {roomTypes.map((rt: any) => (
 <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div>
 <Label>Chi nhánh (Facility)</Label>
 <Select value={formData.facilityId} onValueChange={v => setFormData({...formData, facilityId: v || ""})}>
 <SelectTrigger className="mt-1.5">
 <SelectValue placeholder="Chọn chi nhánh">
 {formData.facilityId ? facilities.find((f: any) => f.id === formData.facilityId)?.name : "Chọn chi nhánh"}
 </SelectValue>
 </SelectTrigger>
 <SelectContent>
 {facilities.map((f: any) => (
 <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
 ))}
 <SelectItem value="">Bỏ chọn</SelectItem>
 </SelectContent>
 </Select>
 </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Giá Khung 11:00 - 14:00</Label>
              <Input 
                type="number"
                value={formData.priceNoon}
                onChange={e => setFormData({...formData, priceNoon: e.target.value})}
                placeholder="260000" className="mt-1.5" 
              />
            </div>
            <div>
              <Label>Giá Khung 14:30 - 17:30</Label>
              <Input 
                type="number"
                value={formData.priceAfternoon}
                onChange={e => setFormData({...formData, priceAfternoon: e.target.value})}
                placeholder="260000" className="mt-1.5" 
              />
            </div>
            <div>
              <Label>Giá Khung 18:00 - 21:00</Label>
              <Input 
                type="number"
                value={formData.priceEvening}
                onChange={e => setFormData({...formData, priceEvening: e.target.value})}
                placeholder="260000" className="mt-1.5" 
              />
            </div>
            <div>
              <Label>Giá Khung Qua đêm (21:30 - 10:30)</Label>
              <Input 
                type="number"
                value={formData.priceOvernight}
                onChange={e => setFormData({...formData, priceOvernight: e.target.value})}
                placeholder="420000" className="mt-1.5" 
              />
            </div>
          </div>
 <div>
 <Label>Mô tả chi tiết</Label>
 <Textarea 
 value={formData.description}
 onChange={e => setFormData({...formData, description: e.target.value})}
 placeholder="Nhập mô tả về phòng..." className="mt-1.5 min-h-[100px]" 
 />
 </div>
 <div>
 <Label className="mb-2 block">Tiện ích</Label>
 <div className="grid grid-cols-2 gap-2 mt-1.5 p-3 border border-zinc-200 rounded-lg max-h-48 overflow-y-auto">
 {amenities.map(a => (
 <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-zinc-50 :bg-zinc-800 p-1.5 rounded-md transition-colors">
 <input 
 type="checkbox" 
 checked={formData.amenityIds.includes(a.id)}
 onChange={(e) => {
 const newIds = e.target.checked 
 ? [...formData.amenityIds, a.id] 
 : formData.amenityIds.filter(id => id !== a.id);
 setFormData({ ...formData, amenityIds: newIds });
 }}
 className="rounded border-zinc-300 text-primary focus:ring-amber-500"
 />
 <span className="text-zinc-700 ">{a.name}</span>
 </label>
 ))}
 {amenities.length === 0 && (
 <span className="text-xs text-zinc-500 italic col-span-2">Chưa có tiện ích nào. Hãy thêm trong Quản lý Tiện ích.</span>
 )}
 </div>
 </div>
 <div>
 <Label>Trạng thái</Label>
  <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v || "ACTIVE"})}>
  <SelectTrigger className="mt-1.5">
  <SelectValue placeholder="Chọn trạng thái">
  {formData.status === "ACTIVE" ? "Đang hoạt động" : formData.status === "COMING_SOON" ? "Sắp ra mắt" : "Tạm ngưng"}
  </SelectValue>
  </SelectTrigger>
  <SelectContent>
  <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
  <SelectItem value="COMING_SOON">Sắp ra mắt</SelectItem>
  <SelectItem value="MAINTENANCE">Bảo trì</SelectItem>
  </SelectContent>
 </Select>
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
 placeholder="Tìm tên phòng..." 
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
 <TableHead className="font-semibold">Mã phòng</TableHead>
 <TableHead className="font-semibold">Tên phòng</TableHead>
 <TableHead className="font-semibold">Chi nhánh</TableHead>
 <TableHead className="font-semibold">Loại</TableHead>
 <TableHead className="font-semibold text-right">11:00-14:00</TableHead>
 <TableHead className="font-semibold text-right">14:30-17:30</TableHead>
 <TableHead className="font-semibold text-right">18:00-21:00</TableHead>
 <TableHead className="font-semibold text-right">Qua đêm</TableHead>
 <TableHead className="font-semibold text-center">Trạng thái</TableHead>
 <TableHead className="font-semibold text-right">Hành động</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {loading ? (
 <TableRow>
 <TableCell colSpan={9} className="text-center py-8 text-zinc-500">Đang tải dữ liệu...</TableCell>
 </TableRow>
 ) : filteredRooms.length === 0 ? (
 <TableRow>
 <TableCell colSpan={9} className="text-center py-8 text-zinc-500">Không có phòng nào được tìm thấy</TableCell>
 </TableRow>
 ) : filteredRooms.map((room) => (
 <TableRow key={room.id} className="hover:bg-zinc-50 :bg-zinc-800/50">
 <TableCell className="font-mono text-xs text-zinc-500">{room.id.slice(0,8)}</TableCell>
 <TableCell className="font-medium text-zinc-900 ">{room.name}</TableCell>
 <TableCell>
 <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg">
 {facilities.find((f: any) => f.id === room.facilityId)?.name || 'N/A'}
 </span>
 </TableCell>
 <TableCell>
 <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 text-xs font-medium rounded-lg">
 {room.roomType?.name || 'N/A'}
 </span>
 </TableCell>
 <TableCell className="text-right font-medium">{(room.priceNoon ?? 260000).toLocaleString()}đ</TableCell>
 <TableCell className="text-right font-medium">{(room.priceAfternoon ?? 260000).toLocaleString()}đ</TableCell>
 <TableCell className="text-right font-medium">{(room.priceEvening ?? 260000).toLocaleString()}đ</TableCell>
 <TableCell className="text-right font-medium">{(room.priceOvernight ?? 420000).toLocaleString()}đ</TableCell>
 <TableCell className="text-center">
 <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
 room.status === "ACTIVE" 
 ? "bg-emerald-100 text-emerald-700 "
 : room.status === "COMING_SOON"
 ? "bg-orange-100 text-orange-700 "
 : "bg-primary/10 text-primary "
 }`}>
 {room.status === "ACTIVE" ? "Đang hoạt động" : room.status === "COMING_SOON" ? "Sắp ra mắt" : "Bảo trì"}
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
 <DropdownMenuItem onClick={() => openEdit(room)}>
 <Edit className="w-4 h-4 mr-2" />
 Chỉnh sửa
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => openImages(room.id)}>
 <ImageIcon className="w-4 h-4 mr-2" />
 Quản lý hình ảnh
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => openDiscounts(room.id)}>
 <Percent className="w-4 h-4 mr-2" />
 Quản lý giảm giá
 </DropdownMenuItem>
 <DropdownMenuItem className="text-primary focus:text-primary" onClick={() => openAccessInfo(room.id)}>
 <KeyRound className="w-4 h-4 mr-2" />
 Thông tin Check-in bí mật
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem 
 className="text-red-600 focus:text-red-600"
 onClick={() => setConfirmAction({ isOpen: true, type: "room", id: room.id })}
 >
 <Trash2 className="w-4 h-4 mr-2" />
 Xóa phòng
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

 {/* Access Info Modal */}
 <Dialog open={accessOpen} onOpenChange={setAccessOpen}>
 <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>Thông tin Check-in Bí Mật</DialogTitle>
 </DialogHeader>
 <div className="space-y-4 pt-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div><Label>Địa chỉ</Label><Input value={accessData.address} onChange={e => setAccessData({...accessData, address: e.target.value})} /></div>
 <div><Label>Số nhà / Tên tòa nhà</Label><Input value={accessData.houseNumber} onChange={e => setAccessData({...accessData, houseNumber: e.target.value})} /></div>
 <div><Label>Số phòng</Label><Input value={accessData.roomNumber} onChange={e => setAccessData({...accessData, roomNumber: e.target.value})} /></div>
 <div><Label>Tầng</Label><Input value={accessData.floor} onChange={e => setAccessData({...accessData, floor: e.target.value})} /></div>
 <div><Label>Mật khẩu cửa phòng</Label><Input value={accessData.roomPassword} onChange={e => setAccessData({...accessData, roomPassword: e.target.value})} /></div>
 <div><Label>Tên Wifi</Label><Input value={accessData.wifiName} onChange={e => setAccessData({...accessData, wifiName: e.target.value})} /></div>
 <div><Label>Mật khẩu Wifi</Label><Input value={accessData.wifiPassword} onChange={e => setAccessData({...accessData, wifiPassword: e.target.value})} /></div>
 </div>
 <div>
 <Label>Hướng dẫn gửi xe</Label>
 <Input value={accessData.parkingInfo} onChange={e => setAccessData({...accessData, parkingInfo: e.target.value})} />
 </div>
 <div>
 <Label>Link Google Maps</Label>
 <Input value={accessData.googleMapsUrl} onChange={e => setAccessData({...accessData, googleMapsUrl: e.target.value})} />
 </div>
 <div className="pt-2 flex justify-end gap-2">
 <Button variant="outline" onClick={() => setAccessOpen(false)}>Hủy</Button>
 <Button onClick={handleSaveAccessInfo}>Lưu thông tin</Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>

 {/* Images Modal */}
 <Dialog open={imagesOpen} onOpenChange={setImagesOpen}>
 <DialogContent className="max-w-xl">
 <DialogHeader>
 <DialogTitle>Quản lý Hình ảnh Phòng</DialogTitle>
 </DialogHeader>
 <div className="space-y-4 pt-4">
 <div className="flex flex-col gap-2">
 <Label>Tải ảnh lên từ máy tính</Label>
 <div className="flex gap-2">
 <Input 
 type="file" 
 accept="image/*"
 onChange={handleFileSelect}
 className="cursor-pointer"
 />
 <Button onClick={handleUploadImage} disabled={!selectedFile || isUploading}>
 {isUploading ? "Đang tải..." : "Tải lên"}
 </Button>
 </div>
 </div>
 
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 max-h-72 overflow-y-auto p-1">
 {roomImages.map(img => (
 <div key={img.id} className="relative group rounded-md overflow-hidden border">
 <img src={img.url} alt="Room" className="w-full h-28 object-cover" />
 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
 <Button variant="destructive" size="icon" onClick={() => handleDeleteImage(img.id)}>
 <Trash2 className="w-4 h-4" />
 </Button>
 </div>
 </div>
 ))}
 {roomImages.length === 0 && (
 <div className="col-span-full text-center text-zinc-500 py-4 text-sm">Chưa có hình ảnh nào</div>
 )}
 </div>
 </div>
 </DialogContent>
 </Dialog>

 {/* Discount Modal */}
 <Dialog open={discountOpen} onOpenChange={setDiscountOpen}>
 <DialogContent className="max-w-2xl">
 <DialogHeader>
 <DialogTitle>Quản lý giảm giá theo khung giờ</DialogTitle>
 </DialogHeader>
 <div className="space-y-4 pt-4">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div>
      <Label>Thứ</Label>
      <Select value={discountForm.dayOfWeek} onValueChange={v => setDiscountForm({...discountForm, dayOfWeek: v as string})}>
        <SelectTrigger className="mt-1.5">
          <SelectValue placeholder="Chọn thứ">
            {['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][parseInt(discountForm.dayOfWeek)]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Thứ 2</SelectItem>
          <SelectItem value="2">Thứ 3</SelectItem>
          <SelectItem value="3">Thứ 4</SelectItem>
          <SelectItem value="4">Thứ 5</SelectItem>
          <SelectItem value="5">Thứ 6</SelectItem>
          <SelectItem value="6">Thứ 7</SelectItem>
          <SelectItem value="0">Chủ nhật</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label>Khung giờ</Label>
      <Select value={discountForm.packageId} onValueChange={v => setDiscountForm({...discountForm, packageId: v as string})}>
        <SelectTrigger className="mt-1.5">
          <SelectValue placeholder="Chọn khung">
            {discountForm.packageId === 'noon' ? '11:00 - 14:00' : 
             discountForm.packageId === 'afternoon' ? '14:30 - 17:30' : 
             discountForm.packageId === 'evening' ? '18:00 - 21:00' : 
             discountForm.packageId === 'overnight' ? '21:30 - 10:30' : 'Tất cả'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tất cả</SelectItem>
          <SelectItem value="noon">11:00 - 14:00</SelectItem>
          <SelectItem value="afternoon">14:30 - 17:30</SelectItem>
          <SelectItem value="evening">18:00 - 21:00</SelectItem>
          <SelectItem value="overnight">21:30 - 10:30</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
    <div>
      <Label>Giảm theo</Label>
      <Select value={discountForm.type} onValueChange={v => setDiscountForm({...discountForm, type: v as string})}>
        <SelectTrigger className="mt-1.5">
          <SelectValue placeholder="Giảm theo">
            {discountForm.type === 'pct' ? '%' : 'VNĐ'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pct">%</SelectItem>
          <SelectItem value="amt">VNĐ</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="sm:col-span-2">
      <Label>Mức giảm</Label>
      <div className="flex gap-2 mt-1.5">
        <Input type="number" placeholder={discountForm.type === 'pct' ? "VD: 10" : "VD: 50000"} value={discountForm.value} onChange={e => setDiscountForm({...discountForm, value: e.target.value})} className="flex-1" />
        <Button onClick={handleSaveDiscount} className="shrink-0">Lưu cấu hình</Button>
      </div>
    </div>
  </div>

 <div className="mt-6 max-h-72 overflow-y-auto border border-zinc-200 rounded-md">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Thứ</TableHead>
 <TableHead>Khung giờ</TableHead>
 <TableHead>Mức giảm</TableHead>
 <TableHead></TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {roomDiscounts.map(d => (
 <TableRow key={d.id}>
 <TableCell>{['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][d.dayOfWeek]}</TableCell>
                    <TableCell>
                      {d.packageId === 'noon' ? '11:00 - 14:00' : 
                       d.packageId === 'afternoon' ? '14:30 - 17:30' : 
                       d.packageId === 'evening' ? '18:00 - 21:00' : 
                       d.packageId === 'overnight' ? '21:30 - 10:30' : 'Tất cả'}
                    </TableCell>
 <TableCell className="font-bold text-primary">
 {d.discountPct ? `${d.discountPct}%` : `${d.discountAmt?.toLocaleString('vi-VN')}đ`}
 </TableCell>
 <TableCell className="text-right">
 <Button variant="ghost" size="sm" onClick={() => handleDeleteDiscount(d.id)} className="text-red-500 hover:text-red-700">
 <Trash2 className="w-4 h-4" />
 </Button>
 </TableCell>
 </TableRow>
 ))}
 {roomDiscounts.length === 0 && (
 <TableRow>
 <TableCell colSpan={4} className="text-center text-zinc-500 py-8">Chưa có cấu hình giảm giá</TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 </div>
 </div>
 </DialogContent>
 </Dialog>

 <ConfirmModal
 isOpen={confirmAction.isOpen}
 onClose={() => setConfirmAction({ isOpen: false, type: null, id: null })}
 onConfirm={executeConfirmAction}
 title={confirmAction.type === "room" ? "Xác nhận xóa phòng" : "Xác nhận xóa ảnh"}
 description={
 confirmAction.type === "room"
 ? "Bạn có chắc chắn muốn xóa phòng này? Hành động này không thể hoàn tác."
 : "Bạn có chắc chắn muốn xóa hình ảnh này không?"
 }
 confirmText="Xóa"
 />
 </div>
 );
}
