// src/controllers/auth/registrarUsuario.ts
import prisma from '../../config/client';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { validarContraseña, validarUsuario, validarNombreApellido, validarTelefono } from '../../utils/validaciones';
import { RegistroBody } from '../../utils/tiposDatos';

export const registrarUsuario = async (
  req: Request<{}, any, RegistroBody>,
  res: Response
): Promise<void> => {
  //console.log('Body recibido:', req.body);

  try {
    const {
      nombre,
      apellido,
      telefono,
      usuario,
      contraseña,
      rolesIds = [],
      estadosRoles = {}
    } = req.body;

    // Asegurar que siempre se incluya Socio
    if (!rolesIds.includes(4)) rolesIds.push(4);

    // Validaciones de campos obligatorios
    if (
      !nombre?.trim() ||
      !apellido?.trim() ||
      !telefono?.trim() ||
      !usuario?.trim() ||
      !contraseña ||
      !Array.isArray(rolesIds) ||
      rolesIds.length === 0 ||
      !estadosRoles ||
      typeof estadosRoles !== 'object'
    ) {
      res.status(400).json({
        error: 'CAMPOS_REQUERIDOS',
        mensaje: 'Todos los campos son obligatorios.'
      });
      return;
    }

    // Validar longitud del nombre y apellido
    const validacionNombreApellido = validarNombreApellido(nombre.trim(), apellido.trim());
    if (!validacionNombreApellido.valido) {
      res.status(400).json({
        error: 'USUARIO_INVALIDO',
        mensaje: validacionNombreApellido.mensaje
      });
      return;
    }

    // Validar teléfono (7-8 dígitos)
    const validacionTelefono = validarTelefono(telefono.trim());
    if (!validacionTelefono.valido) {
      res.status(400).json({
        error: 'TELEFONO_INVALIDO',
        mensaje: validacionTelefono.mensaje
      });
      return;
    }

    // Validar usuario
    const validacionUsuario = validarUsuario(usuario.trim());
    if (!validacionUsuario.valido) {
      res.status(400).json({
        error: 'USUARIO_INVALIDO',
        mensaje: validacionUsuario.mensaje
      });
      return;
    }

    // Validar contraseña
    const validacionContraseña = validarContraseña(contraseña);
    if (!validacionContraseña.valida) {
      res.status(400).json({
        error: 'CONTRASEÑA_INVALIDA',
        mensaje: validacionContraseña.mensaje
      });
      return;
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { usuario: usuario.trim().toLowerCase() }
    });

    if (usuarioExistente) {
      res.status(409).json({
        error: 'USUARIO_EXISTENTE',
        mensaje: 'El nombre de usuario ya está en uso.'
      });
      return;
    }

    // Hashear la contraseña
    const contraseñaHash = await bcrypt.hash(contraseña, 12);

    // Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim(),
        usuario: usuario.trim().toLowerCase(),
        contraseña: contraseñaHash
      }
    });

    // Crear relaciones de roles en paralelo
    await Promise.all(
      rolesIds.map((idRol) =>
        prisma.usuarioRol.create({
          data: {
            idUsuario: nuevoUsuario.idUsuario,
            idRol,
            estado: estadosRoles[idRol] ?? true
          }
        })
      )
    );

    // Traer los roles del usuario recién creado
    const rolesAsignados = await prisma.usuarioRol.findMany({
      where: { idUsuario: nuevoUsuario.idUsuario },
      include: { rol: true },
    });

    const resultado = {
      idUsuario: nuevoUsuario.idUsuario,
      nombre: nuevoUsuario.nombre,
      apellido: nuevoUsuario.apellido,
      telefono: nuevoUsuario.telefono,
      usuario: nuevoUsuario.usuario,
      roles: rolesAsignados.map((ur) => ({
        idRol: ur.rol.idRol,
        nombreRol: ur.rol.nombreRol,
        estado: ur.estado,
      })),
    };

    res.json(resultado);
  } catch (error) {
    res.status(500).json({
      error: 'ERROR_SERVIDOR',
      mensaje: 'Error interno del servidor. Intente nuevamente.'
    });
  }
};


export const actualizarUsuario = async (req: Request, res: Response) => {
  //console.log('Params recibidos:', req.params);
  //console.log('Body recibido:', req.body);

  const { idUsuario } = req.params;
  const { nombre, apellido, telefono, usuario, rolesIds = [], estadosRoles = {} } = req.body;

  try {
    // Asegurar que siempre se incluya Socio
    if (!rolesIds.includes(4)) rolesIds.push(4);


    // Validar longitud del nombre y apellido
    const validacionNombreApellido = validarNombreApellido(nombre.trim(), apellido.trim());
    if (!validacionNombreApellido.valido) {
      res.status(400).json({
        error: 'USUARIO_INVALIDO',
        mensaje: validacionNombreApellido.mensaje
      });
      return;
    }

    // Validar teléfono (7-8 dígitos)
    const validacionTelefono = validarTelefono(telefono.trim());
    if (!validacionTelefono.valido) {
      res.status(400).json({
        error: 'TELEFONO_INVALIDO',
        mensaje: validacionTelefono.mensaje
      });
      return;
    }

    // Validar usuario
    const validacionUsuario = validarUsuario(usuario.trim());
    if (!validacionUsuario.valido) {
      res.status(400).json({
        error: 'USUARIO_INVALIDO',
        mensaje: validacionUsuario.mensaje
      });
      return;
    }

    //  Actualizar datos básicos del usuario
    const usuarioMinuscula = usuario.trim().toLowerCase();
    const usuarioActualizado = await prisma.usuario.update({
      where: { idUsuario: Number(idUsuario) },
      data: { nombre, apellido, telefono, usuario: usuarioMinuscula },
    });

    //Obtener los roles actuales del usuario
    const rolesActuales = await prisma.usuarioRol.findMany({
      where: { idUsuario: usuarioActualizado.idUsuario },
    });
    //Ids de los roles actuales
    const rolesActualesIds = rolesActuales.map(r => r.idRol);
    // Diferencia (roles que no existen aún en BD)
    const rolesNuevos = rolesIds.filter((id: number) => !rolesActualesIds.includes(id));

    // Crear esos roles nuevos
    for (const idRol of rolesNuevos) {
      await prisma.usuarioRol.create({
        data: {
          idUsuario: usuarioActualizado.idUsuario,
          idRol,
        },
      });
    }

    // Actualizar solo el estado de cada rol ya asignado
    if (estadosRoles) {
      for (const [idRolStr, estado] of Object.entries(estadosRoles)) {
        const idRol = Number(idRolStr);
        await prisma.usuarioRol.updateMany({
          where: { idUsuario: usuarioActualizado.idUsuario, idRol },
          data: { estado: Boolean(estado) },
        });
      }
    }

    //  Traer usuario con roles actualizados
    const rolesActualizados = await prisma.usuarioRol.findMany({
      where: { idUsuario: usuarioActualizado.idUsuario },
      include: { rol: true },
    });
    //Es necesario para actualizar solo ese usuario en el frontend
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
      })),
    };

    //console.log('Datos enviados:', resultado);

    res.json(resultado);
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('usuario')) {
      // Error de unicidad en el campo 'usuario'
      res.status(409).json({
        error: 'USUARIO_EXISTENTE',
        mensaje: 'El nombre de usuario ya está en uso.'
      });
    } else {
      //console.error("Error al actualizar usuario:", error);
      res.status(500).json({ mensaje: "Error al actualizar usuario" });
    }
  }
};