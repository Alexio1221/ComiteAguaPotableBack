import { Request, Response } from 'express'
import prisma from '../../config/client'
import { Prisma } from '@prisma/client';

// Obtiene todas las tarifas
export const obtenerTarifasReuniones = async (_req: Request, res: Response) => {
    try {
        const tarifas = await prisma.tarifaReunion.findMany({
            orderBy: {
                idTarifaReunion: 'asc',
            },
        })
        res.status(200).json(tarifas);
    } catch (error) {
        console.error('Error al obtener tarifas de reuniones:', error);
        res.status(500).json({ mensaje: 'Error al obtener las tarifas de reuniones.' });
    }
}

// Crear una nueva tarifa de reunión
export const crearTarifaReunion = async (req: Request, res: Response) => {
    try {
        const { nombreReunion, ausente, retraso } = req.body

        if (!nombreReunion) {
            res.status(400).json({ mensaje: 'Todos los campos son obligatorios' })
            return
        }
        if (ausente <= 0 || retraso <= 0) {
            res.status(400).json({ mensaje: 'Las tarifas deben ser mayores a cero' })
            return
        }

        const nuevaTarifa = await prisma.tarifaReunion.create({
            data: {
                nombreReunion,
                ausente: new Prisma.Decimal(ausente),
                retraso: new Prisma.Decimal(retraso),
                fechaActualizacion: new Date(),
            },
        })

        res.status(201).json({
            mensaje: 'Tarifa registrada correctamente',
            nuevaTarifa,
        })
    } catch (error) {
        console.error('Error al crear tarifa:', error)
        res.status(500).json({ mensaje: 'Error al crear la tarifa de reunión' })
    }
}

// Actualizar una tarifa existente
export const actualizarTarifaReunion = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const { nombreReunion, ausente, retraso } = req.body

        if (!nombreReunion || !id) {
            res.status(400).json({ mensaje: 'Todos los campos son obligatorios' })
            return
        }
        if (ausente <= 0 || retraso <= 0) {
            res.status(400).json({ mensaje: 'Las tarifas deben ser mayores a cero' })
            return
        }

        const existente = await prisma.tarifaReunion.findUnique({
            where: { idTarifaReunion: Number(id) },
        })

        if (!existente) {
            res.status(404).json({ mensaje: 'Tarifa no encontrada' })
            return
        }

        const actualizada = await prisma.tarifaReunion.update({
            where: { idTarifaReunion: Number(id) },
            data: {
                nombreReunion,
                ausente: new Prisma.Decimal(ausente),
                retraso: new Prisma.Decimal(retraso),
                fechaActualizacion: new Date(),
            },
        })

        res.json({
            mensaje: 'Tarifa actualizada correctamente',
            actualizada,
        })
    } catch (error) {
        console.error('Error al actualizar tarifa:', error)
        res.status(500).json({ mensaje: 'Error al actualizar la tarifa de reunión' })
    }
}

// Eliminar una tarifa
export const eliminarTarifaReunion = async (req: Request, res: Response) => {
    try {
        const { id } = req.params

        if (!id) {
            res.status(400).json({ mensaje: 'No se encontro la tarifa' })
            return
        }
        const existente = await prisma.tarifaReunion.findUnique({
            where: { idTarifaReunion: Number(id) },
        })

        if (!existente) {
            res.status(404).json({ mensaje: 'Tarifa no encontrada' })
            return
        }

        await prisma.tarifaReunion.delete({
            where: { idTarifaReunion: Number(id) },
        })

        res.json({ mensaje: 'Tarifa eliminada correctamente' })
    } catch (error: any) {
        console.error('Error al eliminar tarifa:', error)
        if (error.code === 'P2025') {
            res.status(404).json({ mensaje: 'Tarifa no encontrada' })
            return
        }
        if (error.code === 'P2003') {
            res.status(400).json({
                mensaje: 'No se puede eliminar esta tarifa porque está asociada a una reunión existente.',
            })
            return
        }

        res.status(500).json({ mensaje: 'Error al eliminar la tarifa de reunión' })
    }
}