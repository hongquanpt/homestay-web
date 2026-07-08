import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    
    if (!id) {
      return new NextResponse("Surcharge ID is required", { status: 400 });
    }

    const surcharge = await (prisma as any).surchargeRule.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(surcharge);
  } catch (error) {
    console.error("[SURCHARGE_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
