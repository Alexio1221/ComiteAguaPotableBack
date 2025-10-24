import { Request, Response } from 'express';
import prisma from '../../config/client';

export const registrarPago = async (req: Request, res: Response) => {
    try {
        const { comprobantes } = req.body;

        if (!comprobantes?.length) {
            res.status(400).json({ mensaje: "No se enviaron comprobantes para pagar" });
            return
        }

        // Obtener el total a pagar sumando los comprobantes
        const comprobantesData = await prisma.comprobante.findMany({
            where: { idComprobante: { in: comprobantes } },
            select: { totalPagar: true },
        });

        if (comprobantesData.length === 0) {
            res.status(404).json({ mensaje: "No se encontraron los comprobantes" });
            return
        }

        console.log(comprobantesData);


        const montoTotal = comprobantesData.reduce(
            (sumaAcumulada, comprobante) => sumaAcumulada + Number(comprobante.totalPagar),
            0
        );

        // Crear el registro de pago
        const nuevoPago = await prisma.pago.create({
            data: {
                montoPagado: montoTotal,
            },
        });

        // Actualizar los comprobantes y asociarlos al pago
        await prisma.comprobante.updateMany({
            where: { idComprobante: { in: comprobantes } },
            data: {
                idPago: nuevoPago.idPago,
                estadoPago: "PAGADO",
            },
        });

        res.json({
            mensaje: "Pago registrado con éxito",
            idPago: nuevoPago.idPago,
            montoPagado: montoTotal,
        });
    } catch (error) {
        console.error("Error al registrar pago:", error);
        res.status(500).json({ mensaje: "Error interno del servidor" });
    }
};
