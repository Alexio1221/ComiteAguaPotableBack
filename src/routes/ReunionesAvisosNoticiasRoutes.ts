import { Router } from 'express'
import { crearAvisoNoticia, obtenerAvisoNoticias, eliminarAvisoNoticia } from '../controllers/ReunionesAvisosNoticias/avisosNoticiasController'
import {cargarAvisosNoticias, cargarDocumentosAsamblea } from '../middlewar/cargarAvisosNoticias' 
import { crearReunion, obtenerReunionesVigentes, eliminarReunion} from '../controllers/ReunionesAvisosNoticias/reunionesController'

const router = Router()

// Avisos / Noticias
router.post('/', cargarAvisosNoticias.single('imagen'), crearAvisoNoticia)    //subir aviso o noticia
router.get('/', obtenerAvisoNoticias)              // Listar avisos y noticias vigentes
router.delete('/:id', eliminarAvisoNoticia)    // Eliminar aviso por ID


// Reuniones
router.post('/reunion', cargarDocumentosAsamblea.single('documentoAsamblea'), crearReunion)    //subir reunion
router.get('/reunion', obtenerReunionesVigentes)      // Listar reuniones vigentes
router.delete('/reunion/:id', eliminarReunion)        // Eliminar reunión por ID

export default router
