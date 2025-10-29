import { Request, Response } from "express";
import prisma from '../../config/client'; // asegúrate de que este sea tu prisma client
import bcrypt from 'bcryptjs';
import { validarContraseña } from '../../utils/validaciones';


export const obtenerUsuarios = async (req: Request, res: Response) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      include: {
        roles: {
          include: {
            rol: true
          }
        }
      },
      orderBy: {
        idUsuario: "asc"
      }
    });

    // Transformar formato json
    const resultado = usuarios.map((u) => ({
      idUsuario: u.idUsuario,
      nombre: u.nombre,
      apellidos: u.apellidos,
      telefono: u.telefono,
      usuario: u.usuario,
      ci: u.ci,
      roles: u.roles.map((ur) => ({
        idRol: ur.rol.idRol,
        nombreRol: ur.rol.nombreRol,
        estado: ur.estado,
        descripcion: ur.rol.descripcion,
      }))
    }));

    res.json({ usuarios: resultado });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ mensaje: "Error al obtener usuarios" });
  }
};

export const cambiarContraseña = async (req: Request, res: Response) => {
  const { usuario, nuevaContraseña } = req.body;

  if (!usuario || !nuevaContraseña) {
    res.status(400).json({ mensaje: "Usuario y contraseña son requeridos" });
    return;
  }

  const usuarioBody = usuario.toLowerCase();

  try {
    const usuarioEncontrado = await prisma.usuario.findUnique({
      where: { usuario: usuarioBody },
    });

    if (!usuarioEncontrado) {
      res.status(404).json({ mensaje: "Usuario no encontrado" });
      return;
    }

    const validacionContraseña = validarContraseña(nuevaContraseña);
    if (!validacionContraseña.valida) {
      res.status(400).json({
        error: 'CONTRASEÑA_INVALIDA',
        mensaje: validacionContraseña.mensaje
      });
      return;
    }

    const contraseñaHash = await bcrypt.hash(nuevaContraseña, 12);

    await prisma.usuario.update({
      where: { idUsuario: usuarioEncontrado.idUsuario },
      data: { contraseña: contraseñaHash },
    });

    res.status(200).json({ mensaje: "Contraseña cambiada correctamente" });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({ mensaje: "Error al cambiar contraseña" });
  }
};