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
 const { name, condition, isActive } = body;

 const updatedGift = await prisma.giftCampaign.update({
 where: { id },
 data: {
 name,
 condition,
 isActive
 }
 });

 return NextResponse.json(updatedGift);
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
 
 const gift = await prisma.giftCampaign.findUnique({ where: { id } });
 if (!gift) {
 return NextResponse.json({ error: 'Quà tặng không tồn tại' }, { status: 404 });
 }

 await prisma.giftCampaign.delete({
 where: { id }
 });

 return NextResponse.json({ success: true });
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
