import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
 try {
 const { searchParams } = new URL(request.url);
 const search = searchParams.get('search') || '';

 const facilityId = searchParams.get('facilityId');

 const whereClause: any = {
 name: { contains: search, mode: 'insensitive' }
 };
 if (facilityId) {
   whereClause.facilityId = facilityId;
 }

 const rooms = await prisma.room.findMany({
 where: whereClause,
 include: {
 roomType: true,
 images: true,
 discounts: true,
 },
 orderBy: { createdAt: 'desc' }
 });

 return NextResponse.json(rooms);
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
 const { name, description, pricePerHour, pricePerNight, roomTypeId, facilityId, status, priceNoon, priceAfternoon, priceEvening, priceOvernight, amenityIds } = body;

 if (!name || !roomTypeId) {
 return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
 }

 const newRoom = await prisma.room.create({
 data: {
 name,
 description,
 pricePerHour: parseFloat(pricePerHour || "0"),
 pricePerNight: parseFloat(pricePerNight || "0"),
 priceNoon: parseFloat(priceNoon || "260000"),
 priceAfternoon: parseFloat(priceAfternoon || "260000"),
 priceEvening: parseFloat(priceEvening || "260000"),
 priceOvernight: parseFloat(priceOvernight || "420000"),
 roomTypeId,
 facilityId: facilityId || null,
 status: status || 'ACTIVE',
 amenities: amenityIds && amenityIds.length > 0 ? { connect: amenityIds.map((id: string) => ({ id })) } : undefined,
 },
 include: {
 roomType: true,
 }
 });

 // Ghi Audit Log
 await prisma.auditLog.create({
 data: {
 userId: session.user.id,
 action: 'CREATE_ROOM',
 target: `Room: ${newRoom.name}`,
 details: { roomId: newRoom.id, pricePerNight: newRoom.pricePerNight }
 }
 });

 return NextResponse.json(newRoom, { status: 201 });
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
