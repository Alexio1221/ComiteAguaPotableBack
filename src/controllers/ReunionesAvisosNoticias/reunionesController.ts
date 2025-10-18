import { Request, Response } from 'express'
import prisma from '../../config/client'
import fs from 'fs'
import path from 'path'

// Crear una reunión
export const crearReunion = async (req: Request, res: Response) => {
    try {
        const { tipo, fecha, hora, lugar, motivo, descripcion } = req.body
        const documentoAsamblea = req.file ? `/uploads/asambleas/${req.file.filename}` : null

        if (!tipo || !fecha || !hora || !lugar || !motivo || !descripcion) {
            res.status(400).json({ message: 'Todos los campos obligatorios deben completarse.' });
            return;
        }
        // Validación de fecha
        const hoy = new Date().toISOString().split('T')[0]
        if (fecha < hoy) {
            res.status(400).json({ mensaje: 'No se pueden crear reuniones para hoy después de las 20:00' });
            return;
        }

        const fechaYhora = new Date(fecha)
        const [horaNum, minutoNum] = hora.split(':').map(Number);
        fechaYhora.setHours(horaNum, minutoNum, 0, 0);

        const nuevaReunion = await prisma.reunion.create({
            data: {
                tipo,
                fecha: fechaYhora,
                hora,
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

// Obtener reuniones vigentes (fecha >= hoy)
export const obtenerReunionesVigentes = async (_req: Request, res: Response) => {
    try {
        const hoy = new Date();
        hoy.setUTCHours(0, 0, 0, 0); // medianoche UTC
        //console.log("Local:", hoy.toString());  horario utc-4 bolivia
        //console.log("UTC:", hoy.toISOString());   horario gloval utc
        const reuniones = await prisma.reunion.findMany({
            where: { fecha: { gte: hoy } },
            orderBy: [
                { fecha: 'asc' },
                { hora: 'asc' }
            ],
        })

        res.status(200).json(reuniones)
    } catch (error) {
        console.error('Error al obtener reuniones:', error)
        res.status(500).json({ message: 'Error al obtener las reuniones vigentes.' })
    }
}

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
