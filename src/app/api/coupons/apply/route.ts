import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Vui lòng nhập mã giảm giá' }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Mã giảm giá không tồn tại' }, { status: 404 });
    }

    const now = new Date();
    if (now < coupon.validFrom) {
      return NextResponse.json({ error: 'Mã giảm giá chưa đến thời gian sử dụng' }, { status: 400 });
    }
    if (now > coupon.validTo) {
      return NextResponse.json({ error: 'Mã giảm giá đã hết hạn' }, { status: 400 });
    }

    if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) {
      return NextResponse.json({ error: 'Mã giảm giá đã hết lượt sử dụng' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: coupon });
  } catch (error: any) {
    console.error("APPLY_COUPON_ERROR", error);
    return NextResponse.json({ error: 'Lỗi hệ thống khi kiểm tra mã' }, { status: 500 });
  }
}
