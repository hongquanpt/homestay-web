import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();
    const { name, address, description, imageUrl, isActive } = body;

    const dataToUpdate: any = {
      name,
      address,
      description,
      imageUrl,
    };
    
    if (isActive !== undefined) {
      dataToUpdate.isActive = isActive;
    }

    const facility = await (prisma as any).facility.update({
      where: { id: params.id },
      data: dataToUpdate
    });

    if (body.gatePassword !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: `facility_gate_password_${facility.id}` },
        update: { value: body.gatePassword },
        create: { key: `facility_gate_password_${facility.id}`, value: body.gatePassword }
      });

      // Update doorPassword for all rooms in this facility
      const rooms = await prisma.room.findMany({
        where: { facilityId: facility.id }
      });
      
      if (rooms.length > 0) {
        await prisma.roomAccessInfo.updateMany({
          where: { roomId: { in: rooms.map((r: any) => r.id) } },
          data: { doorPassword: body.gatePassword }
        });
      }
    }

    return NextResponse.json({ success: true, data: { ...facility, gatePassword: body.gatePassword } });
  } catch (error) {
    console.error("PUT /api/facilities/[id] error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    // Check if there are rooms associated with this facility
    const roomsCount = await prisma.room.count({
      where: { facilityId: params.id } as any
    });

    if (roomsCount > 0) {
      return NextResponse.json({ success: false, message: "Không thể xóa chi nhánh đang có phòng. Vui lòng chuyển các phòng sang chi nhánh khác trước." }, { status: 400 });
    }

    await (prisma as any).facility.delete({
      where: { id: params.id }
    });

    try {
      await prisma.systemSetting.delete({
        where: { key: `facility_gate_password_${params.id}` }
      });
    } catch (e) {
      // Ignore if setting doesn't exist
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/facilities/[id] error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
