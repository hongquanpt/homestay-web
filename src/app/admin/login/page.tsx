"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(false);
 const router = useRouter();

 const handleLogin = async (e: React.FormEvent) => {
 e.preventDefault();
 setError("");
 setLoading(true);
 
 const res = await signIn("credentials", {
 email,
 password,
 redirect: false,
 });

 setLoading(false);

 if (res?.error) {
 setError(res.error);
 } else {
 router.push("/admin/dashboard");
 router.refresh();
 }
 };

 return (
 <div className="min-h-screen flex items-center justify-center bg-gray-50 ">
 <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100 ">
 <div className="text-center mb-8">
 <h2 className="text-3xl font-bold text-gray-900 ">Homestay Admin</h2>
 <p className="text-sm text-gray-500 mt-2">Đăng nhập để quản lý hệ thống</p>
 </div>
 
 {error && (
 <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
 Sai tài khoản hoặc mật khẩu
 </div>
 )}

 <form onSubmit={handleLogin} className="space-y-5">
 <div>
 <label className="block text-sm font-medium mb-1.5 text-gray-700 ">Tài khoản</label>
 <input 
 type="text" 
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-black :ring-white outline-none transition"
 placeholder="admin"
 required 
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1.5 text-gray-700 ">Mật khẩu</label>
 <input 
 type="password" 
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-black :ring-white outline-none transition"
 placeholder="••••••••"
 required 
 />
 </div>
 
 <Button type="submit" className="w-full py-6 text-base" disabled={loading}>
 {loading ? "Đang xử lý..." : "Đăng nhập"}
 </Button>
 </form>
 </div>
 </div>
 );
}
