import { Request, Response, NextFunction } from 'express';
import { verificarToken } from '../utils/tokenJWT';

export const autenticar = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      res.status(401).json({ mensaje: 'No se encontró el token' });
      return;
    }

    const decoded = verificarToken(token);
    req.body.usuario = decoded;

    next();
  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(401).json({ mensaje: 'Token inválido o expirado' });
    return;
  }
};
