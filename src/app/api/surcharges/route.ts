import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const surcharges = await (prisma as any).surchargeRule.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(surcharges);
  } catch (error) {
    console.error("[SURCHARGES_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, type, targetDate, dayOfWeek, packageId, surchargePct, surchargeAmt } = body;

    if (!name || !type || !packageId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const surcharge = await (prisma as any).surchargeRule.create({
      data: {
        name,
        type,
        targetDate: targetDate ? new Date(targetDate) : null,
        dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : null,
        packageId,
        surchargePct: surchargePct || null,
        surchargeAmt: surchargeAmt || null,
      },
    });

    return NextResponse.json(surcharge);
  } catch (error) {
    console.error("[SURCHARGES_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
