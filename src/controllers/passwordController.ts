import { Request, Response } from "express";
import prisma from "../config/client";
import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Generar código de 6 dígitos
const generarCodigo = () => Math.floor(100000 + Math.random() * 900000).toString();

export const obtenerCodigo = async (req: Request, res: Response) => {
  const { usuario } = req.body; // ahora se recibe el nombre de usuario
  const usuario_body = usuario.toLowerCase();

  try {
    // Buscar usuario por su username
    const usuario_buscado = await prisma.usuario.findFirst({
      where: {
        usuario: usuario_body,
        NOT: { chat_id: null }
      },
    });


    if (!usuario_buscado) {
      res.status(404).json({ mensaje: "Usuario no registrado o no vinculado con Telegram" });
      return;
    }

    const codigo = generarCodigo();

    // Guardar en la base de datos
    await prisma.recuperacion.create({
      data: {
        idUsuario: usuario_buscado.idUsuario,
        codigo,
        estado: true,
        expiraEn: new Date(Date.now() + 5 * 60 * 1000), // 5 minutos
      },
    });

    // Enviar mensaje por Telegram si tiene chat_id
    if (usuario_buscado.chat_id) {
      await bot.telegram.sendMessage(
        usuario_buscado.chat_id,
        `📩 Tu código de recuperación es: ${codigo}. Expira en 5 minutos.`
      );
    } else {
      console.log(`📩 Usuario ${usuario} no tiene chat_id, código: ${codigo}`);
    }

    res.json({ mensaje: "Código enviado correctamente" });
  } catch (error) {
    console.error("Error al generar código:", error);
    res.status(500).json({ mensaje: "Error al generar código" });
  }
};

export const verificarCodigo = async (req: Request, res: Response) => {
  const { usuario, codigo } = req.body;
  const usuario_body = usuario.toLowerCase();

  try {
    const usuario_buscado = await prisma.usuario.findUnique({
      where: { usuario: usuario_body },
    });

    if (!usuario_buscado) {
      res.status(404).json({ mensaje: "Usuario no registrado" });
      return;
    }

    const registro = await prisma.recuperacion.findFirst({
      where: {
        idUsuario: usuario_buscado.idUsuario,
        estado: true,
        codigo,
      },
      orderBy: { creadoEn: "desc" },
    });

    if (!registro) {
      res.status(400).json({ mensaje: "Código incorrecto o expirado" });
      return;
    }

    // Marcar como usado
    await prisma.recuperacion.update({
      where: { idRecuperacion: registro.idRecuperacion },
      data: { estado: false },
    });

    res.json({ mensaje: "Código verificado correctamente" });
  } catch (error) {
    console.error("Error al verificar código:", error);
    res.status(500).json({ mensaje: "Error al verificar código" });
  }
};
