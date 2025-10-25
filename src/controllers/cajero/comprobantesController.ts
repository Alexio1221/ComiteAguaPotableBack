import { Request, Response } from 'express';
import prisma from '../../config/client';

export const obtenerComprobantesSocio = async (req: Request, res: Response) => {
    try {
        const { idUsuario } = req.params;

        if (!idUsuario) {
            res.status(400).json({ mensaje: 'Falta el parámetro idUsuario' });
            return
        }

        // Buscar comprobantes del socio a través de la relación: Usuario → Medidor → Lectura → Comprobante
        const comprobantes = await prisma.comprobante.findMany({
            where: {
                estadoPago: "PENDIENTE",
                lectura: {
                    medidor: {
                        socio: {
                            idUsuario: Number(idUsuario),
                        },
                    },
                },
            },
            select: {
                idComprobante: true,
                montoBasico: true,
                montoAdicional: true,
                moraAcumulada: true,
                totalPagar: true,
                fechaEmision: true,
                fechaLimite: true,
                estadoPago: true,
                idOperador: true,
                idLectura: true,
                lectura: {
                    select: {
                        medidor: {
                            select: {
                                idMedidor: true,
                                ubicacionSocio: {
                                    select: {
                                        direccion: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                fechaEmision: 'asc',
            },
        });

        if (!comprobantes.length) {
            res.status(404).json({ mensaje: 'No se encontraron comprobantes para este socio' });
            return
        }

        res.json({
            comprobantes: comprobantes.map(c => ({
                ...c,
                montoBasico: Number(c.montoBasico),
                montoAdicional: Number(c.montoAdicional),
                moraAcumulada: Number(c.moraAcumulada),
                totalPagar: Number(c.totalPagar),
            })),
        });
    } catch (error) {
        console.error('Error al obtener comprobantes del socio:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};
