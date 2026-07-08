import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { revalidatePath } from "next/cache";

export async function GET(request: Request) {
 try {
 const session = await getServerSession(authOptions);
 if (!session?.user) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const { searchParams } = new URL(request.url);
 const search = searchParams.get("search") || "";

 const [ips, phones, emails] = await Promise.all([
 prisma.blacklistIp.findMany({
 where: search ? { ip: { contains: search, mode: "insensitive" } } : undefined,
 }),
 prisma.blacklistPhone.findMany({
 where: search ? { phone: { contains: search, mode: "insensitive" } } : undefined,
 }),
 prisma.blacklistEmail.findMany({
 where: search ? { email: { contains: search, mode: "insensitive" } } : undefined,
 }),
 ]);

 const blacklist = [
 ...ips.map(ip => ({ id: ip.id, type: "IP", value: ip.ip, reason: ip.reason, createdAt: ip.createdAt })),
 ...phones.map(phone => ({ id: phone.id, type: "Phone", value: phone.phone, reason: phone.reason, createdAt: phone.createdAt })),
 ...emails.map(email => ({ id: email.id, type: "Email", value: email.email, reason: email.reason, createdAt: email.createdAt })),
 ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

 return NextResponse.json(blacklist);
 } catch (error) {
 console.error("GET_BLACKLIST_ERROR", error);
 return NextResponse.json(
 { error: "Lỗi lấy danh sách blacklist" },
 { status: 500 }
 );
 }
}

export async function POST(request: Request) {
 try {
 const session = await getServerSession(authOptions);
 if (!session?.user) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const body = await request.json();
 const { type, value, reason } = body;

 if (!type || !value) {
 return NextResponse.json(
 { error: "Thiếu thông tin bắt buộc" },
 { status: 400 }
 );
 }

 let result;
 if (type === "IP") {
 result = await prisma.blacklistIp.create({ data: { ip: value, reason } });
 } else if (type === "Phone") {
 result = await prisma.blacklistPhone.create({ data: { phone: value, reason } });
 } else if (type === "Email") {
 result = await prisma.blacklistEmail.create({ data: { email: value, reason } });
 } else {
 return NextResponse.json(
 { error: "Loại blacklist không hợp lệ" },
 { status: 400 }
 );
 }

 revalidatePath("/admin/blacklist");
 revalidatePath("/admin/visitor-logs");

 return NextResponse.json({ success: true, data: result });
 } catch (error: any) {
 console.error("CREATE_BLACKLIST_ERROR", error);
 return NextResponse.json(
 { error: "Lỗi thêm vào blacklist", details: error.message },
 { status: 500 }
 );
 }
}
