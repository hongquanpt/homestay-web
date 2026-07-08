import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
 try {
 const { searchParams } = new URL(request.url);
 const search = searchParams.get('search') || '';

 const coupons = await prisma.coupon.findMany({
 where: {
 code: { contains: search, mode: 'insensitive' }
 },
 orderBy: { createdAt: 'desc' }
 });

 return NextResponse.json(coupons);
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function POST(request: Request) {
 try {
 const session = await getServerSession(authOptions);
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const body = await request.json();
 const { code, discountPct, discountAmt, validFrom, validTo, maxUsage, isPublic, autoSendAfterBookings } = body;

 if (!code || !validFrom || !validTo) {
 return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
 }
 
 if (!discountPct && !discountAmt) {
 return NextResponse.json({ error: 'Phải nhập % giảm hoặc số tiền giảm' }, { status: 400 });
 }

 const existing = await prisma.coupon.findUnique({ where: { code } });
 if (existing) {
 return NextResponse.json({ error: 'Mã giảm giá đã tồn tại' }, { status: 400 });
 }

 const newCoupon = await prisma.coupon.create({
 data: {
 code: code.toUpperCase(),
 discountPct: discountPct ? parseFloat(discountPct) : null,
 discountAmt: discountAmt ? parseFloat(discountAmt) : null,
 validFrom: new Date(validFrom),
 validTo: new Date(validTo),
 maxUsage: maxUsage ? parseInt(maxUsage) : null,
 isPublic: isPublic !== undefined ? isPublic : true,
 autoSendAfterBookings: autoSendAfterBookings ? parseInt(autoSendAfterBookings) : null,
 }
 });

 return NextResponse.json(newCoupon, { status: 201 });
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
