import { prisma } from "@/lib/prisma";

interface TelegramNotificationPayload {
  bookingId: string;
  customerName: string;
  customerPhone: string;
  roomName: string;
  totalAmount: number;
  paymentMethod: string;
  bookingTime: string;
  facilityName: string;
}

export async function sendTelegramNotification(payload: TelegramNotificationPayload) {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ["telegram_bot_token", "telegram_chat_id"],
        },
      },
    });

    const botToken = settings.find((s: any) => s.key === "telegram_bot_token")?.value;
    const chatId = settings.find((s: any) => s.key === "telegram_chat_id")?.value;

    if (!botToken || !chatId) {
      // Telegram configuration is not set up
      return;
    }

    const amountFormatted = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(payload.totalAmount);

    const message = `
🎉 <b>CÓ ĐƠN ĐẶT PHÒNG MỚI!</b>
-----------------------------------
Mã đơn: <b>${payload.bookingId}</b>
Khách hàng: <b>${payload.customerName}</b>
Số điện thoại: <b>${payload.customerPhone}</b>
Chi nhánh: <b>${payload.facilityName}</b>
Phòng: <b>${payload.roomName}</b>
Thời gian: <b>${payload.bookingTime}</b>
Phương thức: <b>${payload.paymentMethod}</b>
Tổng tiền: <b>${amountFormatted}</b>
-----------------------------------
Vui lòng kiểm tra trang quản trị để xem chi tiết!
    `.trim();

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Telegram API Error:", errorData);
    }
  } catch (error) {
    console.error("Failed to send Telegram notification:", error);
  }
}

export async function sendRawTelegramMessage(message: string) {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ["telegram_bot_token", "telegram_chat_id"],
        },
      },
    });

    const botToken = settings.find((s: any) => s.key === "telegram_bot_token")?.value;
    const chatId = settings.find((s: any) => s.key === "telegram_chat_id")?.value;

    if (!botToken || !chatId) {
      return;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Telegram API Error:", errorData);
    }
  } catch (error) {
    console.error("Failed to send raw Telegram message:", error);
  }
}
