import { Request, Response } from 'express'
import prisma from '../../config/client'

export const obtenerTarifasReuniones = async (_req: Request, res: Response) => {
    try {
        const tarifas = await prisma.tarifaReunion.findMany();
        res.status(200).json(tarifas);
    } catch (error) {
        console.error('Error al obtener tarifas de reuniones:', error);
        res.status(500).json({ mensaje: 'Error al obtener las tarifas de reuniones.' });
    }
}