// src/routes/auth.ts
import { Router } from 'express';
import { registrarUsuario } from '../controllers/auth/registrarUsuario';
import { iniciarSesion } from '../controllers/auth/loginController';

const router = Router();

// Ruta para registrar un nuevo usuario
router.post('/registro', registrarUsuario);
router.post('/login', iniciarSesion);

export default router;