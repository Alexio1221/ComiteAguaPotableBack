import { Request, Response } from 'express'
import prisma from '../../config/client'

// Obtener todos los medidores con socio y su ubicación
export const obtenerUbicacionesMedidores = async (_req: Request, res: Response) => {
  try {
    const medidores = await prisma.medidor.findMany({
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
        socio: { select: { nombre: true, apellidos: true } },
        categoria: { select: { tipo: true } },
        ubicacionSocio: { select: { direccion: true } },
      },
    })

    const infoMedidores = medidores.map((m) => ({
      idMedidor: m.idMedidor,
      nombre: m.socio.nombre,
      apellido: m.socio.apellidos,
      categoria: m.categoria.tipo,
      estado: m.estado,
      direccion: m.ubicacionSocio!.direccion,
      fechaRegistro: m.fechaRegistro,
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
      nombre: nuevoMedidor.socio.nombre,
      apellido: nuevoMedidor.socio.apellidos,
      categoria: nuevoMedidor.categoria.tipo, // solo el string
      estado: nuevoMedidor.estado,
      direccion: nuevoMedidor.ubicacionSocio!.direccion,
      fechaRegistro: nuevoMedidor.fechaRegistro,
    };

    res.status(201).json(respuesta);
  } catch (error) {
    console.error('Error al crear medidor:', error);
    res.status(500).json({ mensaje: 'Error al crear medidor' });
  }
};
