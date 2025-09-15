// src/controllers/auth/registrarUsuario.ts
import prisma from '../../config/client';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { validarContraseña, validarUsuario } from '../../utils/validaciones';
import { RegistroBody } from '../../utils/tiposDatos';

export const registrarUsuario = async (
  req: Request<{}, any, RegistroBody>,
  res: Response
): Promise<void> => {
  console.log('Body recibido:', req.body);

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
    if (
      nombre.trim().length < 2 ||
      nombre.trim().length > 50 ||
      apellido.trim().length < 2 ||
      apellido.trim().length > 50
    ) {
      res.status(400).json({
        error: 'NOMBRE_O_APELLIDO_INVALIDO',
        mensaje: 'El nombre y apellido debe tener entre 2 y 50 caracteres.'
      });
      return;
    }

    // Validar teléfono (7-8 dígitos)
    if (!/^\d{7,8}$/.test(telefono)) {
      res.status(400).json({
        error: 'TELEFONO_INVALIDO',
        mensaje: 'El teléfono debe contener entre 7 y 8 dígitos.'
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

    // Respuesta exitosa
    res.status(201).json({
      mensaje: 'Usuario creado correctamente.',
      usuario: nuevoUsuario.usuario
    });
  } catch (error) {
    res.status(500).json({
      error: 'ERROR_SERVIDOR',
      mensaje: 'Error interno del servidor. Intente nuevamente.'
    });
  }
};


