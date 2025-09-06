// src/controllers/roles/obtenerFuncionesPorRol.ts
import { Request, Response } from "express";
import prisma from "../../config/client";

export const obtenerFuncionesPorRol = async (req: Request, res: Response) => {
  try {
    const { nombreRol } = req.params;

    if (!nombreRol) {
      res.status(400).json({ mensaje: "Se requiere el nombre del rol" });
      return;
    }

    // Buscar el rol activo
    const rol = await prisma.rol.findFirst({
      where: { nombreRol: nombreRol },
      include: {
        funciones: true,
      },
    });

    if (!rol) {
      res.status(404).json({ mensaje: "Rol no encontrado" });
      return;
    }

    // Formatear la respuesta
    const funcionesFormateadas = rol.funciones.map(f => ({
      nombreFuncion: f.nombreFuncion,
      icono: f.icono,
    }));

    res.json({ nombreRol: rol.nombreRol, funciones: funcionesFormateadas });
  } catch (error) {
    console.error("Error obteniendo funciones por rol:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const obtenerRoles = async (req: Request, res: Response) => {
  try {
    const tokenSesionActual = req.cookies.token;

    if (!tokenSesionActual) {
      res.status(400).json({ mensaje: "Se requiere el token de sesión" });
      return;
    }

    // Buscar sesión + usuario + roles
    const sesion = await prisma.sesion.findUnique({
      where: { tokenSesion: tokenSesionActual },
      include: {
        usuario: {
          include: {
            roles: {
              include: {
                rol: true, // Traer datos del rol
              },
            },
          },
        },
      },
    });

    if (!sesion) {
      res.status(404).json({ mensaje: "Sesión no encontrada" });
      return;
    }

    // Obtener roles del usuario
    const roles = sesion.usuario.roles.map((usuarioRol) => ({
      nombreRol: usuarioRol.rol.nombreRol,
      descripcion: usuarioRol.rol.descripcion,
    }));

    res.json({ roles });
  } catch (error) {
    console.error("Error obteniendo roles:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};
