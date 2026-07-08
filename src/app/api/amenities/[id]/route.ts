import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
 try {
 const params = await props.params;
 const session = await getServerSession(authOptions);
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const { id } = params;
 const body = await request.json();
 const { name, icon } = body;

 const updatedAmenity = await prisma.amenity.update({
 where: { id },
 data: {
 ...(name && { name }),
 ...(icon !== undefined && { icon }),
 },
 });

 await prisma.auditLog.create({
 data: {
 userId: session.user.id,
 action: 'UPDATE_AMENITY',
 target: `Amenity: ${updatedAmenity.name}`,
 details: { amenityId: updatedAmenity.id, updates: body }
 }
 });

 return NextResponse.json(updatedAmenity);
 } catch (error: any) {
 if (error.code === 'P2002') {
 return NextResponse.json({ error: 'Tên tiện ích đã tồn tại' }, { status: 400 });
 }
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
 try {
 const params = await props.params;
 const session = await getServerSession(authOptions);
 if (!session || session.user.role !== 'Super Admin') {
 return NextResponse.json({ error: 'Forbidden. Super Admin only.' }, { status: 403 });
 }

 const { id } = params;

 const amenity = await prisma.amenity.findUnique({ where: { id } });
 if (!amenity) {
 return NextResponse.json({ error: 'Amenity not found' }, { status: 404 });
 }

 await prisma.amenity.delete({
 where: { id },
 });

 await prisma.auditLog.create({
 data: {
 userId: session.user.id,
 action: 'DELETE_AMENITY',
 target: `Amenity: ${amenity.name}`,
 details: { amenityId: amenity.id }
 }
 });

 return NextResponse.json({ success: true });
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
