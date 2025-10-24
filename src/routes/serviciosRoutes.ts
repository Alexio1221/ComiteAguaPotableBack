import { Router } from 'express';
import { registrarCategoria, obtenerCategorias, editarCategoria, eliminarCategoria } from '../controllers/config/categoriasController';
import { obtenerMedidoresLectura, registrarLectura, crearLecturasPendientes } from '../controllers/operador/lecturasController'
import { obtenerComprobantesSocio } from '../controllers/cajero/comprobantesController';
import { registrarPago } from '../controllers/cajero/pagosController';
import { autenticar } from '../middlewar/autenticacion';


const router = Router();

router.post('/categorias', registrarCategoria)  //Crea una nuevo categoria
router.get('/categorias', obtenerCategorias)  //Obtiene todas las categorias
router.put('/categoria/:id', editarCategoria)  //Edita la categoria por el id
router.delete('/categoria/:id', eliminarCategoria)  //Elimina la categoria por el 

//Lecturas Operador
router.get('/medidores', crearLecturasPendientes, obtenerMedidoresLectura) //Se usa para obtener los medidores activos para su lectura
router.post('/lecturas', autenticar, registrarLectura)  //Registra una nueva lectura y crea el comprobante asociado


//Comprobantes Cajero
router.get('/comprobantes/:idUsuario', autenticar, obtenerComprobantesSocio);
router.post('/pagos', autenticar, registrarPago);


export default router;