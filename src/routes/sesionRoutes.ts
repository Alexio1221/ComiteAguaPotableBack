import { Router } from 'express';
import { autenticar } from '../middlewar/autenticacion'
import { iniciarSesion } from '../controllers/usuarios/loginController';
import { cerrarSesion } from '../controllers/usuarios/loginController';


const router = Router();

router.post('/login', iniciarSesion);  // Ruta para iniciar sesión
router.post("/cerrar-sesion", autenticar, cerrarSesion);

export default router;