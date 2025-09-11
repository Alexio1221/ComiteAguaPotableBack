// src/routes/auth.ts
import { Router } from 'express';
import { registrarUsuario } from '../controllers/auth/registrarUsuario';
import { iniciarSesion } from '../controllers/auth/loginController';
import { obtenerFuncionesPorRol, obtenerRolesUsuarioActual } from '../controllers/roles/funcionesController';
import { obtenerRolActual, actualizarRolActual } from '../controllers/auth/sesionController';
import { obtenerUsuarios, actualizarUsuario, cambiarContraseña } from '../controllers/auth/usuariosController';
import { obtenerRoles } from '../controllers/roles/rolesController';
import { obtenerCodigo, verificarCodigo } from '../controllers/passwordController';



const router = Router();

router.post('/registro', registrarUsuario); // Ruta para registrar un nuevo usuario
router.post('/login', iniciarSesion);  // Ruta para iniciar sesión
router.get('/funciones/:nombreRol', obtenerFuncionesPorRol);  // Ruta para obtener funciones por rol
router.get('/obtenerRolActual',obtenerRolActual);  // Ruta para obtener el rol actual
router.patch('/actualizarRolActual', actualizarRolActual);  // Ruta para actualizar el rol actual
router.get('/roles-usuario-actual', obtenerRolesUsuarioActual);  
router.get('/usuarios', obtenerUsuarios);   //obtiene toda la informacion de los usuarios 
router.put('/usuarios/:idUsuario', actualizarUsuario);  //Actualiza la informacion del usuario
router.get('/roles', obtenerRoles);   //obtiene todos los roles
router.post("/recuperar-codigo", obtenerCodigo);
router.post("/verificar-codigo", verificarCodigo);

export default router;