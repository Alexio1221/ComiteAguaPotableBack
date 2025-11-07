import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const obtenerDashboard = async (req: Request, res: Response) => {
    try {
        // Total de usuarios activos
        const usuariosTotales = await prisma.usuario.count({
        })

        // Total de reclamos pendientes
        const reclamosPendientes = await prisma.reclamo.count({
            where: { estado: 'PENDIENTE' }
        })

        // Notificaciones o avisos vigentes
        const notificaciones = await prisma.noticiasYAvisos.count({
            where: {
                fechaVigencia: {
                    gte: new Date() // avisos aún vigentes
                }
            }
        })

        // Determinar estado del servicio (ejemplo: si hay avisos activos con palabra "corte")
        const avisoCorte = await prisma.noticiasYAvisos.findFirst({
            where: {
                descripcion: { contains: 'corte', mode: 'insensitive' },
                fechaVigencia: { gte: new Date() }
            },
            orderBy: { fechaPublicacion: 'desc' }
        })

        const servicioActivo = avisoCorte ? 'Interrumpido' : 'Normal'
        const proximoCorte = avisoCorte
            ? new Date(avisoCorte.fechaVigencia).toLocaleDateString('es-BO')
            : 'Sin definir'

        res.json({
            usuariosTotales,
            reclamosPendientes,
            servicioActivo,
            proximoCorte,
            notificaciones
        })
    } catch (error) {
        console.error('Error en obtenerDashboard:', error)
        res.status(500).json({ error: 'Error al obtener estadísticas del dashboard' })
    }
}
