export {};
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Xóa dữ liệu cũ...");
  await prisma.bookingDetail.deleteMany({});
  await prisma.paymentTransaction.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.roomImage.deleteMany({});
  await prisma.roomDiscount.deleteMany({});
  await prisma.roomAccessInfo.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.roomType.deleteMany({});
  await prisma.facility.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.systemSetting.deleteMany({});
  await prisma.surchargeRule.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.coupon.deleteMany({});

  console.log("Tạo Role và Admin User...");
  const adminRole = await prisma.role.create({
    data: {
      name: "Super Admin"
    }
  });

  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash("123456", 10);

  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@homestay.com",
      password: hashedPassword,
      roleId: adminRole.id
    }
  });

  console.log("Tạo Cấu hình Hệ thống...");
  const settings = [
    { key: 'homestay_name', value: 'Stay & Chill' },
    { key: 'homestay_address', value: '123 Phố Trạm, Long Biên, Hà Nội' },
    { key: 'homestay_phone', value: '0987654321' },
    { key: 'homestay_email', value: 'contact@stayandchill.vn' },
    { key: 'multi_slot_discount_2', value: '5' },
    { key: 'multi_slot_discount_3', value: '10' },
    { key: 'multi_slot_discount_4', value: '15' },
    { key: 'bank_bin', value: '970422' },
    { key: 'bank_account_no', value: '123456789' },
    { key: 'bank_prefix', value: 'DP' },
    { key: 'auto_cancel_minutes', value: '30' }
  ];
  for (const s of settings) {
    await prisma.systemSetting.create({ data: s });
  }

  console.log("Tạo Chi nhánh...");
  const f1 = await prisma.facility.create({
    data: {
      name: "Chi nhánh Long Biên",
      address: "123 Phố Trạm, Long Biên, Hà Nội",
      description: "Chi nhánh rộng rãi với thiết kế sân vườn thoáng mát.",
      imageUrl: "https://images.unsplash.com/photo-1549294413-26f195200c16?q=80&w=800&auto=format&fit=crop",
      isActive: true
    }
  });

  const f2 = await prisma.facility.create({
    data: {
      name: "Chi nhánh Hoàn Kiếm",
      address: "45 Hàng Bài, Hoàn Kiếm, Hà Nội",
      description: "Nằm ngay trung tâm phố cổ, thuận tiện dạo chơi hồ Gươm.",
      imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop",
      isActive: true
    }
  });

  const f3 = await prisma.facility.create({
    data: {
      name: "Chi nhánh Tây Hồ",
      address: "88 Trích Sài, Tây Hồ, Hà Nội",
      description: "Tầm nhìn thẳng ra Hồ Tây lộng gió, vô cùng lãng mạn.",
      imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop",
      isActive: true
    }
  });

  console.log("Tạo Loại Phòng...");
  const tSingle = await prisma.roomType.create({
    data: { name: "Phòng Tiêu chuẩn (2 người)", description: "Phòng đôi tiêu chuẩn, đầy đủ tiện nghi." }
  });
  const tDouble = await prisma.roomType.create({
    data: { name: "Phòng Cao cấp (2-4 người)", description: "Phòng cỡ lớn, có bồn tắm và ban công." }
  });
  const tVip = await prisma.roomType.create({
    data: { name: "Phòng VIP Hồ Tây", description: "Căn hộ mini với cửa sổ vô cực." }
  });

  console.log("Tạo Phòng...");
  const createRoom = async (facilityId: string, roomTypeId: string, name: string, basePrice: number) => {
    return await prisma.room.create({
      data: {
        facilityId,
        roomTypeId,
        name,
        status: "ACTIVE",
        description: `Phòng ${name} với thiết kế độc đáo và hiện đại.`,
        pricePerHour: basePrice / 2,
        pricePerNight: basePrice + 100000,
        priceNoon: basePrice,
        priceAfternoon: basePrice,
        priceEvening: basePrice + 50000,
        priceOvernight: basePrice + 100000,
        images: {
          create: [
            { url: "https://images.unsplash.com/photo-1598928506311-c55dd1b31120?q=80&w=800&auto=format&fit=crop" },
            { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop" }
          ]
        }
      }
    });
  };

  await createRoom(f1.id, tSingle.id, "LB-101", 150000);
  await createRoom(f1.id, tDouble.id, "LB-102", 200000);
  await createRoom(f2.id, tSingle.id, "HK-201", 180000);
  await createRoom(f2.id, tDouble.id, "HK-202", 250000);
  await createRoom(f3.id, tVip.id, "TH-VIP1", 350000);
  await createRoom(f3.id, tVip.id, "TH-VIP2", 350000);

  console.log("Tạo Mã giảm giá...");
  await prisma.coupon.create({
    data: {
      code: "WELCOME10",
      discountPct: 10,
      maxUsage: 100,
      isPublic: true,
      validFrom: new Date(),
      validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    }
  });

  console.log("Xong! Đã nạp thành công dữ liệu mẫu.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
