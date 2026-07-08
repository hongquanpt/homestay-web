import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cleanupExpiredBookings } from '@/lib/cleanup-bookings';

export async function GET(request: Request) {
 try {
 const { searchParams } = new URL(request.url);
 const roomId = searchParams.get('roomId');
 const date = searchParams.get('date');

 if (!roomId || !date) {
 return NextResponse.json({ error: 'Missing roomId or date' }, { status: 400 });
 }

 const startOfDay = new Date(`${date}T00:00:00+07:00`);
 const endOfNextDay = new Date(`${date}T23:59:59+07:00`);
 endOfNextDay.setDate(endOfNextDay.getDate() + 1);

 await cleanupExpiredBookings();

 const bookings = await prisma.bookingDetail.findMany({
 where: {
 roomId: roomId,
 startTime: { lte: endOfNextDay },
 endTime: { gte: startOfDay },
 booking: {
 status: {
 notIn: ['CANCELLED'] 
 }
 }
 }
 });

 const bookedIntervals = bookings.map(b => ({
 startTime: b.startTime.toISOString(),
 endTime: b.endTime.toISOString(),
 }));

 return NextResponse.json({ bookedIntervals });
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
