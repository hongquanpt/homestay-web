import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';

export async function PUT(
 request: Request,
 props: { params: Promise<{ id: string }> }
) {
 try {
 const params = await props.params;
 const session = await getServerSession(authOptions);
 if (!session?.user) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const body = await request.json();
 const { type, reason } = body;

 if (!type || !reason) {
 return NextResponse.json({ error: "Thiếu tham số type hoặc reason" }, { status: 400 });
 }

 let updated;
 if (type === "IP") {
 updated = await prisma.blacklistIp.update({ where: { id: params.id }, data: { reason } });
 } else if (type === "Phone") {
 updated = await prisma.blacklistPhone.update({ where: { id: params.id }, data: { reason } });
 } else if (type === "Email") {
 updated = await prisma.blacklistEmail.update({ where: { id: params.id }, data: { reason } });
 } else {
 return NextResponse.json({ error: "Loại blacklist không hợp lệ" }, { status: 400 });
 }

 return NextResponse.json(updated);
 } catch (error: any) {
 console.error("PUT_BLACKLIST_ERROR", error);
 return NextResponse.json(
 { error: "Lỗi cập nhật blacklist", details: error.message },
 { status: 500 }
 );
 }
}

export async function DELETE(
 request: Request,
 props: { params: Promise<{ id: string }> }
) {
 try {
 const params = await props.params;
 const session = await getServerSession(authOptions);
 if (!session?.user) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const { searchParams } = new URL(request.url);
 const type = searchParams.get("type");

 if (!type) {
 return NextResponse.json({ error: "Thiếu tham số type" }, { status: 400 });
 }

 if (type === "IP") {
 await prisma.blacklistIp.delete({ where: { id: params.id } });
 } else if (type === "Phone") {
 await prisma.blacklistPhone.delete({ where: { id: params.id } });
 } else if (type === "Email") {
 await prisma.blacklistEmail.delete({ where: { id: params.id } });
 } else {
 return NextResponse.json({ error: "Loại blacklist không hợp lệ" }, { status: 400 });
 }

 return NextResponse.json({ success: true });
 } catch (error: any) {
 console.error("DELETE_BLACKLIST_ERROR", error);
 return NextResponse.json(
 { error: "Lỗi xóa blacklist", details: error.message },
 { status: 500 }
 );
 }
}
