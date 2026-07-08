import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
 try {
 const users = await prisma.user.findMany({
 include: {
 role: true
 },
 orderBy: {
 createdAt: 'desc'
 }
 });

 return NextResponse.json(users);
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function POST(request: Request) {
 try {
 const body = await request.json();
 const { email, name, password, roleId } = body;

 if (!email || !password || !name) {
 return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
 }

 // Check existing
 const existing = await prisma.user.findUnique({ where: { email } });
 if (existing) {
 return NextResponse.json({ error: 'Email đã tồn tại' }, { status: 400 });
 }

 const bcrypt = require('bcryptjs');
 const hashedPassword = await bcrypt.hash(password, 10);

 const newUser = await prisma.user.create({
 data: {
 email,
 name,
 password: hashedPassword,
 roleId: roleId || null
 },
 include: {
 role: true
 }
 });

 return NextResponse.json(newUser, { status: 201 });
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
