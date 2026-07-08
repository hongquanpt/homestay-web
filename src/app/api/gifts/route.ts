import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
 try {
 const { searchParams } = new URL(request.url);
 const search = searchParams.get('search') || '';

 const campaigns = await prisma.giftCampaign.findMany({
 where: {
 name: { contains: search, mode: 'insensitive' }
 },
 orderBy: { createdAt: 'desc' }
 });

 return NextResponse.json(campaigns);
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
 const { name, condition, isActive } = body;

 if (!name || !condition) {
 return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
 }

 const newCampaign = await prisma.giftCampaign.create({
 data: {
 name,
 condition,
 isActive: isActive !== undefined ? isActive : true,
 }
 });

 return NextResponse.json(newCampaign, { status: 201 });
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
