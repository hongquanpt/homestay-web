import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
 try {
 const amenities = await prisma.amenity.findMany({
 orderBy: { name: 'asc' }
 });
 return NextResponse.json(amenities);
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function POST(request: Request) {
 try {
 const session = await getServerSession(authOptions);
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const body = await request.json();
 const { name, icon } = body;

 if (!name) {
 return NextResponse.json({ error: 'Tên tiện ích không được để trống' }, { status: 400 });
 }

 const newAmenity = await prisma.amenity.create({
 data: {
 name,
 icon,
 }
 });

 await prisma.auditLog.create({
 data: {
 userId: session.user.id,
 action: 'CREATE_AMENITY',
 target: `Amenity: ${newAmenity.name}`,
 details: { amenityId: newAmenity.id }
 }
 });

 return NextResponse.json(newAmenity, { status: 201 });
 } catch (error: any) {
 if (error.code === 'P2002') {
 return NextResponse.json({ error: 'Tên tiện ích đã tồn tại' }, { status: 400 });
 }
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
