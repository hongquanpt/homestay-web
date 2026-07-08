import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
 try {
 const { searchParams } = new URL(request.url);
 const search = searchParams.get('search') || '';

 const products = await prisma.product.findMany({
 where: {
 name: { contains: search, mode: 'insensitive' }
 },
 include: {
 category: true,
 },
 orderBy: { createdAt: 'desc' }
 });

 return NextResponse.json(products);
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
 const { name, price, maxQuantity, categoryId } = body;

 if (!name || !price || !categoryId) {
 return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
 }

 const newProduct = await prisma.product.create({
 data: {
 name,
 price: parseFloat(price),
 maxQuantity: parseInt(maxQuantity) || 99,
 categoryId,
 },
 include: {
 category: true,
 }
 });

 return NextResponse.json(newProduct, { status: 201 });
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
