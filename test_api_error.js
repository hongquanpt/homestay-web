const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const body = {
        multi_slot_discount_2: "5",
        multi_slot_discount_3: "10",
        multi_slot_discount_4: "15",
        early_booking_days: "0",
        early_booking_discount_pct: "0"
    };

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        });
      }
    }
    console.log("Settings saved successfully!");
  } catch (error) {
    console.error("Prisma error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
