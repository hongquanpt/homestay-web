import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
 try {
 const params = await props.params;
 const { id } = params;

 const images = await prisma.roomImage.findMany({
 where: { roomId: id },
 orderBy: { createdAt: 'desc' }
 });

 return NextResponse.json(images);
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
 try {
 const params = await props.params;
 const session = await getServerSession(authOptions);
 if (!session || session.user.role !== 'Super Admin') {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 const { id } = params;
 const { url } = await request.json();
 
 if (!url) {
 return NextResponse.json({ error: 'URL is required' }, { status: 400 });
 }

 const newImage = await prisma.roomImage.create({
 data: {
 roomId: id,
 url
 }
 });

 return NextResponse.json(newImage, { status: 201 });
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
 try {
 const params = await props.params;
 const session = await getServerSession(authOptions);
 if (!session || session.user.role !== 'Super Admin') {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 const { searchParams } = new URL(request.url);
 const imageId = searchParams.get('imageId');
 
 if (!imageId) {
 return NextResponse.json({ error: 'imageId is required' }, { status: 400 });
 }

 await prisma.roomImage.delete({
 where: { id: imageId }
 });

 return NextResponse.json({ success: true });
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
