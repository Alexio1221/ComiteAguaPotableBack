import { Request, Response } from "express";
import prisma from '../../config/client'; // asegúrate de que este sea tu prisma client

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

