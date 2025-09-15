// src/routes/auth.ts
import { Router } from 'express';
import { registrarUsuario } from '../controllers/usuarios/registrarUsuario';
import { iniciarSesion } from '../controllers/usuarios/loginController';
import { obtenerFuncionesPorRol, obtenerRolesUsuarioActual } from '../controllers/roles/funcionesController';
import { obtenerRolActual, actualizarRolActual } from '../controllers/usuarios/sesionController';
import { obtenerUsuarios, actualizarUsuario, cambiarContraseña } from '../controllers/usuarios/usuariosController';
import { obtenerRoles } from '../controllers/roles/rolesController';
import { obtenerCodigo, verificarCodigo } from '../controllers/telegram/passwordController';
import {autenticar} from '../middlewar/autenticacion'



const router = Router();

router.post('/usuario', registrarUsuario);  // Ruta para registrar un nuevo usuario
router.post('/login', iniciarSesion);  // Ruta para iniciar sesión
router.get('/funciones/:nombreRol', autenticar ,obtenerFuncionesPorRol);  // Ruta para obtener funciones por rol
router.get('/obtenerRolActual',obtenerRolActual);  // Ruta para obtener el rol actual
router.patch('/actualizarRolActual', actualizarRolActual);  // Ruta para actualizar el rol actual
router.get('/roles-usuario-actual', obtenerRolesUsuarioActual);  
router.get('/usuarios', obtenerUsuarios);   //obtiene toda la informacion de los usuarios 
router.put('/usuario/:idUsuario', actualizarUsuario);  //Actualiza la informacion del usuario
router.get('/roles', obtenerRoles);   //obtiene todos los roles
router.post("/recuperar-codigo", obtenerCodigo);
router.post("/verificar-codigo", verificarCodigo);

export default router;