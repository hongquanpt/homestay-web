const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Bắt đầu cập nhật loại phòng...");

  // 1. Tạo các loại phòng chuẩn nếu chưa có
  const targetTypes = ['VIP', 'Standard', 'Deluxe', 'Suite'];
  const newTypesMap = {};

  for (const typeName of targetTypes) {
    let rt = await prisma.roomType.findFirst({
      where: { name: { equals: typeName, mode: 'insensitive' } }
    });
    
    if (!rt) {
      console.log(`Đang tạo mới loại phòng: ${typeName}`);
      rt = await prisma.roomType.create({
        data: { name: typeName, description: `Loại phòng ${typeName}` }
      });
    }
    newTypesMap[typeName] = rt;
  }

  // 2. Lấy tất cả các phòng hiện tại kèm thông tin loại phòng cũ
  const rooms = await prisma.room.findMany({
    include: { roomType: true }
  });

  console.log(`Tìm thấy ${rooms.length} phòng. Bắt đầu chuyển đổi...`);

  // 3. Đổi loại phòng cho từng phòng dựa theo tên cũ
  for (const room of rooms) {
    if (!room.roomType) continue;
    const oldTypeName = room.roomType.name.toLowerCase();
    
    let newTypeId = null;

    if (oldTypeName.includes('vip')) {
      newTypeId = newTypesMap['VIP'].id;
    } else if (oldTypeName.includes('tiêu chuẩn') || oldTypeName.includes('standard')) {
      newTypeId = newTypesMap['Standard'].id;
    } else if (oldTypeName.includes('cao cấp') || oldTypeName.includes('deluxe')) {
      newTypeId = newTypesMap['Deluxe'].id; // Map 'Cao cấp' -> 'Deluxe'
    } else if (oldTypeName.includes('suite')) {
      newTypeId = newTypesMap['Suite'].id;
    } else {
      // Mặc định ném vào Standard nếu không đoán được
      newTypeId = newTypesMap['Standard'].id;
    }

    if (room.roomTypeId !== newTypeId) {
      await prisma.room.update({
        where: { id: room.id },
        data: { roomTypeId: newTypeId }
      });
      console.log(`Đã chuyển phòng [${room.name}] từ "${room.roomType.name}" sang loại mới.`);
    }
  }

  // 4. Xóa các loại phòng cũ không còn phòng nào sử dụng
  console.log("Đang dọn dẹp các loại phòng cũ...");
  const allTypes = await prisma.roomType.findMany({
    include: { _count: { select: { rooms: true } } }
  });

  for (const type of allTypes) {
    // Nếu loại phòng này không nằm trong danh sách chuẩn và không có phòng nào
    if (!targetTypes.includes(type.name) && type._count.rooms === 0) {
      await prisma.roomType.delete({
        where: { id: type.id }
      });
      console.log(`Đã xóa loại phòng cũ: ${type.name}`);
    }
  }

  console.log("Hoàn tất! Hãy F5 lại trang quản trị.");
}

main()
  .catch(e => {
    console.error("Có lỗi xảy ra:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
