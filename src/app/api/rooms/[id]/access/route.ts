import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
 try {
 const params = await props.params;
 const session = await getServerSession(authOptions);
 if (!session || (session.user.role !== 'Super Admin' && session.user.role !== 'Reception')) {
 return NextResponse.json({ error: 'Forbidden. Insufficient permissions.' }, { status: 403 });
 }

 const { id } = params;

 const accessInfo = await prisma.roomAccessInfo.findUnique({
 where: { roomId: id }
 });

 if (!accessInfo) {
 return NextResponse.json({ message: 'No access info found for this room' }, { status: 404 });
 }

 // Ghi Audit Log cho hành động nhạy cảm
 await prisma.auditLog.create({
 data: {
 userId: session.user.id,
 action: 'VIEW_SECRET_ACCESS_INFO',
 target: `Room ID: ${id}`,
 details: { accessedBy: session.user.email }
 }
 });

 return NextResponse.json(accessInfo);
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
 try {
 const params = await props.params;
 const session = await getServerSession(authOptions);
 if (!session || session.user.role !== 'Super Admin') {
 return NextResponse.json({ error: 'Forbidden. Super Admin only.' }, { status: 403 });
 }

 const { id } = params;
 const body = await request.json();
 
 const upsertedAccessInfo = await prisma.roomAccessInfo.upsert({
 where: { roomId: id },
 update: {
 ...body
 },
 create: {
 roomId: id,
 ...body
 }
 });

 await prisma.auditLog.create({
 data: {
 userId: session.user.id,
 action: 'UPDATE_SECRET_ACCESS_INFO',
 target: `Room ID: ${id}`,
 details: { updatedFields: Object.keys(body) }
 }
 });

 return NextResponse.json(upsertedAccessInfo);
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
