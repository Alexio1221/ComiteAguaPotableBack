import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

interface Payload {
  idUsuario: number;
  usuario: string;
}

export function generarToken(payload: Payload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn:'12h'});
}

export function verificarToken(token: string): Payload {
  if (!token) {
    throw new Error("Token no encontrado");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as Payload;
  return decoded;
}
