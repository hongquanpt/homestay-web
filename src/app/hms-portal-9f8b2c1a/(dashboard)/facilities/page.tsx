"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Building2 } from "lucide-react";
import Swal from 'sweetalert2';

type Facility = {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  _count?: {
    rooms: number;
  }
};

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const res = await fetch("/api/facilities?admin=true");
      const data = await res.json();
      if (data.success) {
        setFacilities(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (uploadRes.ok) {
        const data = await uploadRes.json();
        setImageUrl(data.url);
      } else {
        Swal.fire('Lỗi', 'Không thể tải ảnh lên', 'error');
      }
    } catch (error) {
      console.error("Upload error:", error);
      Swal.fire('Lỗi', 'Có lỗi xảy ra khi tải ảnh', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/facilities/${editingId}` : "/api/facilities";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          description,
          imageUrl,
          isActive,
        }),
      });

      if (res.ok) {
        setIsAdding(false);
        setEditingId(null);
        fetchFacilities();
        // Reset form
        setName("");
        setAddress("");
        setDescription("");
        setImageUrl("");
        setIsActive(true);
        Swal.fire('Thành công', editingId ? 'Đã cập nhật chi nhánh' : 'Đã thêm chi nhánh mới', 'success');
      } else {
        Swal.fire('Lỗi', 'Có lỗi xảy ra khi lưu chi nhánh', 'error');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (facility: Facility) => {
    setName(facility.name);
    setAddress(facility.address || "");
    setDescription(facility.description || "");
    setImageUrl(facility.imageUrl || "");
    setIsActive(facility.isActive !== false);
    setEditingId(facility.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Bạn chắc chứ?',
      text: "Không thể phục hồi dữ liệu sau khi xóa!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Vâng, xóa nó!'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/facilities/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          fetchFacilities();
          Swal.fire('Đã xóa!', 'Chi nhánh đã được xóa.', 'success');
        } else {
          Swal.fire('Lỗi', data.message || 'Không thể xóa chi nhánh', 'error');
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý Chi nhánh</h1>
          <p className="text-zinc-500 mt-1">Danh sách các chi nhánh / chi nhánh của hệ thống</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            if (!isAdding) {
              setEditingId(null);
              setName("");
              setAddress("");
              setDescription("");
              setImageUrl("");
              setIsActive(true);
            }
          }}
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded hover:bg-zinc-800"
        >
          <Plus className="w-4 h-4" />
          Thêm Chi nhánh
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg border border-zinc-200 mb-8 shadow-sm">
          <h2 className="text-lg font-bold mb-4">{editingId ? "Chỉnh sửa Chi nhánh" : "Thêm Chi nhánh mới"}</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên chi nhánh (*)</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border p-2 rounded"
                  placeholder="VD: Chi nhánh 1 - Quận 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full border p-2 rounded"
                  placeholder="Nhập địa chỉ chi nhánh"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mô tả ngắn</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full border p-2 rounded h-20"
                placeholder="Giới thiệu về chi nhánh này"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hình đại diện (Ảnh)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="w-full border p-2 rounded cursor-pointer"
                />
                {isUploading && <span className="text-sm text-zinc-500 whitespace-nowrap">Đang tải...</span>}
              </div>
              {imageUrl && (
                <div className="mt-2 relative inline-block">
                  <img src={imageUrl} alt="Preview" className="h-32 object-cover rounded border" />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-zinc-300 focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-zinc-900 cursor-pointer">
                Đang hoạt động (Hiển thị cho khách hàng)
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 border rounded hover:bg-zinc-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-900 text-white rounded hover:bg-zinc-800"
              >
                Lưu Chi nhánh
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <p>Đang tải...</p>
      ) : facilities.length === 0 ? (
        <div className="bg-white p-12 text-center border rounded-lg">
          <Building2 className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-500">Chưa có chi nhánh nào. Hãy thêm chi nhánh đầu tiên.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 border-b">
              <tr>
                <th className="px-6 py-4 w-20">Hình ảnh</th>
                <th className="px-6 py-4">Tên Chi nhánh</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4">Địa chỉ</th>
                <th className="px-6 py-4 text-center">Số phòng</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {facilities.map((facility) => (
                <tr key={facility.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-4">
                    {facility.imageUrl ? (
                      <img src={facility.imageUrl} alt={facility.name} className="w-16 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-12 bg-zinc-200 rounded flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-zinc-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900">{facility.name}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${facility.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {facility.isActive !== false ? "Hoạt động" : "Tạm dừng"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-600">{facility.address || "-"}</td>
                  <td className="px-6 py-4 text-center text-zinc-600">{facility._count?.rooms || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(facility)}
                      className="text-blue-500 hover:text-blue-700 p-2"
                      title="Chỉnh sửa"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                    <button
                      onClick={() => handleDelete(facility.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
