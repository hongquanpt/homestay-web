const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const banners = {
    promo_banner_1: '/uploads/promo_banner_1.png',
    promo_banner_2: '/uploads/promo_banner_2.png',
    promo_banner_3: '/uploads/promo_banner_3.png',
    promo_banner_4: '/uploads/promo_banner_4.png',
  };

  for (const [key, value] of Object.entries(banners)) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log("Banners updated in DB.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
