import { Router } from 'express'
import { crearAvisoNoticia, obtenerAvisoNoticias, eliminarAvisoNoticia } from '../controllers/avisosNoticias/avisosNoticiasController'
import cargarAvisosNoticias from '../middlewar/cargarAvisosNoticias' // nombre corregido

const router = Router()

// Crear nuevo aviso con imagen
router.post('/', cargarAvisosNoticias.single('imagen'), crearAvisoNoticia)

// Obtener todos los avisos
router.get('/', obtenerAvisoNoticias)

// Eliminar aviso por ID
router.delete('/:id', eliminarAvisoNoticia)

export default router
