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

    const settings = await prisma.systemSetting.findMany({
      where: { key: { startsWith: 'facility_gate_password_' } }
    });

    const facilitiesWithGatePassword = facilities.map((f: any) => {
      const setting = settings.find((s: any) => s.key === `facility_gate_password_${f.id}`);
      return {
        ...f,
        gatePassword: setting ? setting.value : ""
      };
    });

    return NextResponse.json({ success: true, data: facilitiesWithGatePassword });
  } catch (error) {
    console.error("GET /api/facilities error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

  export async function POST(req: Request) {
    try {
      const body = await req.json();
      const { name, address, description, imageUrl, isActive, gatePassword } = body;
  
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

      if (gatePassword !== undefined) {
        await prisma.systemSetting.upsert({
          where: { key: `facility_gate_password_${facility.id}` },
          update: { value: gatePassword },
          create: { key: `facility_gate_password_${facility.id}`, value: gatePassword }
        });
      }

    return NextResponse.json({ success: true, data: { ...facility, gatePassword: gatePassword || "" } });
  } catch (error) {
    console.error("POST /api/facilities error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
