const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanBookings() {
  console.log("Cleaning up old booking data...");
  try {
    // Delete all records in dependent tables first
    await prisma.emailLog.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.bookingDetail.deleteMany({});
    
    // Delete the main bookings
    const result = await prisma.booking.deleteMany({});
    
    console.log(`Successfully deleted ${result.count} old bookings.`);
  } catch (error) {
    console.error("Error cleaning bookings:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanBookings();
