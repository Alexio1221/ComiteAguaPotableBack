// src/controllers/roles/obtenerFuncionesPorRol.ts
import { Request, Response, NextFunction  } from "express";
import prisma from "../../config/client";

export const obtenerRolActual = async (req: Request, res: Response) => {
    try {
        const tokenSesionActual = req.cookies.token;

        if (!tokenSesionActual) {
            res.status(400).json({ mensaje: "Se requiere el token de sesion" });
            return;
        }

        // Buscar el rol activo
        const sesion = await prisma.sesion.findFirst({
            where: { tokenSesion: tokenSesionActual, estado: true },
            select: {
                rolActual: true,
            },
        });

        if (!sesion) {
            res.status(404).json({ mensaje: "Sesion no encontrada o caducada" });
            return;
        }

        res.json({ rol: sesion.rolActual });
    } catch (error) {
        console.error("Error obteniendo funciones por rol:", error);
        res.status(500).json({ mensaje: "Error interno del servidor" });
    }
};

// Actualizar el rol de la sesión actual
export const actualizarRolActual = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {  // <-- cambiar a Promise<void>
  try {
    const tokenSesionActual = req.cookies.token;

    if (!tokenSesionActual) {
      res.status(400).json({ mensaje: "Se requiere el token de sesión" });
      return;
    }

    const { nuevoRol } = req.body;
    if (!nuevoRol) {
      res.status(400).json({ mensaje: "Se requiere el nuevo rol" });
      return;
    }

    // Buscar la sesión actual
    const sesion = await prisma.sesion.findFirst({
      where: { tokenSesion: tokenSesionActual, estado: true },
    });

    if (!sesion) {
      res.status(404).json({ mensaje: "Sesión no encontrada o caducada" });
      return;
    }

    // Actualizar el rolActual
    const sesionActualizada = await prisma.sesion.update({
      where: { idSesion: sesion.idSesion },
      data: { rolActual: nuevoRol },
    });

    res.json({
      mensaje: "Rol actualizado correctamente",
      rolActual: sesionActualizada.rolActual,
    });
  } catch (error) {
    console.error("Error actualizando rol de sesión:", error);
    res.status(500).json({ mensaje: req.cookies.token });
  }
};