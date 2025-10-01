// routes/noticiasRoutes.ts
import { Router } from 'express';
import cargarNoticias from '../middlewar/cargarNoticias';
//import { createNoticia, obtenerNoticias } from '../controllers/noticiasController';

const router = Router();
//router.post('/', cargarNoticias.single('imagen'), createNoticia);
//router.get('/', obtenerNoticias);
export default router;
