import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
 try {
 const session = await getServerSession(authOptions);
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const { id } = await props.params;
 const body = await request.json();
 const { code, discountPct, discountAmt, validFrom, validTo, maxUsage, isPublic, autoSendAfterBookings } = body;

 const updatedCoupon = await prisma.coupon.update({
 where: { id },
 data: {
 code,
 discountPct,
 discountAmt,
 validFrom: new Date(validFrom),
 validTo: new Date(validTo),
 maxUsage,
 isPublic,
 autoSendAfterBookings: autoSendAfterBookings ? parseInt(autoSendAfterBookings) : null,
 }
 });

 return NextResponse.json(updatedCoupon);
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
 try {
 const session = await getServerSession(authOptions);
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const { id } = await props.params;
 
 const coupon = await prisma.coupon.findUnique({ where: { id } });
 if (!coupon) {
 return NextResponse.json({ error: 'Mã giảm giá không tồn tại' }, { status: 404 });
 }

 await prisma.coupon.delete({
 where: { id }
 });

 return NextResponse.json({ success: true });
 } catch (error: any) {
 if (error.code === 'P2003') {
 return NextResponse.json({ error: 'Không thể xóa vì mã giảm giá này đã được sử dụng trong các đơn đặt phòng' }, { status: 400 });
 }
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
