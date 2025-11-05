import { Request, Response } from 'express'
import prisma from '../../config/client'
import fs from 'fs'
import path from 'path'

// Crear una reunión
export const crearReunion = async (req: Request, res: Response) => {
    try {
        const { tipoReunion, fecha, hora, lugar, motivo, descripcion } = req.body
        const documentoAsamblea = req.file ? `/uploads/asambleas/${req.file.filename}` : null
        if (!tipoReunion || !fecha || !hora || !lugar || !motivo || !descripcion) {
            res.status(400).json({ message: 'Todos los campos obligatorios deben completarse.' });
            return;
        }
        const [h, m] = hora.split(':').map(Number)
        const fechaReunion = new Date(fecha)
        fechaReunion.setUTCHours(23, 59, 59) //final del dia utc
        fechaReunion.setHours(h, m, 0)  //ponemos la hora en la fecha utc

        const hoy = new Date()

        if (fechaReunion.getTime() < hoy.getTime()) {
            res.status(400).json({ mensaje: 'La hora seleccionada ya ha pasado. Selecciona una fecha y hora posteriores a la actual.' });
            return;
        }

        const inicioDelDia = new Date(fecha)
        inicioDelDia.setUTCHours(4, 0, 1, 0) // sumamos 4 hora para bolivia

        const finDelDia = new Date(fecha)
        finDelDia.setUTCHours(27, 59, 59)  //sumamos 4 hora para bolivia


        const buscarReunion = await prisma.reunion.findFirst({
            where: {
                fechaReunion: {
                    gte: inicioDelDia,
                    lte: finDelDia,
                },
            },
        })

        if (buscarReunion) {
            res.status(400).json({
                mensaje: 'Ya existe una reunión registrada para ese día.',
            })
            return
        }

        const nuevaReunion = await prisma.reunion.create({
            data: {
                tipoReunion: Number(tipoReunion),
                fechaReunion,
                lugar,
                motivo,
                descripcion,
                documentoAsamblea,
            },
        })

        res.status(201).json(nuevaReunion)
    } catch (error) {
        console.error('Error al crear la reunión:', error)
        res.status(500).json({ message: 'Error al crear la reunión.' })
    }
}

export const obtenerReunionesVigentes = async (_req: Request, res: Response) => {
    try {
        const reuniones = await prisma.reunion.findMany({
            where: {
                estado: {
                    in: ['PENDIENTE', 'EN_PROCESO'],
                },
            },
            select: {
                idReunion: true,
                tipoReunion: true,
                fechaReunion: true,
                lugar: true,
                motivo: true,
                descripcion: true,
                tarifa: {
                    select: {
                        nombreReunion: true
                    }
                }
            },
            orderBy: { fechaReunion: 'asc' },
        });

        const datosFormateados = reuniones.map(reunion => ({
            idReunion: reunion.idReunion,
            tipoReunion: reunion.tipoReunion,
            nombreReunion: reunion.tarifa.nombreReunion,
            fechaReunion: reunion.fechaReunion,
            lugar: reunion.lugar,
            motivo: reunion.motivo,
            descripcion: reunion.descripcion
        }))

        res.status(200).json(datosFormateados);
    } catch (error) {
        console.error('Error al obtener reuniones vigentes:', error);
        res.status(500).json({ mensaje: 'Error al obtener las reuniones vigentes.' });
    }
};

// Eliminar reunión
export const eliminarReunion = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const reunion = await prisma.reunion.findUnique({ where: { idReunion: Number(id) } })

        if (!reunion) {
            res.status(404).json({ message: 'Reunión no encontrada.' })
            return
        }

        // Eliminar documento si existe
        if (reunion.documentoAsamblea) {
            const docPath = path.join(__dirname, '../../../', reunion.documentoAsamblea)
            fs.unlink(docPath, err => {
                if (err) console.error('Error al eliminar el documento:', err)
            })
        }

        await prisma.reunion.delete({ where: { idReunion: Number(id) } })
        res.status(200).json({ message: 'Reunión eliminada correctamente.' })
    } catch (error) {
        console.error('Error al eliminar reunión:', error)
        res.status(500).json({ message: 'Error al eliminar la reunión.' })
    }
}

// Obtener reuniones de hoy o la más próxima
export const obtenerReunionesHoy = async (_req: Request, res: Response) => {
    try {
        // Fecha actual (hora local Bolivia, UTC-4)
        const ahora = new Date().toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' })
        const inicioHoy = new Date(ahora)
        inicioHoy.setUTCHours(4, 0, 1, 0)  //Sumamos 4 horas la hora de utc

        const finHoy = new Date(ahora)
        finHoy.setUTCHours(27, 59, 59)  //igual que antes 

        // Buscar reuniones que sean hoy
        const reunionesHoy = await prisma.reunion.findMany({
            where: {
                fechaReunion: {
                    gte: inicioHoy,
                    lte: finHoy,
                },
            },
            orderBy: [
                { fechaReunion: 'asc' },
            ],
        });

        // Si hay reuniones hoy, devolverlas
        if (reunionesHoy.length > 0) {
            res.status(200).json({
                tipo: 'hoy',
                reuniones: reunionesHoy,
            });
            return;
        }

        // Si no hay reuniones hoy, buscar la más próxima
        const proxima = await prisma.reunion.findFirst({
            where: { fechaReunion: { gt: finHoy } },
            orderBy: [
                { fechaReunion: 'asc' }
            ],
        });

        if (proxima) {
            res.status(200).json({
                tipo: 'proxima',
                reuniones: [proxima],
            });
        } else {
            res.status(200).json({
                tipo: 'ninguna',
                reuniones: [],
            });
        }
    } catch (error) {
        console.error('Error al obtener reuniones de hoy:', error);
        res.status(500).json({ message: 'Error al obtener las reuniones de hoy o la próxima.' });
    }
};

export const actualizarEstadoReunion = async (req: Request, res: Response) => {
    try {
        const { idReunion } = req.params;
        const { estado } = req.body;

        const reunion = await prisma.reunion.update({
            where: { idReunion: Number(idReunion) },
            data: { estado },
        });

        res.json({ mensaje: 'Reunion actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({ mensaje: 'Error al actualizar el estado de la reunión' });
    }
};

