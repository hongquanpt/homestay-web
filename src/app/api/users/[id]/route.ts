import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
 try {
 const { id } = await props.params;
 const body = await request.json();
 const { name, roleId, password } = body;

 const dataToUpdate: any = { name, roleId: roleId || null };
 
 if (password) {
 dataToUpdate.password = await bcrypt.hash(password, 10);
 }

 const updatedUser = await prisma.user.update({
 where: { id },
 data: dataToUpdate,
 include: {
 role: true
 }
 });

 return NextResponse.json(updatedUser);
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
 try {
 const { id } = await props.params;
 
 // Kiểm tra xem user có tồn tại không
 const user = await prisma.user.findUnique({ where: { id } });
 if (!user) {
 return NextResponse.json({ error: 'User không tồn tại' }, { status: 404 });
 }

 // Không cho phép xóa user Super Admin đầu tiên (để an toàn)
 if (user.email === 'admin') {
 return NextResponse.json({ error: 'Không thể xóa tài khoản Admin gốc' }, { status: 403 });
 }

 await prisma.user.delete({
 where: { id }
 });

 return NextResponse.json({ success: true });
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
