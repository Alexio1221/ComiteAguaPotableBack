// src/routes/auth.ts
import { Router } from 'express';
import { registrarUsuario, actualizarUsuario } from '../controllers/usuarios/registrarUsuario';
import { obtenerFuncionesPorRol, obtenerRolesUsuarioActual } from '../controllers/config/funcionesController';
import { obtenerRolActual, actualizarRolActual } from '../controllers/usuarios/sesionController';
import { obtenerUsuarios } from '../controllers/usuarios/usuariosController';
import { obtenerRoles } from '../controllers/config/rolesController';
import { obtenerCodigo, verificarCodigo } from '../controllers/telegram/passwordController';
import {autenticar} from '../middlewar/autenticacion'
import { obtenerCategorias } from '../controllers/config/categoriasController';

const router = Router();

router.post('/usuario', registrarUsuario);  // Ruta para registrar un nuevo usuario
router.get('/funciones/:nombreRol', autenticar ,obtenerFuncionesPorRol);  // Ruta para obtener funciones por rol
router.get('/obtenerRolActual',obtenerRolActual);  // Ruta para obtener el rol actual
router.patch('/actualizarRolActual', actualizarRolActual);  // Ruta para actualizar el rol actual
router.get('/roles-usuario-actual', obtenerRolesUsuarioActual);  
router.get('/usuarios', obtenerUsuarios);   //obtiene toda la informacion de los usuarios 
router.put('/usuario/:idUsuario', actualizarUsuario);  //Actualiza la informacion del usuario
router.get('/roles', obtenerRoles);   //obtiene todos los roles
router.post("/recuperar-codigo", obtenerCodigo);    //Obtener codigo para recuperar la contraseña
router.post("/verificar-codigo", verificarCodigo);  //Verificar codigo recibido

export default router;