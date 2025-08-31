// src/controllers/auth/registrarUsuario.ts
import prisma from '../../config/client';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';

// Interfaz para el body del request
interface RegistroBody {
  nombre: string;
  apellido: string;
  telefono: string;
  usuario: string;
  contraseña: string;
}

// Función para validar fortaleza de contraseña
const validarContraseña = (contraseña: string): { valida: boolean; mensaje?: string } => {
  if (contraseña.length < 8) {
    return { valida: false, mensaje: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(contraseña)) {
    return {
      valida: false,
      mensaje: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número.'
    };
  }

  return { valida: true };
};

// Función para validar nombre de usuario
const validarUsuario = (usuario: string): { valido: boolean; mensaje?: string } => {
  if (usuario.length < 3 || usuario.length > 20) {
    return { valido: false, mensaje: 'El usuario debe tener entre 3 y 20 caracteres.' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(usuario)) {
    return {
      valido: false,
      mensaje: 'El usuario solo puede contener letras, números y guiones bajos.'
    };
  }

  return { valido: true };
};

export const registrarUsuario = async (req: Request<{}, any, RegistroBody>, res: Response): Promise<void> => {
  try {
    const { nombre, apellido, telefono, usuario, contraseña } = req.body;

    // Validaciones de campos obligatorios
    if (!nombre || !apellido || !telefono || !usuario || !contraseña) {
      res.status(400).json({
        error: 'CAMPOS_REQUERIDOS',
        mensaje: 'Todos los campos son obligatorios.'
      });
      return;
    }
    // Validar longitud del nombre
    if ((nombre.trim().length < 2 || nombre.trim().length > 50) || (apellido.trim().length < 2 || apellido.trim().length > 50)) {
      res.status(400).json({
        error: 'NOMBRE_O_APELLIDO_INVALIDO',
        mensaje: 'El nombre y apellido debe tener entre 2 y 50 caracteres.'
      });
      return;
    }

    // Validar Telefono
    if (!/^\d{7,15}$/.test(telefono)) {
      res.status(400).json({
        error: 'TELEFONO_INVALIDO',
        mensaje: 'El teléfono debe contener solo números y tener entre 7 y 15 dígitos.'
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
      where: { usuario: usuario.trim().toLowerCase() },
    });

    if (usuarioExistente) {
      res.status(409).json({
        error: 'USUARIO_EXISTENTE',
        mensaje: 'El nombre de usuario ya está en uso.'
      });
      return;
    }

    // Hashear la contraseña con salt más alto para mayor seguridad
    const contraseñaHash = await bcrypt.hash(contraseña, 12);

    // Crear el nuevo usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim(),
        usuario: usuario.trim().toLowerCase(),
        contraseña: contraseñaHash,
      },
    });

    // Respuesta sin información sensible
    res.status(201).json({
      mensaje: 'Usuario creado correctamente.',
      usuario: nuevoUsuario.usuario
    });
    return;

  } catch (error) {
    // Log del error para debugging (sin exponer al cliente)
    console.error('Error en registro de usuario:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Error desconocido',
      // No incluir stack trace en producción
    });

    // Verificar si es un error de constraint de base de datos
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        res.status(409).json({
          error: 'USUARIO_EXISTENTE',
          mensaje: 'El nombre de usuario ya está en uso.'
        });
        return;
      }
    }

    res.status(500).json({
      error: 'ERROR_SERVIDOR',
      mensaje: 'Error interno del servidor. Intente nuevamente.'
    });
    return;
  }
}