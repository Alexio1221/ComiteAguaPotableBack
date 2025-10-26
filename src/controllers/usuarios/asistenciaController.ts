import { Request, Response } from 'express';
import prisma from '../../config/client';

export const registrarAsistencia = async (req: Request, res: Response) => {
    try {
        const { idReunion, idUsuario, estado, observacion } = req.body;

        if (!idReunion || !idUsuario || !estado) {
            res.status(400).json({ mensaje: 'Faltan datos requeridos' });
            return
        }

        const usuarioRegistradoHoy = await prisma.asistencia.findFirst({
            where: {
                idReunion: Number(idReunion),
                idUsuario: Number(idUsuario),
                NOT: {
                    estado: 'AUSENTE', // cualquier estado distinto de AUSENTE
                },
            },
        })

        if (usuarioRegistradoHoy) {
            res.status(404).json({ mensaje: 'Ya esta registrado' });
            return
        }

        const asistencia = await prisma.asistencia.update({
            where: {
                idReunion_idUsuario: {
                    idReunion: Number(idReunion),
                    idUsuario: Number(idUsuario),
                },
            },
            data: {
                estado,
                registradoEn: new Date(),
                observacion: observacion || null,
            },
        });

        res.json({ mensaje: 'Asistencia registrada con éxito' });
    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2025') {
            res.status(404).json({ mensaje: 'No se encontró el registro de asistencia' });
            return
        }
        res.status(500).json({ mensaje: 'Error al registrar asistencia', error });
    }
};

// Crea registros de asistencia para todos los usuarios para la reunion que esta EN_PROCESO
export const generarRegistrosAsistencia = async (req: Request, res: Response) => {
    try {
        const reunion = await prisma.reunion.findFirst({
            where: { estado: 'EN_PROCESO' },
            orderBy: { fechaReunion: 'desc' },
        });

        if (!reunion) {
            res.status(404).json({ mensaje: 'No hay ninguna reunión en proceso' });
            return
        }

        const usuarios = await prisma.usuario.findMany({
            select: { idUsuario: true },
        });

        await prisma.asistencia.createMany({
            data: usuarios.map(u => ({
                idReunion: reunion.idReunion,
                idUsuario: u.idUsuario,
                registradoEn: new Date(),
            })),
            skipDuplicates: true, //evita error si ya existen combinaciones en la clave compuesta
        });

        res.status(201).json({ mensaje: 'Registros de asistencia generados correctamente.' });
    } catch (error) {
        console.error('Error al generar asistencias:', error);
        res.status(500).json({ mensaje: 'Error al generar registros de asistencia' });
    }
};

