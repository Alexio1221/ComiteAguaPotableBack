import { Request, Response } from 'express'
import prisma from '../../config/client'

// Obtener todas las categorías
export const obtenerCategorias = async (_req: Request, res: Response) => {
  try {
    const categorias = await prisma.categoria.findMany({
      select: {
        idCategoria: true,
        tipo: true, 
      },
    })
    //Renombramos tipo por nombre para el front
    const categoriasFormateadas = categorias.map(c => ({
      idCategoria: c.idCategoria,
      nombre: c.tipo,
    }))

    res.status(200).json(categoriasFormateadas)
  } catch (error) {
    console.error('Error al obtener categorías:', error)
    res.status(500).json({
      mensaje: 'Error al obtener categorías',
    })
  }
}
