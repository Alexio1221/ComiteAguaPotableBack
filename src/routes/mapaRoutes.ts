import { Router } from 'express'

import {obtenerUbicacionesMedidores, obtenerMedidores, crearMedidor, actualizarMedidor} from '../controllers/mapa/medidoresController'
import {obtenerFiguras, crearFigura, actualizarFigura, eliminarFigura} from '../controllers/mapa/mapaController'

const router = Router()

//Mapa Interactivo
router.get("/", obtenerFiguras);
router.post("/", crearFigura);
router.put("/:idFigura", actualizarFigura);
router.delete("/:idFigura", eliminarFigura);


//Medidores
router.get('/ubicaciones/:idMedidorActual', obtenerUbicacionesMedidores)
router.get('/medidores', obtenerMedidores)
router.post('/medidores', crearMedidor)
router.put('/medidor/:idMedidor', actualizarMedidor)

export default router
