import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';

    const where = isAdmin ? {} : { isActive: true };

    const facilities = await (prisma as any).facility.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { rooms: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: facilities });
  } catch (error) {
    console.error("GET /api/facilities error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

  export async function POST(req: Request) {
    try {
      const body = await req.json();
      const { name, address, description, imageUrl, isActive } = body;
  
      if (!name) {
        return NextResponse.json({ success: false, message: "Name is required" }, { status: 400 });
      }
  
      const facility = await (prisma as any).facility.create({
        data: {
          name,
          address,
          description,
          imageUrl,
          isActive: isActive !== undefined ? isActive : true,
        }
      });

    return NextResponse.json({ success: true, data: facility });
  } catch (error) {
    console.error("POST /api/facilities error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
