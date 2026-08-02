import { sendRawTelegramMessage } from "./lib/telegram";
import { prisma } from "./lib/prisma";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = await import("node-cron");

    console.log("Cron job registered: 0 8 * * *");

    cron.schedule("0 8 * * *", async () => {
      try {
        const timeZone = "Asia/Ho_Chi_Minh";
        const now = new Date();
        const vnTimeStr = now.toLocaleString("en-US", { timeZone });
        const vnTime = new Date(vnTimeStr);

        const todayDate = vnTime.getDate();
        
        // Check if today is the last day of the month
        const tomorrow = new Date(vnTime);
        tomorrow.setDate(vnTime.getDate() + 1);
        const isLastDay = tomorrow.getDate() === 1;

        if (todayDate === 15 || isLastDay) {
          console.log(`Sending password change reminder (Day: ${todayDate})`);
          
          const facilities = await prisma.facility.findMany({
            where: { isActive: true }
          });

          let message = `🔔 [NHẮC NHỞ ĐỊNH KỲ]\n\nHôm nay là ngày ${todayDate === 15 ? '15' : 'cuối cùng'} của tháng.\n\n🔒 Hệ thống đã tự động tạo mật khẩu cổng mới cho các chi nhánh:\n\n`;

          for (const facility of facilities) {
            // Generate random 4-digit password (0000 - 9999)
            const newPassword = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

            // Update database
            await prisma.systemSetting.upsert({
              where: { key: `facility_gate_password_${facility.id}` },
              update: { value: newPassword },
              create: {
                key: `facility_gate_password_${facility.id}`,
                value: newPassword,
                description: `Mật khẩu cổng của chi nhánh ${facility.name}`
              }
            });

            message += `- ${facility.name}: <b>${newPassword}</b>\n`;
          }

          message += `\nQuản trị viên vui lòng tiến hành thay đổi toàn bộ MẬT KHẨU CỔNG trên thực tế khớp với mật khẩu mới trên để đảm bảo an ninh cho hệ thống Homestay.\n\nXin cảm ơn!`;

          await sendRawTelegramMessage(message);
        }
      } catch (error) {
        console.error("Error in password reminder cron:", error);
      }
    });
  }
}
