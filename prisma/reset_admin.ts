// reset_admin.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = "admin@homestay.com";
    const password = "123456";
    const hashedPassword = await bcrypt.hash(password, 10);

    // Thử cập nhật mật khẩu nếu tài khoản đã tồn tại
    const updateResult = await prisma.user.updateMany({
        where: { email: email },
        data: { password: hashedPassword }
    });

    if (updateResult.count > 0) {
        console.log(`✅ Đã khôi phục mật khẩu tài khoản ${email} về mặc định (123456)!`);
    } else {
        // Nếu chưa tồn tại, tạo mới hoàn toàn
        console.log("Không tìm thấy tài khoản admin, đang tiến hành tạo mới...");
        const role = await prisma.role.findFirst({ where: { name: "Super Admin" } });

        if (role) {
            await prisma.user.create({
                data: {
                    name: "Admin",
                    email: email,
                    password: hashedPassword,
                    roleId: role.id
                }
            });
            console.log(`✅ Đã tạo mới tài khoản ${email} với mật khẩu (123456)!`);
        } else {
            console.log("❌ Lỗi: Không tìm thấy quyền 'Super Admin' trong cơ sở dữ liệu. Hãy chạy lệnh seed DB trước.");
        }
    }
}

main()
    .catch(e => {
        console.error("❌ Có lỗi xảy ra:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
