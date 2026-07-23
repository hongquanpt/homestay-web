import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Clock, Search, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BlockIpButton } from "./BlockIpButton";

export default async function VisitorLogsPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
 const params = await searchParams;
 const search = params.search || "";

 const where = search ? { ip: { contains: search } } : {};

 const logs = await prisma.visitorLog.findMany({
 where,
 orderBy: { visitedAt: "desc" },
 take: 100, // Limit to 100 recent
 });

 const blockedIps = await prisma.blacklistIp.findMany({ select: { ip: true } });
 const blockedIpSet = new Set(blockedIps.map(b => b.ip));

 // Get current retention setting
 const retentionSetting = await prisma.systemSetting.findUnique({
 where: { key: "VISITOR_LOG_RETENTION_HOURS" }
 });
 const retentionHours = retentionSetting?.value || "24";

 return (
 <div className="max-w-7xl mx-auto space-y-6">
 <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
 <div>
 <h1 className="text-2xl font-bold tracking-tight text-zinc-900 ">Lịch sử truy cập</h1>
 <p className="text-sm text-zinc-500 mt-1">
 Theo dõi IP truy cập hệ thống. Các bản ghi cũ hơn <strong className="text-primary">{retentionHours} giờ</strong> sẽ tự động bị xóa.
 </p>
 </div>
 </div>

 <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-zinc-50/50 ">
 <form className="relative w-full sm:w-96">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
 <Input 
 name="search"
 defaultValue={search}
 placeholder="Tìm kiếm theo địa chỉ IP..." 
 className="pl-9 h-10 bg-white border-zinc-200 rounded-xl"
 />
 </form>
 <div className="flex gap-2">
 <Button variant="outline" className="h-10 rounded-xl bg-white ">
 <Clock className="w-4 h-4 mr-2" />
 Tải lại
 </Button>
 </div>
 </div>

 <div className="overflow-x-auto">
 <Table>
 <TableHeader>
 <TableRow className="hover:bg-transparent bg-zinc-50 ">
 <TableHead className="w-[180px] font-semibold">IP Address</TableHead>
 <TableHead className="font-semibold">User Agent / Trình duyệt</TableHead>
 <TableHead className="text-right font-semibold">Lần truy cập cuối</TableHead>
 <TableHead className="w-[100px] text-center font-semibold">Trạng thái</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {logs.length === 0 ? (
 <TableRow>
 <TableCell colSpan={4} className="h-32 text-center text-zinc-500">
 <div className="flex flex-col items-center justify-center">
 <History className="w-8 h-8 text-zinc-300 mb-2" />
 <p>Không có dữ liệu truy cập nào</p>
 </div>
 </TableCell>
 </TableRow>
 ) : logs.map((log) => (
 <TableRow key={log.id} className="hover:bg-zinc-50 :bg-zinc-800/50">
 <TableCell className="font-mono font-medium">{log.ip}</TableCell>
 <TableCell className="text-xs text-zinc-500 max-w-xs truncate" title={log.userAgent || ""}>
 {log.userAgent || "Unknown"}
 </TableCell>
 <TableCell className="text-right text-sm text-zinc-500">
 {format(new Date(log.visitedAt), "HH:mm:ss dd/MM/yyyy")}
 </TableCell>
 <TableCell className="text-center">
 <BlockIpButton ip={log.ip} isBlocked={blockedIpSet.has(log.ip)} />
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 </div>
 </div>
 );
}
