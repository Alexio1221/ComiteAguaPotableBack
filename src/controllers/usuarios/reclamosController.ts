import { Request, Response } from 'express'
import prisma from '../../config/client'
import { RequestConUsuario } from '../../middlewar/autenticacion';

// Obtener todos los reclamos 
export const obtenerReclamos = async (req: Request, res: Response) => {
    try {
        const reclamos = await prisma.reclamo.findMany({
            orderBy: { fechaCreacion: 'desc' },
            include: {
                socio: {
                    select: {
                        nombre: true, // o como tengas el campo en tu tabla de socios
                    },
                },
            },
        })

        // Mapear al formato que espera el frontend
        const data = reclamos.map((r) => ({
            idReclamo: r.idReclamo,
            motivo: r.motivo,
            descripcion: r.descripcion,
            imagenURL: r.imagenURL,
            estado: r.estado,
            fechaCreacion: r.fechaCreacion,
            socioNombre: r.socio?.nombre || 'Desconocido',
        }))

        res.json(data)
    } catch (error) {
        console.error('Error al obtener los reclamos:', error)
        res.status(500).json({ mensaje: 'Error al obtener los reclamos.' })
    }
}

// Obtener todos los reclamos de un socio
export const obtenerReclamosSocio = async (req: RequestConUsuario, res: Response) => {
    try {
        const idSocio = req.user?.idUsuario;

        if (!idSocio) {
            res.status(400).json({ mensaje: 'El ID del socio es obligatorio.' })
            return
        }

        const reclamos = await prisma.reclamo.findMany({
            where: { idSocio: Number(idSocio) },
            orderBy: { fechaCreacion: 'desc' },
        })

        res.status(200).json(reclamos)
    } catch (error) {
        console.error('Error al obtener los reclamos:', error)
        res.status(500).json({ mensaje: 'Error al obtener los reclamos.' })
    }
}

// Crear un nuevo reclamo
export const crearReclamo = async (req: RequestConUsuario, res: Response) => {
    try {
        const idSocio = req.user?.idUsuario;
        const { motivo, descripcion } = req.body

        // Validación de campos obligatorios
        if (!motivo || !descripcion || !idSocio) {
            res.status(400).json({ mensaje: 'Todos los campos obligatorios deben completarse.' })
            return
        }

        // Guardar imagen si existe
        const imagenURL = req.file ? `/uploads/reclamos/${req.file.filename}` : null

        // Crear reclamo
        const nuevoReclamo = await prisma.reclamo.create({
            data: {
                motivo,
                descripcion,
                idSocio: Number(idSocio),
                imagenURL,
            },
        })

        res.status(201).json(nuevoReclamo)
    } catch (error) {
        console.error('Error al crear reclamo:', error)
        res.status(500).json({ mensaje: 'Error al crear el reclamo.' })
    }
}

// estado del reclamo (operador)
export const actualizarReclamo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const { estado } = req.body

        if (!estado) {
            res.status(400).json({ mensaje: 'El estado es obligatorio.' })
            return
        }

        const reclamo = await prisma.reclamo.findUnique({
            where: { idReclamo: Number(id) },
        })

        if (!reclamo) {
            res.status(404).json({ mensaje: 'Reclamo no encontrado.' })
            return
        }

        const actualizado = await prisma.reclamo.update({
            where: { idReclamo: Number(id) },
            data: { estado },
        })

        res.status(200).json(actualizado)
    } catch (error) {
        console.error('Error al actualizar el reclamo:', error)
        res.status(500).json({ mensaje: 'Error al actualizar el reclamo.' })
    }
}
