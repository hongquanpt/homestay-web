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
 const { name, description, pricePerHour, pricePerNight, roomTypeId, status, facilityId, priceNoon, priceAfternoon, priceEvening, priceOvernight, amenityIds } = body;

 const updatedRoom = await prisma.room.update({
 where: { id },
 data: {
 ...(name && { name }),
 ...(description !== undefined && { description }),
 ...(pricePerHour !== undefined && { pricePerHour: parseFloat(pricePerHour || "0") }),
 ...(pricePerNight !== undefined && { pricePerNight: parseFloat(pricePerNight || "0") }),
 ...(priceNoon !== undefined && { priceNoon: parseFloat(priceNoon || "260000") }),
 ...(priceAfternoon !== undefined && { priceAfternoon: parseFloat(priceAfternoon || "260000") }),
 ...(priceEvening !== undefined && { priceEvening: parseFloat(priceEvening || "260000") }),
 ...(priceOvernight !== undefined && { priceOvernight: parseFloat(priceOvernight || "420000") }),
 ...(roomTypeId && { roomTypeId }),
 ...(facilityId !== undefined && { facilityId }),
 ...(status && { status }),
 ...(amenityIds && { amenities: { set: amenityIds.map((id: string) => ({ id })) } }),
 },
 });

  if (facilityId !== undefined && facilityId !== null) {
    const setting = await prisma.systemSetting.findUnique({ where: { key: `facility_gate_password_${facilityId}` } });
    if (setting) {
      await prisma.roomAccessInfo.updateMany({
        where: { roomId: id },
        data: { doorPassword: setting.value }
      });
    }
  }

 await prisma.auditLog.create({
 data: {
 userId: session.user.id,
 action: 'UPDATE_ROOM',
 target: `Room: ${updatedRoom.name}`,
 details: { roomId: updatedRoom.id, updates: body }
 }
 });

 return NextResponse.json(updatedRoom);
 } catch (error: any) {
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

 const room = await prisma.room.findUnique({ where: { id } });
 if (!room) {
 return NextResponse.json({ error: 'Room not found' }, { status: 404 });
 }

 await prisma.room.delete({
 where: { id },
 });

 await prisma.auditLog.create({
 data: {
 userId: session.user.id,
 action: 'DELETE_ROOM',
 target: `Room: ${room.name}`,
 details: { roomId: room.id }
 }
 });

 return NextResponse.json({ success: true });
 } catch (error: any) {
 if (error.code === 'P2003') {
 return NextResponse.json({ error: 'Không thể xóa phòng này vì đã có dữ liệu đặt phòng liên quan.' }, { status: 400 });
 }
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
