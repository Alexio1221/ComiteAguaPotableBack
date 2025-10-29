// src/controllers/roles/obtenerFuncionesPorRol.ts
import { Request, Response } from "express";
import prisma from "../../config/client";
import { RequestConUsuario } from '../../middlewar/autenticacion';

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

//Roles del usuario actual
export const obtenerRolesUsuarioActual = async (req: RequestConUsuario, res: Response) => {
  try {
    const idUsuario = req.user?.idUsuario;

    // Buscar roles
    const rolesActivos = await prisma.usuarioRol.findMany({
      where: { idUsuario, estado: true },
      include: {
        rol: {
          select: {
            nombreRol: true,
            descripcion: true,
          },
        },
      },
    });

    if (rolesActivos.length === 0) {
      res.status(404).json({ mensaje: "El usuario no tiene roles activos" });
      return;
    }

    const roles = rolesActivos.map((usuarioRol) => ({
      nombreRol: usuarioRol.rol.nombreRol,
      descripcion: usuarioRol.rol.descripcion,
    }));

    res.json({ roles });
  } catch (error) {
    console.error("Error obteniendo roles:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

