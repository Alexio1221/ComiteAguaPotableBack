import { Router } from 'express';
import { autenticar } from '../middlewar/autenticacion'
import { iniciarSesion } from '../controllers/usuarios/loginController';
import { cerrarSesion } from '../controllers/usuarios/loginController';
import { RequestConUsuario } from '../middlewar/autenticacion';


const router = Router();

router.post('/login', iniciarSesion);  // Ruta para iniciar sesión
router.post("/cerrar-sesion", autenticar, cerrarSesion);

// Sirve para saber si un usuario inicio sesion o no, se usa en la vista principal
router.get('/verificar-sesion', autenticar, (req: RequestConUsuario, res) => {
  res.json({ loggedIn: true, user: req.user?.usuario });
});

export default router;