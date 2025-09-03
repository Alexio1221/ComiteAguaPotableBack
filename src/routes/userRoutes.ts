// src/routes/auth.ts
import { Router } from 'express';
import { registrarUsuario } from '../controllers/auth/registrarUsuario';
import { iniciarSesion } from '../controllers/auth/loginController';
import { obtenerFuncionesPorRol } from '../controllers/roles/funcionesController';
import { obtenerRolActual, actualizarRolActual } from '../controllers/auth/sesionController';

const router = Router();

// Ruta para registrar un nuevo usuario
router.post('/registro', registrarUsuario);
router.post('/login', iniciarSesion);
router.get('/funciones/:nombreRol', obtenerFuncionesPorRol);
router.get('/obtenerRolActual',obtenerRolActual)
router.patch('/actualizarRolActual', actualizarRolActual)

export default router;