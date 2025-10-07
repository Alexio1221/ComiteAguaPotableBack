import { Request, Response } from 'express'
import prisma from '../../config/client'
import fs from 'fs'
import path from 'path'

// Crear aviso o noticia
export const crearAvisoNoticia = async (req: Request, res: Response) => {
  try {
    const { titulo, descripcion, fechaVigencia } = req.body

    //Validación 
    if (!titulo || !descripcion || !fechaVigencia) {
      res.status(400).json({ message: 'Todos los campos obligatorios deben completarse.' });
      return;
    }

    // Validación de fecha
    const hoy = new Date().toISOString().split('T')[0]
    if (fechaVigencia <= hoy) {
      res.status(400).json({ message: 'La fecha de vigencia debe ser posterior al día actual.' });
      return;
    }

    // Guardar imagen si existe
    const imagen = req.file ? `/uploads/avisosNoticias/${req.file.filename}` : null

    const nuevoAviso = await prisma.noticiasYAvisos.create({
      data: {
        titulo,
        descripcion,
        fechaVigencia: new Date(fechaVigencia),
        imagen,
      },
    })

    res.status(201).json(nuevoAviso);
  } catch (error) {
    console.error('Error al crear aviso:', error)
    res.status(500).json({ message: 'Error al crear el aviso o noticia.' })
  }
}

// Obtener solo avisos y noticias vigentes
export const obtenerAvisoNoticias = async (_req: Request, res: Response) => {
  try {
    const hoy = new Date()

    const avisosVigentes = await prisma.noticiasYAvisos.findMany({
      where: {
        fechaVigencia: {
          gte: hoy, //mayor o igual que
        },
      },
      orderBy: { fechaVigencia: 'asc' }, 
    })

    res.status(200).json(avisosVigentes)
  } catch (error) {
    console.error('Error al obtener avisos vigentes:', error)
    res.status(500).json({ message: 'Error al obtener los avisos o noticias vigentes.' })
  }
}

// Eliminar aviso o noticia
export const eliminarAvisoNoticia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Buscar aviso por ID
    const aviso = await prisma.noticiasYAvisos.findUnique({
      where: { idNoticiaAviso: Number(id) },
    })

    if (!aviso) {
      res.status(404).json({ message: 'Aviso no encontrado.' })
      return
    }

    // Eliminar imagen del servidor si existe
    if (aviso.imagen) {
      const imagenPath = path.join(__dirname, '../../', aviso.imagen)
      fs.unlink(imagenPath, (err) => {
        if (err) console.error('Error al eliminar la imagen:', err)
      })
    }

    // Eliminar aviso de la base de datos
    await prisma.noticiasYAvisos.delete({
      where: { idNoticiaAviso: Number(id) },
    })

    res.status(200).json({ message: 'Aviso eliminado correctamente.' })
  } catch (error) {
    console.error('Error al eliminar aviso:', error)
    res.status(500).json({ message: 'Error al eliminar el aviso o noticia.' })
  }
}