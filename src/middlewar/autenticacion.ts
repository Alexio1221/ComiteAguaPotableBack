import { Request, Response, NextFunction } from 'express';
import { verificarToken } from '../utils/tokenJWT';

export interface RequestConUsuario extends Request {
  user?: {
    idUsuario: number;
    usuario: string;
  };
}

export const autenticar = (req: RequestConUsuario, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ mensaje: 'No se encontró el token' });
      return;
    }

    const decoded = verificarToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(401).json({ mensaje: 'Token inválido o expirado' });
    return;
  }
};
