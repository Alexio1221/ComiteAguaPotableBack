import { Telegraf } from "telegraf";
import axios from "axios";

export function iniciarBot() {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

  bot.start(async (ctx) => {
    const chatId = String(ctx.chat.id);
    const mensaje = ctx.message?.text || "";
    const partes = mensaje.split(" ");
    const token = partes[1]; // el token viene después de /start

    if (!token) {
      await ctx.reply(
        "👋 Hola. Para vincular tu cuenta, abre el enlace desde la web y vuelve a intentarlo."
      );
      return;
    }

    try {
      await axios.post(`${process.env.API_URL}/registrar-chat-token`, {
        token,
        chat_id: chatId,
      });

      await ctx.reply("✅ Cuenta vinculada correctamente. Ahora ya puedo enviarte códigos.");
    } catch (error: any) {
      console.error("Error al registrar chat_id:", error?.response?.data || error);
      await ctx.reply("❌ Error al vincular cuenta. Intenta generar un nuevo enlace.");
    }
  });

  bot.launch().then(() => console.log("🤖 Bot de Telegram iniciado"));
}
