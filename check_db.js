  const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const booking = await prisma.booking.findUnique({
    where: { id: 'cmqix2mhu001p5o2xdg3ax65x' },
    include: {
      emailLogs: true,
    }
  });
  console.log("Booking Email:", booking?.customerEmail);
  console.log("Email Logs:", JSON.stringify(booking?.emailLogs, null, 2));

  const settings = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from']
      }
    }
  });
  console.log("SMTP Settings in DB:", settings);
}

check().finally(() => prisma.$disconnect());
