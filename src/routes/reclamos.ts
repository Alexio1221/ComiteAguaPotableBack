import { Router } from 'express';
import multer from 'multer'
const upload = multer({ dest: 'uploads/reclamos/' })
const router = Router();

import { autenticar } from '../middlewar/autenticacion';
import { obtenerReclamos, crearReclamo, actualizarReclamo, obtenerReclamosSocio } from '../controllers/usuarios/reclamosController';

router.get('/', autenticar, obtenerReclamos)      //Obtiene todos los reclamos
router.get('/reclamos', autenticar, obtenerReclamosSocio)               //Ovtiene los reclamos por socio
router.post('/nuevo-reclamo', upload.single('imagen'), autenticar, crearReclamo)
router.put('/:id', autenticar, actualizarReclamo)


export default router;