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
                        tarifa:{
                            select:{
                                nombreReunion: true
                            }
                        }
                    }
                },
            },
        });
        res.status(200).json(historialAsistencias);
    } catch (error) {
        console.error('Error al obtener el historial de reuniones:', error);
        res.status(500).json({ mensaje: 'Error al obtener el historial de reuniones.' });
    }
}