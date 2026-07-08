import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(request: Request, props: { params: Promise<{ id: string, discountId: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'Super Admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { discountId } = params;

    await prisma.roomDiscount.delete({
      where: { id: discountId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE_ROOM_DISCOUNT_ERROR", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
