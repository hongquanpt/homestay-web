import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 8);

    // Fetch all active rooms
    const whereClause: any = { status: "ACTIVE" };
    if (facilityId) {
      whereClause.facilityId = facilityId;
    }

    const [dbRooms, dbSettings, surcharges, facilities] = await Promise.all([
      prisma.room.findMany({
        where: whereClause,
        include: { roomType: true, discounts: true },
        orderBy: { name: 'asc' }
      }),
      prisma.systemSetting.findMany(),
      (prisma as any).surchargeRule.findMany(),
      (prisma as any).facility.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } })
    ]);

    // Fetch all booking details overlapping with the next 7 days
    const dbBookings = await prisma.bookingDetail.findMany({
      where: {
        startTime: { lt: nextWeek },
        endTime: { gt: today },
        booking: {
          status: {
            notIn: ['CANCELLED']
          }
        }
      },
      select: {
        roomId: true,
        startTime: true,
        endTime: true,
      }
    });

    // Include temporary bookings (held during checkout)
    const tempBookingsMap = (global as any).tempBookings as Map<string, any>;
    if (tempBookingsMap) {
      for (const [_, tempBooking] of tempBookingsMap.entries()) {
        const bStart = new Date(tempBooking.startTime);
        const bEnd = new Date(tempBooking.endTime);
        if (bStart < nextWeek && bEnd > today) {
          dbBookings.push({
            roomId: tempBooking.roomId,
            startTime: bStart,
            endTime: bEnd,
          } as any);
        }
      }
    }

    const settingsMap = dbSettings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      success: true,
      data: {
        rooms: dbRooms,
        bookings: dbBookings,
        surcharges,
        facilities,
        settings: {
          discount_2_slots: parseInt(settingsMap['multi_slot_discount_2'] || "5"),
          discount_3_slots: parseInt(settingsMap['multi_slot_discount_3'] || "10"),
          discount_4_slots: parseInt(settingsMap['multi_slot_discount_4'] || "15")
        }
      }
    });
  } catch (error: any) {
    console.error("Failed to fetch board data:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
