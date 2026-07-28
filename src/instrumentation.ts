import { sendRawTelegramMessage } from "./lib/telegram";

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
          await sendRawTelegramMessage(
            `🔔 [NHẮC NHỞ ĐỊNH KỲ]\n\nHôm nay là ngày ${todayDate === 15 ? '15' : 'cuối cùng'} của tháng.\n\n🔒 Quản trị viên vui lòng tiến hành thay đổi toàn bộ MẬT KHẨU CỬA/PHÒNG tại chi nhánh để đảm bảo an ninh cho hệ thống Homestay.\n\nXin cảm ơn!`
          );
        }
      } catch (error) {
        console.error("Error in password reminder cron:", error);
      }
    });
  }
}
