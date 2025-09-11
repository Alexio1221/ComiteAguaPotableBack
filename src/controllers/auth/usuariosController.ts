import { Request, Response } from "express";
import prisma from '../../config/client'; // asegúrate de que este sea tu prisma client
import bcrypt from 'bcryptjs';

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
            apellido: u.apellido,
            telefono: u.telefono,
            usuario: u.usuario,
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

export const actualizarUsuario = async (req: Request, res: Response) => {
  const { idUsuario } = req.params;
  const { nombre, apellido, telefono, usuario, estadosRoles } = req.body;

  try {
    // 1. Actualizar datos básicos del usuario
    const usuarioActualizado = await prisma.usuario.update({
      where: { idUsuario: Number(idUsuario) },
      data: { nombre, apellido, telefono, usuario },
    });

    // 2. Actualizar solo el estado de cada rol ya asignado
    if (estadosRoles) {
      for (const [idRolStr, estado] of Object.entries(estadosRoles)) {
        const idRol = Number(idRolStr);
        await prisma.usuarioRol.updateMany({
          where: { idUsuario: usuarioActualizado.idUsuario, idRol },
          data: { estado: Boolean(estado) },
        });
      }
    }

    // 3. Traer usuario con roles actualizados
    const rolesActualizados = await prisma.usuarioRol.findMany({
      where: { idUsuario: usuarioActualizado.idUsuario },
      include: { rol: true },
    });

    const resultado = {
      idUsuario: usuarioActualizado.idUsuario,
      nombre: usuarioActualizado.nombre,
      apellido: usuarioActualizado.apellido,
      telefono: usuarioActualizado.telefono,
      usuario: usuarioActualizado.usuario,
      roles: rolesActualizados.map((ur) => ({
        idRol: ur.rol.idRol,
        nombreRol: ur.rol.nombreRol,
        estado: ur.estado,
        descripcion: ur.rol.descripcion,
      })),
    };

    res.json(resultado);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ mensaje: "Error al actualizar usuario" });
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