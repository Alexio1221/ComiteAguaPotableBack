// src/controllers/auth/iniciarSesion.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/client';
import { generarToken } from '../../utils/tokenJWT';

interface LoginBody {
  usuario: string;
  contraseña: string;
}

export const iniciarSesion = async (req: Request<{}, any, LoginBody>, res: Response): Promise<void> => {
  try {
    const { usuario, contraseña } = req.body;

    if (!usuario || !contraseña) {
      res.status(400).json({ error: 'CAMPOS_REQUERIDOS', mensaje: 'Usuario y contraseña son obligatorios.' });
      return;
    }

    // Buscar usuario con roles y funciones
    const usuarioEncontrado = await prisma.usuario.findUnique({
      where: { usuario: usuario.trim().toLowerCase() },
      include: {
        roles: {
          include: { rol: true }
        }
      }
    });

    if (!usuarioEncontrado) {
      res.status(404).json({ error: 'USUARIO_NO_ENCONTRADO', mensaje: 'Usuario no registrado.' });
      return;
    }

    const contraseñaValida = await bcrypt.compare(contraseña, usuarioEncontrado.contraseña);

    if (!contraseñaValida) {
      res.status(401).json({ error: 'CREDENCIALES_INVALIDAS', mensaje: 'Contraseña incorrecta.' });
      return;
    }

    // Generar token JWT
    const token = generarToken({
      id: usuarioEncontrado.idUsuario,
      usuario: usuarioEncontrado.usuario
    });

    // Configurar cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60 * 1000, // 12 horas
    });

    const rolActual = usuarioEncontrado.roles[0]?.rol.nombreRol || "Socio";

    // Crear la sesión
    const sesion = await prisma.sesion.create({
      data: {
        idUsuario: usuarioEncontrado.idUsuario,
        rolActual,
        tokenSesion: token,
      },
    });

    // Respuesta final
    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: {
        idUsuario: usuarioEncontrado.idUsuario,
        usuario: usuarioEncontrado.usuario,
        nombre: usuarioEncontrado.nombre,
        apellido: usuarioEncontrado.apellido,
      }
    });

  } catch (error) {
    console.error('Error en inicio de sesión:', error);
    res.status(500).json({ error: 'ERROR_SERVIDOR', mensaje: 'Error interno del servidor.' });
  }
};


export const cerrarSesion = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies.token;

    if (token) {
      await prisma.sesion.updateMany({
        where: { tokenSesion: token },
        data: { estado: false },
      });
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.json({ mensaje: 'Sesión cerrada correctamente' });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    res.status(500).json({ error: 'ERROR_SERVIDOR', mensaje: 'Error interno del servidor.' });
  }
};