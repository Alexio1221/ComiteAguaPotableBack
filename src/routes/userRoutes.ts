// src/routes/auth.ts
import { Router } from 'express';
import { registrarUsuario } from '../controllers/auth/registrarUsuario';

const router = Router();

// Ruta para registrar un nuevo usuario
router.post('/registro', registrarUsuario);


export default router;