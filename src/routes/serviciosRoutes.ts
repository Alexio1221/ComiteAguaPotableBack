import { Router } from 'express';
import { registrarCategoria, obtenerCategorias, editarCategoria, eliminarCategoria } from '../controllers/config/categoriasController';
import { obtenerMedidoresLectura, registrarLectura, crearLecturasPendientes } from '../controllers/operador/lecturasController'
import { obtenerComprobantesSocio } from '../controllers/cajero/comprobantesController';
import { registrarPago, obtenerHistorialPagos, generarReportePago } from '../controllers/cajero/pagosController';
import { obtenerTarifasReuniones, crearTarifaReunion, actualizarTarifaReunion, eliminarTarifaReunion} from '../controllers/ReunionesAvisosNoticias/tarifaReunionController';
import { generarReportePagosAsistencia } from '../controllers/cajero/pagosAsistenciaController';
import { autenticar } from '../middlewar/autenticacion';


const router = Router();

//Categorias
router.post('/categorias', registrarCategoria)  //Crea una nuevo categoria
router.get('/categorias', obtenerCategorias)  //Obtiene todas las categorias
router.put('/categoria/:id', editarCategoria)  //Edita la categoria por el id
router.delete('/categoria/:id', eliminarCategoria)  //Elimina la categoria por el 

//Lecturas Operador
router.get('/medidores', crearLecturasPendientes, obtenerMedidoresLectura) //Se usa para obtener los medidores activos para su lectura
router.post('/lecturas', autenticar, registrarLectura)  //Registra una nueva lectura y crea el comprobante asociado


//Comprobantes Cajero
router.get('/comprobantes/:idUsuario', autenticar, obtenerComprobantesSocio);  //Obtiene los comprobantes por socio
router.get('/historial-pagos', obtenerHistorialPagos);  //Se usa para que el cajero obtenga el historial de pagos
router.post('/pagos', autenticar, registrarPago);

//Reportes
router.post('/pagos-reporte', generarReportePago)  //Genera un archivo pdf para enviarlo al frontend reporte de comprobantes
router.post('/pagos-asistencia', generarReportePagosAsistencia)   //Reportes de asistencias


//Tarifas Reunion
router.get('/tarifas-reunion', autenticar, obtenerTarifasReuniones)  //obtiene todas las tarifas con sus datos para las reuniones
router.post('/tarifa', autenticar, crearTarifaReunion)
router.put('/tarifa/:id', autenticar, actualizarTarifaReunion)
router.delete('/tarifa/:id', autenticar, eliminarTarifaReunion)

export default router;