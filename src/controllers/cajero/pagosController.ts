import { Request, Response } from 'express';
import prisma from '../../config/client';
import { generarComprobantePDF } from '../../utils/generarComprobantes';
import { RequestConUsuario } from '../../middlewar/autenticacion';

export const obtenerHistorialPagos = async (req: Request, res: Response) => {
    try {
        const pagos = await prisma.pago.findMany({
            include: {
                cajero: {
                    select: {
                        idUsuario: true,
                        nombre: true,
                        apellidos: true
                    }
                },
                comprobantes: {
                    select: {
                        idComprobante: true,
                        fechaEmision: true,
                        montoBasico: true,
                        montoAdicional: true,
                        moraAcumulada: true,
                        totalPagar: true,
                        estadoPago: true,
                        fechaLimite: true,
                        lectura: {
                            select: {
                                idLectura: true,
                                lecturaActual: true,
                                lecturaAnterior: true,
                                consumo: true,
                                fechaLectura: true,
                                observaciones: true,
                                medidor: {
                                    select: {
                                        idMedidor: true,
                                        socio: {
                                            select: {
                                                idUsuario: true,
                                                nombre: true,
                                                apellidos: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { fechaPago: 'desc' }
        });

        res.json(pagos);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ mensaje: 'Error al obtener historial de pagos' });
    }
}

export const registrarPago = async (req: RequestConUsuario, res: Response) => {
    try {
        const { comprobantes } = req.body;
        const cajero = req.user?.idUsuario;

        if (!comprobantes?.length) {
            res.status(400).json({ mensaje: "No se enviaron comprobantes para pagar" });
            return
        }

        if (!cajero) {
            res.status(401).json({ mensaje: 'No autorizado. Inicie sesión nuevamente.' });
            return;
        }

        const comprobantesData = await prisma.comprobante.findMany({
            where: { idComprobante: { in: comprobantes } },
            include: {
                lectura: {
                    select: {
                        medidor: {
                            select: {
                                idMedidor: true,
                                ubicacionSocio: { select: { direccion: true } }
                            }
                        }
                    }
                }
            }
        });

        if (comprobantesData.length === 0) {
            res.status(404).json({ mensaje: "No se encontraron los comprobantes" });
            return
        }

        // Calcular monto total
        const montoTotal = comprobantesData.reduce(
            (suma, c) => suma + Number(c.totalPagar),
            0
        );

        // Crear registro de pago
        const nuevoPago = await prisma.pago.create({
            data: { montoPagado: montoTotal, idCajero: cajero },
        });

        // Actualizar los comprobantes como PAGADO y asociarlos al pago
        await prisma.comprobante.updateMany({
            where: { idComprobante: { in: comprobantes } },
            data: {
                idPago: nuevoPago.idPago,
                estadoPago: "PAGADO",
            },
        });

        // Generar PDF con datos completos
        const pdfPath = generarComprobantePDF({
            idPago: nuevoPago.idPago,
            fechaPago: nuevoPago.fechaPago,
            montoPagado: montoTotal,
            comprobantesPagados: comprobantesData.map(c => ({
                idComprobante: c.idComprobante,
                montoBasico: Number(c.montoBasico),
                montoAdicional: Number(c.montoAdicional),
                moraAcumulada: Number(c.moraAcumulada),
                totalPagar: Number(c.totalPagar),
                idMedidor: c.lectura?.medidor?.idMedidor || 0,
                direccion: c.lectura?.medidor?.ubicacionSocio?.direccion,
                fechaEmision: c.fechaEmision,
                fechaLimite: c.fechaLimite,
            }))
        });

        await prisma.pago.update({
            where: { idPago: nuevoPago.idPago },
            data: { comprobanteArchivo: pdfPath },
        });

        res.json({
            mensaje: "Pago registrado con éxito",
            rutaComprobante: pdfPath
        });

    } catch (error) {
        console.error("Error al registrar pago:", error);
        res.status(500).json({ mensaje: "Error interno del servidor" });
    }
};
