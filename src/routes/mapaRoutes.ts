import { Router } from 'express'

import {obtenerUbicacionesMedidores, obtenerMedidores, crearMedidor} from '../controllers/mapa/medidoresController'


const router = Router()

router.get('/ubicaciones' , obtenerUbicacionesMedidores )
router.get('/medidores', obtenerMedidores)
router.post('/medidores', crearMedidor)

export default router
