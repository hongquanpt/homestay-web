"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, Clock, Percent, DollarSign } from "lucide-react";

type SurchargeRule = {
  id: string;
  name: string;
  type: "DATE" | "DAY_OF_WEEK";
  targetDate: string | null;
  dayOfWeek: number | null;
  packageId: string;
  surchargePct: number | null;
  surchargeAmt: number | null;
};

export default function SurchargesPage() {
  const [rules, setRules] = useState<SurchargeRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<"DATE" | "DAY_OF_WEEK">("DAY_OF_WEEK");
  const [targetDate, setTargetDate] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<number>(6); // Saturday
  const [packageId, setPackageId] = useState("ALL");
  const [surchargeType, setSurchargeType] = useState<"PCT" | "AMT">("AMT");
  const [surchargePct, setSurchargePct] = useState<number | "">("");
  const [surchargeAmt, setSurchargeAmt] = useState<number | "">("");

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/surcharges");
      const data = await res.json();
      setRules(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/surcharges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          targetDate: type === "DATE" ? targetDate : null,
          dayOfWeek: type === "DAY_OF_WEEK" ? dayOfWeek : null,
          packageId,
          surchargePct: surchargeType === "PCT" ? Number(surchargePct) : null,
          surchargeAmt: surchargeType === "AMT" ? Number(surchargeAmt) : null,
        }),
      });

      if (res.ok) {
        setIsAdding(false);
        fetchRules();
        // Reset form
        setName("");
        setTargetDate("");
        setSurchargePct("");
        setSurchargeAmt("");
      } else {
        alert("Có lỗi xảy ra khi thêm phụ thu");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phụ thu này?")) return;
    try {
      await fetch(`/api/surcharges/${id}`, { method: "DELETE" });
      fetchRules();
    } catch (error) {
      console.error(error);
    }
  };

  const daysOfWeek = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const packages = [
    { id: "ALL", name: "Tất cả các ca" },
    { id: "noon", name: "Ca trưa (11h-14h)" },
    { id: "afternoon", name: "Ca chiều (14h30-17h30)" },
    { id: "evening", name: "Ca tối (18h-21h)" },
    { id: "overnight", name: "Qua đêm (21h30-10h30)" },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý Phụ thu & Lễ, Tết</h1>
          <p className="text-zinc-500 mt-1">Cấu hình tự động tăng giá vào cuối tuần, ngày Lễ</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded hover:bg-zinc-800"
        >
          <Plus className="w-4 h-4" />
          Thêm quy tắc
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg border border-zinc-200 mb-8 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Thêm quy tắc phụ thu mới</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tên quy tắc (vd: Phụ thu Lễ 30/4)</label>
              <input
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Loại phụ thu</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full border p-2 rounded"
                >
                  <option value="DAY_OF_WEEK">Định kỳ theo thứ (vd: T7, CN)</option>
                  <option value="DATE">Theo ngày cụ thể (vd: 30/04)</option>
                </select>
              </div>

              {type === "DAY_OF_WEEK" ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Áp dụng vào ngày</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(Number(e.target.value))}
                    className="w-full border p-2 rounded"
                  >
                    {daysOfWeek.map((d, i) => (
                      <option key={i} value={i}>{d}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1">Chọn ngày cụ thể</label>
                  <input
                    required
                    type="date"
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    className="w-full border p-2 rounded"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Áp dụng cho ca nào?</label>
              <select
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className="w-full border p-2 rounded"
              >
                {packages.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Hình thức tăng giá</label>
                <select
                  value={surchargeType}
                  onChange={(e) => setSurchargeType(e.target.value as any)}
                  className="w-full border p-2 rounded"
                >
                  <option value="AMT">Số tiền cố định (VNĐ)</option>
                  <option value="PCT">Phần trăm (%)</option>
                </select>
              </div>
              
              {surchargeType === "AMT" ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Số tiền (VNĐ)</label>
                  <input
                    required
                    type="number"
                    value={surchargeAmt}
                    onChange={e => setSurchargeAmt(Number(e.target.value))}
                    className="w-full border p-2 rounded"
                    placeholder="VD: 50000"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1">Phần trăm (%)</label>
                  <input
                    required
                    type="number"
                    value={surchargePct}
                    onChange={e => setSurchargePct(Number(e.target.value))}
                    className="w-full border p-2 rounded"
                    placeholder="VD: 20"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border rounded hover:bg-zinc-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-900 text-white rounded hover:bg-zinc-800"
              >
                Lưu quy tắc
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <p>Đang tải...</p>
      ) : rules.length === 0 ? (
        <div className="bg-white p-12 text-center border rounded-lg">
          <p className="text-zinc-500">Chưa có quy tắc phụ thu nào được tạo.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 border-b">
              <tr>
                <th className="px-6 py-4">Tên quy tắc</th>
                <th className="px-6 py-4">Thời gian áp dụng</th>
                <th className="px-6 py-4">Ca áp dụng</th>
                <th className="px-6 py-4">Mức phụ thu</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-4 font-medium text-zinc-900">{rule.name}</td>
                  <td className="px-6 py-4 text-zinc-600">
                    {rule.type === "DAY_OF_WEEK" 
                      ? daysOfWeek[rule.dayOfWeek!]
                      : new Date(rule.targetDate!).toLocaleDateString("vi-VN")
                    }
                  </td>
                  <td className="px-6 py-4 text-zinc-600">
                    {packages.find(p => p.id === rule.packageId)?.name || rule.packageId}
                  </td>
                  <td className="px-6 py-4 text-red-600 font-medium">
                    +{rule.surchargeAmt ? rule.surchargeAmt.toLocaleString("vi-VN") + "đ" : rule.surchargePct + "%"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="text-red-500 hover:text-red-700"
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
