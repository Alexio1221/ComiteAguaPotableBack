import { Request, Response } from 'express'
import prisma from '../../config/client'
import { Prisma } from '@prisma/client'

// Crear una nueva categoría
export const registrarCategoria = async (req: Request, res: Response) => {
  try {
    const { tipo, tarifa, tarifaAdicional, limiteBasico, descripcion } = req.body

    // Validar que los campos requeridos estén presentes
    if (!tipo || tarifa === undefined || tarifaAdicional === undefined || limiteBasico === undefined || !descripcion) {
      res.status(400).json({ mensaje: 'Todos los campos son obligatorios' })
      return
    }

    const nuevaCategoria = await prisma.categoria.create({
      data: {
        tipo,
        tarifa: new Prisma.Decimal(tarifa),
        tarifaAdicional: new Prisma.Decimal(tarifaAdicional),
        limiteBasico: new Prisma.Decimal(limiteBasico),
        descripcion,
      },
    })

    res.status(201).json({
      mensaje: 'Categoría registrada correctamente'
    })
  } catch (error) {
    //console.error('Error al registrar la categoría:', error)
    res.status(500).json({
      mensaje: 'Error al registrar la categoría',
    })
  }
}

// Obtener todas las categorías
export const obtenerCategorias = async (_req: Request, res: Response) => {
  try {
    const categorias = await prisma.categoria.findMany()

    const categoriasFormateadas = categorias.map((cat) => ({
      ...cat,
      tarifa: Number(cat.tarifa),
      tarifaAdicional: Number(cat.tarifaAdicional),
      limiteBasico: Number(cat.limiteBasico),
    }))

    res.status(200).json(categoriasFormateadas)
  } catch (error) {
    console.error('Error al obtener categorías:', error)
    res.status(500).json({
      mensaje: 'Error al obtener categorías',
    })
  }
}

//Editar categoria
export const editarCategoria = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tipo, tarifa, tarifaAdicional, limiteBasico, descripcion } = req.body;

    if (!id) {
      res.status(400).json({ mensaje: 'El ID de la categoría es requerido' });
      return;
    }

    const categoriaActualizada = await prisma.categoria.update({
      where: { idCategoria: Number(id) },
      data: {
        tipo,
        tarifa,
        tarifaAdicional,
        limiteBasico,
        descripcion,
      },
    });

    res.status(200).json({ mensaje: 'Categoría actualizada correctamente', categoria: categoriaActualizada });
  } catch (error: any) {
    console.error('Error al editar la categoría:', error);

    if (error.code === 'P2025') {
      res.status(404).json({ mensaje: 'Categoría no encontrada' });
      return;
    }

    res.status(500).json({ mensaje: 'Error al editar la categoría' });
  }
};

// Eliminar categoría
export const eliminarCategoria = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!id) {
      res.status(400).json({ mensaje: 'El ID de la categoría es requerido' })
      return
    }

    await prisma.categoria.delete({
      where: { idCategoria: Number(id) },
    })

    res.status(200).json({ mensaje: 'Categoría eliminada correctamente' })
  } catch (error: any) {
    console.error('Error al eliminar la categoría:', error)
    if (error.code === 'P2025') {
      res.status(404).json({ mensaje: 'Categoría no encontrada' })
      return
    }
    res.status(500).json({ mensaje: 'Error al eliminar la categoría' })
  }
}