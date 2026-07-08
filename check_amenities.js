const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rooms = await prisma.room.findMany({
    include: { amenities: true }
  });
  console.log(JSON.stringify(rooms.map(r => ({ name: r.name, amenities: r.amenities.map(a => a.name) })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
