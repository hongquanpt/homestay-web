import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
 try {
 const categories = await prisma.productCategory.findMany({
 orderBy: { createdAt: 'desc' }
 });
 return NextResponse.json(categories);
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Tên danh mục không được để trống' }, { status: 400 });

    const newCategory = await prisma.productCategory.create({
      data: { name }
    });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Danh mục này đã tồn tại' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
