import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
 try {
 const session = await getServerSession(authOptions);
 if (!session || session.user.role !== 'Super Admin') {
 return NextResponse.json({ error: 'Forbidden. Super Admin only.' }, { status: 403 });
 }

 const logs = await prisma.auditLog.findMany({
 orderBy: { createdAt: 'desc' },
 include: {
 user: true,
 },
 take: 100 // Lấy 100 log gần nhất
 });

 return NextResponse.json(logs);
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
