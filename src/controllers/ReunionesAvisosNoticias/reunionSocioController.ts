import { Request, Response, NextFunction } from 'express'
import prisma from '../../config/client'
import { RequestConUsuario } from '../../middlewar/autenticacion';

export const obtenerHistorialReuniones = async (req: RequestConUsuario, res: Response) => {
    try {
        const socio = req.user?.idUsuario;
        const historialAsistencias = await prisma.asistencia.findMany({
            where: {
                idUsuario: socio,
            },
            select: {
                idReunion: true,
                estado: true,
                registradoEn: true,
                observacion: true,
                reunion: {
                    select: {
                        fechaReunion: true,
                        lugar: true,
                        motivo: true,
                        descripcion: true,
                        estado: true,
                        documentoAsamblea: true,
                        tarifa: {
                            select: {
                                nombreReunion: true
                            }
                        }
                    }
                },
            },
        });

        const datosFormateado = historialAsistencias.map(historialAsistencia => ({
            idReunion: historialAsistencia.idReunion,
            estadoAsistencia: historialAsistencia.estado,
            registradoEn: historialAsistencia.registradoEn,
            observacion: historialAsistencia.observacion,
            tipoReunion: historialAsistencia.reunion.tarifa.nombreReunion,
            fechaReunion: historialAsistencia.reunion.fechaReunion,
            lugar: historialAsistencia.reunion.lugar,
            motivo: historialAsistencia.reunion.motivo,
            descripcion: historialAsistencia.reunion.descripcion,
            estadoReunion: historialAsistencia.reunion.estado,
            documentoAsamblea: historialAsistencia.reunion.documentoAsamblea,
        }));

        res.status(200).json(datosFormateado);
    } catch (error) {
        console.error('Error al obtener el historial de reuniones:', error);
        res.status(500).json({ mensaje: 'Error al obtener el historial de reuniones.' });
    }
}