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

    const usuarioEncontrado = await prisma.usuario.findUnique({
      where: {
        usuario: usuario.trim().toLowerCase()
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

    const token = generarToken({
      id: usuarioEncontrado.id,
      usuario: usuarioEncontrado.usuario
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // solo HTTPS en producción
      sameSite: 'lax', // protección CSRF básica
      maxAge: 12 * 60 * 60 * 1000, // 12 horas en ms
    });

    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso ✅',
      usuario: usuarioEncontrado.usuario,
    });

  } catch (error) {
    console.error('Error en inicio de sesión:', error);
    res.status(500).json({ error: 'ERROR_SERVIDOR', mensaje: 'Error interno del servidor.' });
  }
};
