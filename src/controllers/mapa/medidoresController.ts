import { Request, Response } from 'express'
import prisma from '../../config/client'

// Obtener todos los medidores con socio y su ubicación
export const obtenerUbicacionesMedidores = async (req: Request, res: Response) => {
  const idMedidorActual = Number(req.params.idMedidorActual)
  console.log(idMedidorActual)
  try {
    const medidores = await prisma.medidor.findMany({
      where: idMedidorActual
        ? { idMedidor: { not: Number(idMedidorActual) } }
        : undefined,
      select: {
        idMedidor: true,
        socio: { select: { nombre: true, apellidos: true } },
        ubicacionSocio: { select: { direccion: true, latitud: true, longitud: true } },
      },
    })

    const ubicaciones = medidores.map((m) => ({
      idMedidor: m.idMedidor,
      nombreSocio: `${m.socio.nombre} ${m.socio.apellidos}`,
      direccion: m.ubicacionSocio!.direccion,
      latitud: m.ubicacionSocio!.latitud,
      longitud: m.ubicacionSocio!.longitud,
    }))

    res.status(200).json(ubicaciones)
  } catch (error) {
    console.error('Error al obtener las ubicaciones de medidores:', error)
    res.status(500).json({ mensaje: 'Error al obtener las ubicaciones de medidores' })
  }
}

// Obtener todos los medidores con socio para listarlos
export const obtenerMedidores = async (_req: Request, res: Response) => {
  try {
    const medidores = await prisma.medidor.findMany({
      select: {
        idMedidor: true,
        estado: true,
        fechaRegistro: true,
        socio: { select: { idUsuario: true, nombre: true, apellidos: true } },
        categoria: { select: { idCategoria: true, tipo: true } },
        ubicacionSocio: { select: { direccion: true, latitud: true, longitud: true, descripcion: true } },
      },
    })

    const infoMedidores = medidores.map((m) => ({
      idMedidor: m.idMedidor,
      idUsuario: m.socio.idUsuario,
      idCategoria: m.categoria.idCategoria,
      nombre: m.socio.nombre,
      apellido: m.socio.apellidos,
      estado: m.estado,
      categoria: m.categoria.tipo,
      direccion: m.ubicacionSocio!.direccion,
      fechaRegistro: m.fechaRegistro,
      ubicacion: {
        latitud: m.ubicacionSocio!.latitud,
        longitud: m.ubicacionSocio!.longitud,
        descripcion: m.ubicacionSocio!.descripcion,
      }
    }))

    res.status(200).json(infoMedidores)
  } catch (error) {
    console.error('Error al obtener las ubicaciones de medidores:', error)
    res.status(500).json({
      mensaje: 'Error al obtener las ubicaciones de medidores',
    })
  }
}

//Insertar un nuevo medidor
export const crearMedidor = async (req: Request, res: Response) => {
  try {
    const { idUsuario, idCategoria, direccion, ubicacion, estado } = req.body;

    if (!idUsuario || !idCategoria || !direccion || !ubicacion || estado === undefined) {
      res.status(400).json({ mensaje: 'Datos incompletos' });
      return
    }

    if (ubicacion.latitud === 0 || ubicacion.longitud === 0) {
      res.status(400).json({ mensaje: 'Latitud y longitud son obligatorios' });
      return
    }

    // Crear el medidor
    const nuevoMedidor = await prisma.medidor.create({
      data: {
        idSocio: idUsuario,
        idCategoria,
        estado,
        // fechaRegistro se pone automáticamente por default
        ubicacionSocio: {
          create: {
            direccion,
            latitud: ubicacion.latitud,
            longitud: ubicacion.longitud,
            descripcion: ubicacion.descripcion || '',
          },
        },
      },
      include: {
        socio: true,
        categoria: true,
        ubicacionSocio: true,
      },
    });

    const respuesta = {
      idMedidor: nuevoMedidor.idMedidor,
      idUsuario: nuevoMedidor.socio.idUsuario,
      idCategoria: nuevoMedidor.categoria.idCategoria,
      nombre: nuevoMedidor.socio.nombre,
      apellido: nuevoMedidor.socio.apellidos,
      estado: nuevoMedidor.estado,
      categoria: nuevoMedidor.categoria.tipo,
      direccion: nuevoMedidor.ubicacionSocio!.direccion,
      fechaRegistro: nuevoMedidor.fechaRegistro,
      ubicacion: {
        latitud: nuevoMedidor.ubicacionSocio!.latitud,
        longitud: nuevoMedidor.ubicacionSocio!.longitud,
        descripcion: nuevoMedidor.ubicacionSocio!.descripcion,
      }
    };

    res.status(201).json(respuesta);
  } catch (error) {
    console.error('Error al crear medidor:', error);
    res.status(500).json({ mensaje: 'Error al crear medidor' });
  }
};

export const actualizarMedidor = async (req: Request, res: Response) => {
  const idMedidor = Number(req.params.idMedidor)
  const { idUsuario, idCategoria, direccion, ubicacion, estado } = req.body

  try {
    // Validar parámetros
    if (isNaN(idMedidor)) {
      res.status(400).json({ mensaje: 'ID de medidor inválido.' })
      return
    }

    if (!idUsuario || !idCategoria || !direccion || !ubicacion) {
      res.status(400).json({ mensaje: 'Datos incompletos.' })
      return
    }

    // Verificar existencia del medidor
    const medidorExistente = await prisma.medidor.findUnique({
      where: { idMedidor },
      include: { ubicacionSocio: true },
    })

    if (!medidorExistente) {
      res.status(404).json({ mensaje: 'Medidor no encontrado.' })
      return
    }

    // Actualizar datos del medidor
    const medidorActualizado = await prisma.medidor.update({
      where: { idMedidor },
      data: {
        idSocio: idUsuario,
        idCategoria,
        estado,
        ubicacionSocio: {
          update: {
            direccion,
            latitud: ubicacion.latitud,
            longitud: ubicacion.longitud,
            descripcion: ubicacion.descripcion || '',
          },
        },
      },
      include: {
        socio: true,
        categoria: true,
        ubicacionSocio: true,
      },
    })

    // Respuesta formateada
    const respuesta = {
      idMedidor: medidorActualizado.idMedidor,
      idUsuario: medidorActualizado.socio.idUsuario,
      idCategoria: medidorActualizado.categoria.idCategoria,
      nombre: medidorActualizado.socio.nombre,
      apellido: medidorActualizado.socio.apellidos,
      estado: medidorActualizado.estado,
      categoria: medidorActualizado.categoria.tipo,
      direccion: medidorActualizado.ubicacionSocio?.direccion,
      fechaRegistro: medidorActualizado.fechaRegistro,
      ubicacion: {
        latitud: medidorActualizado.ubicacionSocio?.latitud,
        longitud: medidorActualizado.ubicacionSocio?.longitud,
        descripcion: medidorActualizado.ubicacionSocio?.descripcion,
      },
    }

    res.status(200).json(respuesta)
  } catch (error) {
    console.error('Error al actualizar medidor:', error)
    res.status(500).json({ mensaje: 'Error al actualizar medidor.' })
  }
}