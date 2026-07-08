import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const discounts = await prisma.roomDiscount.findMany({
      where: { roomId: id },
      orderBy: [
        { dayOfWeek: 'asc' },
        { packageId: 'asc' }
      ]
    });

    return NextResponse.json(discounts);
  } catch (error) {
    console.error("GET_ROOM_DISCOUNTS_ERROR", error);
    return NextResponse.json({ error: "Lỗi lấy danh sách giảm giá" }, { status: 500 });
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'Super Admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { dayOfWeek, packageId, discountPct, discountAmt } = body;

    if (dayOfWeek === undefined || !packageId) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    const discount = await prisma.roomDiscount.upsert({
      where: {
        roomId_dayOfWeek_packageId: {
          roomId: id,
          dayOfWeek: parseInt(dayOfWeek),
          packageId
        }
      },
      update: {
        discountPct: discountPct ? parseFloat(discountPct) : null,
        discountAmt: discountAmt ? parseFloat(discountAmt) : null,
      },
      create: {
        roomId: id,
        dayOfWeek: parseInt(dayOfWeek),
        packageId,
        discountPct: discountPct ? parseFloat(discountPct) : null,
        discountAmt: discountAmt ? parseFloat(discountAmt) : null,
      }
    });

    return NextResponse.json({ success: true, discount });
  } catch (error: any) {
    console.error("POST_ROOM_DISCOUNT_ERROR", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
