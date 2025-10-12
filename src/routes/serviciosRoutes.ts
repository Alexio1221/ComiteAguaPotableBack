import { Router } from 'express';
import { registrarCategoria, obtenerCategorias, editarCategoria, eliminarCategoria } from '../controllers/config/categoriasController';


const router = Router();

router.post('/categorias', registrarCategoria)  //Crea una nuevo categoria
router.get('/categorias', obtenerCategorias)  //Obtiene todas las categorias
router.put('/categoria/:id', editarCategoria)  //Edita la categoria por el id
router.delete('/categoria/:id', eliminarCategoria)  //Elimina la categoria por el id

export default router;