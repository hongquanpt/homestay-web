import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
 try {
 const settings = await prisma.systemSetting.findMany();
 // Chuyển array thành object dạng { key: value }
 const settingsMap = settings.reduce((acc, curr) => {
 acc[curr.key] = curr.value;
 return acc;
 }, {} as Record<string, string>);

 return NextResponse.json(settingsMap);
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function PUT(request: Request) {
 try {
 const session = await getServerSession(authOptions);
 if (!session || session.user.role !== 'Super Admin') {
 return NextResponse.json({ error: 'Forbidden. Super Admin only.' }, { status: 403 });
 }

 const body = await request.json(); // { key1: value1, key2: value2 }

 for (const [key, value] of Object.entries(body)) {
 if (typeof value === 'string') {
 await prisma.systemSetting.upsert({
 where: { key },
 update: { value },
 create: { key, value }
 });
 }
 }

    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'UPDATE_SETTINGS',
          target: 'System Settings',
          details: { updatedKeys: Object.keys(body) }
        }
      });
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError);
      // Tiếp tục thực hiện vì việc lưu cài đặt đã thành công
    }

 return NextResponse.json({ success: true });
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
