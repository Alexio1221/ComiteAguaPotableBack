import { Request, Response, NextFunction } from 'express'
import prisma from '../../config/client'
import { EstadoLectura } from '@prisma/client';
import { RequestConUsuario } from '../../middlewar/autenticacion';

export const obtenerDatosSocio = async (req: RequestConUsuario, res: Response) => {
    try {
        const idUsuario = req.body?.idSocio || req.user?.idUsuario;

        const datos = await prisma.usuario.findUnique({
            where: { idUsuario: Number(idUsuario) },
            select: {
                idUsuario: true,
                nombre: true,
                apellidos: true,
                ci: true,
                telefono: true,
                usuario: true,
                creadoEn: true,
                medidores: {
                    select: {
                        idMedidor: true,
                        ubicacionSocio: {
                            select: {
                                direccion: true
                            }
                        },
                    },
                },
                roles: {
                    select: {
                        rol: {
                            select: {
                                idRol: true,
                                nombreRol: true,
                                descripcion: true,
                            }
                        }
                    }
                }
            },
        });

        if (!datos) {
            res.status(404).json({ error: "Usuario no encontrado" });
            return
        }

        const respuestaFormateada = {
            idUsuario: datos.idUsuario,
            nombre: datos.nombre,
            apellidos: datos.apellidos,
            ci: datos.ci,
            telefono: datos.telefono,
            usuario: datos.usuario,
            creadoEn: datos.creadoEn,
            medidores: datos.medidores.map(m => ({
                idMedidor: m.idMedidor,
                ubicacion: {
                    direccion: m.ubicacionSocio?.direccion,
                }
            })),
            roles: datos.roles.map(r => ({
                idRol: r.rol.idRol,
                nombreRol: r.rol.nombreRol,
                descripcion: r.rol.descripcion
            }))
        };

        res.json(respuestaFormateada)
    } catch (error) {
        console.error('Error al registrar lectura:', error);
        res.status(500).json({
            mensaje: 'Error al registrar la lectura.',
        });
    }
};