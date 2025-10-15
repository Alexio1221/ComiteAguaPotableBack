import { Router } from 'express'

import {obtenerUbicacionesMedidores, obtenerMedidores, crearMedidor, actualizarMedidor} from '../controllers/mapa/medidoresController'


const router = Router()

router.get('/ubicaciones/:idMedidorActual', obtenerUbicacionesMedidores)
router.get('/medidores', obtenerMedidores)
router.post('/medidores', crearMedidor)
router.put('/medidor/:idMedidor', actualizarMedidor)

export default router
