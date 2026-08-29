import "dotenv/config";
import { Telegraf } from "telegraf";
import { registerCommands } from "./handlers/commands.js";
import { registerMessageHandler } from "./handlers/message.js";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token || token === "PASTE_YOUR_NEW_TOKEN_HERE") {
  console.error("\nОШИБКА: вставьте новый токен BotFather в файл .env\n");
  process.exit(1);
}

const bot = new Telegraf(token);

registerCommands(bot);
registerMessageHandler(bot);

bot.catch((err) => {
  console.error("Ошибка Telegram-бота:", err);
});

bot.launch({ dropPendingUpdates: true });
console.log("GameCraft AI Telegram Bot запущен.");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
