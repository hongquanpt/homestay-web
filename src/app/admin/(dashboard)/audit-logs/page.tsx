"use client";

import { useState, useEffect } from "react";
import { 
 Search, 
 Activity,
 Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default function AdminAuditLogsPage() {
 const [searchTerm, setSearchTerm] = useState("");
 const [auditLogs, setAuditLogs] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const fetchLogs = async () => {
 setLoading(true);
 try {
 const res = await fetch('/api/audit-logs');
 const data = await res.json();
 setAuditLogs(Array.isArray(data) ? data : []);
 } catch (e) {
 console.error(e);
 } finally {
 setLoading(false);
 }
 };
 fetchLogs();
 }, []);

 const filteredLogs = auditLogs.filter(log => 
 log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
 log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
 log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
 );

 return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <h1 className="text-2xl font-bold text-zinc-900 ">Nhật ký hệ thống (Audit Logs)</h1>
 <p className="text-sm text-zinc-500 mt-1">Theo dõi mọi hoạt động, thay đổi dữ liệu của nhân viên và hệ thống.</p>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-zinc-200 ">
 <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
 <div className="relative w-full sm:max-w-xs">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
 <Input 
 placeholder="Tìm kiếm log..." 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-9 w-full"
 />
 </div>
 <Button variant="outline">
 <Filter className="w-4 h-4 mr-2" />
 Lọc theo Hành động
 </Button>
 </div>

 <div className="overflow-x-auto">
 <Table>
 <TableHeader>
 <TableRow className="bg-zinc-50 ">
 <TableHead className="font-semibold">Thời gian</TableHead>
 <TableHead className="font-semibold">Người thực hiện</TableHead>
 <TableHead className="font-semibold">Hành động</TableHead>
 <TableHead className="font-semibold">Mục tiêu</TableHead>
 <TableHead className="font-semibold">Chi tiết</TableHead>
 <TableHead className="font-semibold text-right">IP</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {loading ? (
 <TableRow>
 <TableCell colSpan={6} className="text-center py-8 text-zinc-500">Đang tải dữ liệu...</TableCell>
 </TableRow>
 ) : filteredLogs.length === 0 ? (
 <TableRow>
 <TableCell colSpan={6} className="text-center py-8 text-zinc-500">Không tìm thấy log nào</TableCell>
 </TableRow>
 ) : filteredLogs.map((log) => (
 <TableRow key={log.id} className="hover:bg-zinc-50 :bg-zinc-800/50">
 <TableCell className="text-sm text-zinc-500 whitespace-nowrap">
 {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
 </TableCell>
 <TableCell>
 <div className="flex items-center gap-2">
 <Activity className="w-4 h-4 text-zinc-400" />
 <span className="font-medium text-zinc-900 ">{log.user?.name || log.user?.email}</span>
 </div>
 </TableCell>
 <TableCell>
 <span className="px-2 py-1 bg-zinc-100 text-zinc-600 text-xs font-mono rounded">
 {log.action}
 </span>
 </TableCell>
 <TableCell className="text-sm">{log.target}</TableCell>
 <TableCell className="text-sm text-zinc-600 max-w-xs truncate" title={JSON.stringify(log.details)}>
 {JSON.stringify(log.details)}
 </TableCell>
 <TableCell className="text-right font-mono text-xs text-zinc-500">{log.ipAddress || '127.0.0.1'}</TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 </div>
 </div>
 );
}
