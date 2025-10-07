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
      apellidos,
      telefono,
      usuario,
      contraseña,
      ci,
      rolesIds = [],
      estadosRoles = {}
    } = req.body;

    // Asegurar que siempre se incluya Socio
    if (!rolesIds.includes(4)) rolesIds.push(4);

    // Validaciones de campos obligatorios
    if (
      !nombre?.trim() ||
      !apellidos?.trim() ||
      !telefono?.trim() ||
      !usuario?.trim() ||
      !contraseña ||
      !ci?.trim() ||
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
    const validacionNombreApellido = validarNombreApellido(nombre.trim(), apellidos.trim());
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
        apellidos: apellidos.trim(),
        telefono: telefono.trim(),
        ci: ci.trim(),
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
      apellidos: nuevoUsuario.apellidos,
      telefono: nuevoUsuario.telefono,
      usuario: nuevoUsuario.usuario,
      ci: nuevoUsuario.ci,
      roles: rolesAsignados.map((ur) => ({
        idRol: ur.rol.idRol,
        nombreRol: ur.rol.nombreRol,
        estado: ur.estado,
      })),
    };

    res.json(resultado);
  } catch (error: any) {
    if (error.code === 'P2002') {
      // Prisma devuelve en error.meta.target qué campo causó el conflicto
      const campo = error.meta?.target?.[0];

      if (campo === 'telefono') {
        res.status(409).json({
          error: 'TELEFONO_EXISTENTE',
          mensaje: 'El número de teléfono ya está en uso.'
        });
        return;
      }

      if (campo === 'ci') {
        res.status(409).json({
          error: 'CI_EXISTENTE',
          mensaje: 'El número de CI ya está registrado.'
        });
        return;
      }
    }
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
  const { nombre, apellidos, telefono, usuario, rolesIds = [], estadosRoles = {}, ci, contraseña } = req.body;

  try {
    // Asegurar que siempre se incluya Socio
    if (!rolesIds.includes(4)) rolesIds.push(4);


    // Validar longitud del nombre y apellido
    const validacionNombreApellido = validarNombreApellido(nombre.trim(), apellidos.trim());
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

    //Validad Ci
    if (ci.trim() === "") {
      res.status(400).json({
        error: 'CI_INVALIDO',
        mensaje: "El Ci no puede ser vacio"
      });
      return;
    }

    //Validar contraseña si es nuevo se actualiza y no se deja como estaba
    let nuevaContraseña = undefined;
    if (contraseña && contraseña.trim() !== '') {
      nuevaContraseña = await bcrypt.hash(contraseña.trim(), 10);
    }

    //  Actualizar datos básicos del usuario
    const usuarioMinuscula = usuario.trim().toLowerCase();
    const dataUpdate: any = {
      nombre,
      apellidos,
      telefono,
      ci,
      usuario: usuarioMinuscula,
    };

    // Si hay nueva contraseña, la incluimos en el update
    if (nuevaContraseña) {
      dataUpdate.contraseña = nuevaContraseña;
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { idUsuario: Number(idUsuario) },
      data: dataUpdate,
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
      apellidos: usuarioActualizado.apellidos,
      telefono: usuarioActualizado.telefono,
      usuario: usuarioActualizado.usuario,
      ci: usuarioActualizado.ci,
      roles: rolesActualizados.map((ur) => ({
        idRol: ur.rol.idRol,
        nombreRol: ur.rol.nombreRol,
        estado: ur.estado,
      })),
    };

    //console.log('Datos enviados:', resultado);

    res.json(resultado);
  } catch (error: any) {
    if (error.code === 'P2002') {
      // Prisma devuelve en error.meta.target qué campo causó el conflicto
      const campo = error.meta?.target?.[0];

      if (campo === 'usuario') {
        res.status(409).json({
          error: 'USUARIO_EXISTENTE',
          mensaje: 'El nombre de usuario ya está en uso.'
        });
        return;
      }

      if (campo === 'ci') {
        res.status(409).json({
          error: 'CI_EXISTENTE',
          mensaje: 'El número de CI ya está registrado.'
        });
        return;
      }
    }

    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ mensaje: 'Error al actualizar usuario' });
  }
};