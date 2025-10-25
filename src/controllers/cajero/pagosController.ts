import { Request, Response } from 'express';
import prisma from '../../config/client';
import { generarComprobantePDF } from '../../utils/generarComprobantes';

export const registrarPago = async (req: Request, res: Response) => {
    try {
        const { comprobantes } = req.body;

        if (!comprobantes?.length) {
            return res.status(400).json({ mensaje: "No se enviaron comprobantes para pagar" });
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
            return res.status(404).json({ mensaje: "No se encontraron los comprobantes" });
        }

        // Calcular monto total
        const montoTotal = comprobantesData.reduce(
            (suma, c) => suma + Number(c.totalPagar),
            0
        );

        // Crear registro de pago
        const nuevoPago = await prisma.pago.create({
            data: { montoPagado: montoTotal },
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

        return res.json({
            mensaje: "Pago registrado con éxito",
            rutaComprobante: pdfPath
        });

    } catch (error) {
        console.error("Error al registrar pago:", error);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
};
