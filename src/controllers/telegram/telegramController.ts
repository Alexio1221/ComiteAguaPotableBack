import { Request, Response } from "express";
import prisma from "../../config/client";
import crypto from "crypto";

export const generarLinkTelegram = async (req: Request, res: Response) => {
  const { idUsuario } = req.body; // o lo obtienes de tu sesión

  try {
    const token = crypto.randomBytes(16).toString("hex");
    const expiracion = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await prisma.usuario.update({
      where: { idUsuario },
      data: { telegramToken: token, tokenExpira: expiracion },
    });

    const botUsername = process.env.TELEGRAM_BOT_USERNAME; // ej: "MiBot"
    const link = `https://t.me/${botUsername}?start=${token}`;

    res.json({ link });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error generando link" });
  }
};

export const registrarChatPorToken = async (req: Request, res: Response) => {
  const { token, chat_id } = req.body;

  try {
    const usuario = await prisma.usuario.findFirst({
      where: { telegramToken: token },
    });

    if (!usuario) {
      res.status(404).json({ mensaje: "Token inválido o ya usado" });
      return;
    }

    if (usuario.tokenExpira && usuario.tokenExpira < new Date()) {
      res.status(400).json({ mensaje: "Token expirado, genera uno nuevo" });
      return;
    }

    await prisma.usuario.update({
      where: { idUsuario: usuario.idUsuario },
      data: {
        chat_id,
        telegramToken: null, 
        tokenExpira: null,
      },
    });

    res.json({ mensaje: "Chat vinculado correctamente" });
  } catch (error) {
    console.error("Error al registrar chat_id:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

