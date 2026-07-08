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
 const { name, price, maxQuantity, categoryId } = body;

 const updatedProduct = await prisma.product.update({
 where: { id },
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

 return NextResponse.json(updatedProduct);
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
 
 // Check if product exists
 const product = await prisma.product.findUnique({ where: { id } });
 if (!product) {
 return NextResponse.json({ error: 'Sản phẩm không tồn tại' }, { status: 404 });
 }

 await prisma.product.delete({
 where: { id }
 });

 return NextResponse.json({ success: true });
 } catch (error: any) {
 if (error.code === 'P2003') {
 return NextResponse.json({ error: 'Không thể xóa vì sản phẩm này đang được liên kết với dữ liệu khác' }, { status: 400 });
 }
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
