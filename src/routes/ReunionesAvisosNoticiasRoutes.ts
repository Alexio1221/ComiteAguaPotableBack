import { Router } from 'express'
import { crearAvisoNoticia, obtenerAvisoNoticias, eliminarAvisoNoticia } from '../controllers/ReunionesAvisosNoticias/avisosNoticiasController'
import {cargarAvisosNoticias, cargarDocumentosAsamblea } from '../middlewar/cargarAvisosNoticias' 
import { crearReunion, obtenerReunionesVigentes, eliminarReunion, obtenerReunionesHoy, actualizarEstadoReunion } from '../controllers/ReunionesAvisosNoticias/reunionesController'
import { registrarAsistencia, generarRegistrosAsistencia, obtenerListaDeSocios } from '../controllers/usuarios/asistenciaController';

const router = Router()

// Avisos / Noticias
router.post('/', cargarAvisosNoticias.single('imagen'), crearAvisoNoticia)    //subir aviso o noticia
router.get('/', obtenerAvisoNoticias)              // Listar avisos y noticias vigentes
router.delete('/:id', eliminarAvisoNoticia)    // Eliminar aviso por ID


// Reuniones
router.post('/reunion', cargarDocumentosAsamblea.single('documentoAsamblea'), crearReunion)    //subir reunion
router.get('/reunion', obtenerReunionesVigentes)      // Listar reuniones vigentes
router.get('/reuniones/hoy', obtenerReunionesHoy)      // Listar reuniones de hoy o mas proximo
router.put('/reuniones/:idReunion/estado', actualizarEstadoReunion);  // Actualiza estado de reunion(En proceso o finalizado)
router.delete('/reunion/:id', eliminarReunion)        // Eliminar reunión por ID

//asistencia reuniones usuario
router.post('/asistencia/registrar', registrarAsistencia);  //Registramos la asistencia de cada socio
router.post('/asistencia/generar', generarRegistrosAsistencia);  //Generamos los registros con la reunion en proceso
router.get('/asistencia/datos', obtenerListaDeSocios);   //Obtenemos la lista de los socios de la reunion actual

export default router
