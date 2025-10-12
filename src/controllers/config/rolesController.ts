// src/controllers/roles/rolesController.ts
import { Request, Response } from "express";
import prisma from "../../config/client";

export const obtenerRoles = async (req: Request, res: Response) => {
  try {
    const roles = await prisma.rol.findMany({
      orderBy: {
        idRol: "asc" 
      }
    });

    res.json({ roles });
  } catch (error) {
    console.error("Error al obtener roles:", error);
    res.status(500).json({ mensaje: "Error al obtener roles" });
  }
};