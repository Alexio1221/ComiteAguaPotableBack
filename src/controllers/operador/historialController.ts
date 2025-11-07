import { Request, Response } from 'express'
import prisma from '../../config/client'

// Obtener historial de lecturas con comprobantes
export const obtenerHistorialLecturas = async (req: Request, res: Response) => {
    try {
        const lecturas = await prisma.lectura.findMany({
            orderBy: { fechaLectura: 'desc' },
            include: {
                medidor: {
                    select:
                    {
                        idMedidor: true,
                        socio: {
                            select: {
                                nombre: true,
                                apellidos: true
                            }
                        },
                        ubicacionSocio: {
                            select: {
                                direccion: true
                            }
                        }
                    }
                },
                comprobante: {
                    include: {
                        usuario: { select: { nombre: true } }
                    }
                },
            },
        })

        const data = lecturas.map((l) => ({
            idLectura: l.idLectura,
            idMedidor: l.idMedidor,
            numeroMedidor: l.medidor?.idMedidor || '',
            ubicacionMedidor: l.medidor?.ubicacionSocio?.direccion || '',
            lecturaActual: Number(l.lecturaActual),
            lecturaAnterior: Number(l.lecturaAnterior),
            consumo: Number(l.consumo),
            fechaLectura: l.fechaLectura,
            observaciones: l.observaciones || '',
            estado: l.estado,
            nombreSocio: l.medidor?.socio?.nombre || '',
            apellidosSocio: l.medidor?.socio?.apellidos || '',
            comprobante: l.comprobante
                ? {
                    idComprobante: l.comprobante.idComprobante,
                    montoBasico: Number(l.comprobante.montoBasico),
                    montoAdicional: Number(l.comprobante.montoAdicional),
                    moraAcumulada: Number(l.comprobante.moraAcumulada),
                    totalPagar: Number(l.comprobante.totalPagar),
                    estadoPago: l.comprobante.estadoPago,
                    fechaEmision: l.comprobante.fechaEmision,
                    fechaLimite: l.comprobante.fechaLimite,
                    operadorNombre: l.comprobante.usuario?.nombre || 'Desconocido',
                }
                : null,
        }))

        res.json(data)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error al obtener el historial de lecturas' })
    }
}
