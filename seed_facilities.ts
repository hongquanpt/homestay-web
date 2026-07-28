import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Creating sample facilities...");

  // Create 3 facilities
  const f1 = await prisma.facility.create({
    data: {
      name: "Chi nhánh 1 - Quận 1",
      address: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
      description: "Nằm ngay trung tâm thành phố, tiện lợi di chuyển đến các địa điểm du lịch.",
      imageUrl: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=600&auto=format&fit=crop"
    }
  });

  const f2 = await prisma.facility.create({
    data: {
      name: "Chi nhánh 2 - Quận 3",
      address: "456 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM",
      description: "Không gian yên tĩnh, thiết kế tối giản, gần các quán cafe đẹp.",
      imageUrl: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=600&auto=format&fit=crop"
    }
  });

  const f3 = await prisma.facility.create({
    data: {
      name: "Chi nhánh 3 - Đà Lạt",
      address: "789 Tuyền Lâm, Phường 4, Đà Lạt",
      description: "Thưởng thức không khí se lạnh, view hồ Tuyền Lâm cực chill.",
      imageUrl: "https://images.unsplash.com/photo-1542314831-c6a4d14d285c?q=80&w=600&auto=format&fit=crop"
    }
  });

  const facilities = [f1, f2, f3];
  console.log("Facilities created:", facilities.map(f => f.name).join(", "));

  // Fetch all rooms
  const rooms = await prisma.room.findMany();
  console.log(`Found ${rooms.length} rooms. Assigning them to facilities...`);

  // Assign rooms round-robin
  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];
    const targetFacility = facilities[i % facilities.length];
    
    await prisma.room.update({
      where: { id: room.id },
      data: { facilityId: targetFacility.id }
    });
  }

  console.log("Done assigning rooms!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
