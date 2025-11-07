import { Request, Response } from 'express';
import prisma from '../../config/client';

export const obtenerPagosReunion = async (_req: Request, res: Response) => {
  try {
    const pagos = await prisma.pagoReunion.findMany({
      include: {
        asistencia: {
          include: {
            usuario: true,
            reunion: {
              include: { tarifa: true },
            },
          },
        },
      },
    })

    const datos = pagos.map(p => ({
      idPagoReunion: p.idPagoReunion,
      idReunion: p.idReunion,
      idUsuario: p.idUsuario,
      nombreSocio: `${p.asistencia.usuario.nombre} ${p.asistencia.usuario.apellidos}`,
      nombreReunion: p.asistencia.reunion.tarifa.nombreReunion,
      monto: p.asistencia.reunion.tarifa.ausente,
      fechaReunion: p.asistencia.reunion.fechaReunion,
      pagado: p.estado,
    }))

    res.json(datos)
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener pagos' })
  }
}

export const registrarPagoReunion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const pago = await prisma.pagoReunion.update({
      where: { idPagoReunion: Number(id) },
      data: {
        estado: true,
        fechaPago: new Date(),
      },
    })

    res.json({ mensaje: 'Pago actualizado correctamente', pago })
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al registrar pago' })
  }
}
