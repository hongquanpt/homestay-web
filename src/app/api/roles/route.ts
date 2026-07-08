import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
 try {
 const roles = await prisma.role.findMany();
 return NextResponse.json(roles);
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
