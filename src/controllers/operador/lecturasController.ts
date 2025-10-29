import { Request, Response, NextFunction } from 'express'
import prisma from '../../config/client'
import { EstadoLectura } from '@prisma/client';
import { RequestConUsuario } from '../../middlewar/autenticacion';

//Crear una nueva lecturas cada mes
export const crearLecturasPendientes = async (_req: Request, _res: Response, next: NextFunction) => {
    try {
        const ahora = new Date();
        const mesActual = ahora.getMonth();
        const anioActual = ahora.getFullYear();

        // Traer todos los medidores activos con sus lecturas
        const medidores = await prisma.medidor.findMany({
            where: { estado: 'ACTIVO' },
            include: { lecturas: true },
        });

        const nuevasLecturas: any[] = [];

        for (const medidor of medidores) {
            const tieneLecturaEsteMes = medidor.lecturas.some(l => {
                const fecha = l.fechaLectura;
                return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
            });

            if (!tieneLecturaEsteMes) {
                // Obtener la última lectura del medidor
                const ultimaLectura = medidor.lecturas
                    .sort((a, b) => b.fechaLectura.getTime() - a.fechaLectura.getTime())[0];

                const lecturaAnterior = ultimaLectura?.lecturaActual ?? 0;

                nuevasLecturas.push({
                    idMedidor: medidor.idMedidor,
                    lecturaAnterior,
                    estado: 'PENDIENTE',
                    fechaLectura: ahora,
                });
            }
        }

        // Crear todas las lecturas pendientes de una sola vez
        if (nuevasLecturas.length > 0) {
            await prisma.lectura.createMany({
                data: nuevasLecturas,
                skipDuplicates: true, // opcional, evita duplicados si ya existieran
            });
        }

        next();
    } catch (error) {
        console.error('Error al generar lecturas pendientes:', error);
        _res.status(500).json({ mensaje: 'Error al generar lecturas pendientes.' });
    }
};

export const obtenerMedidoresLectura = async (_req: Request, res: Response) => {
    try {
        const ahora = new Date();
        const mesActual = ahora.getMonth();
        const anioActual = ahora.getFullYear();

        // 1️⃣ Traer todos los medidores activos con sus lecturas
        const medidores = await prisma.medidor.findMany({
            where: { estado: 'ACTIVO' },
            include: { lecturas: true },
        });

        // 2️⃣ Generar lecturas pendientes si no existen para este mes
        const nuevasLecturas: any[] = [];

        for (const medidor of medidores) {
            const lecturaEsteMes = medidor.lecturas.find(l =>
                l.fechaLectura.getMonth() === mesActual && l.fechaLectura.getFullYear() === anioActual
            );

            if (!lecturaEsteMes) {
                const ultimaLectura = medidor.lecturas
                    .sort((a, b) => b.fechaLectura.getTime() - a.fechaLectura.getTime())[0];

                nuevasLecturas.push({
                    idMedidor: medidor.idMedidor,
                    lecturaAnterior: ultimaLectura?.lecturaActual ?? 0,
                    estado: 'PENDIENTE',
                    fechaLectura: ahora,
                });
            }
        }

        if (nuevasLecturas.length > 0) {
            await prisma.lectura.createMany({
                data: nuevasLecturas,
                skipDuplicates: true,
            });
        }

        // 3️⃣ Traer ahora las lecturas de este mes para mostrar
        const medidoresConLectura = await prisma.medidor.findMany({
            where: { estado: 'ACTIVO' },
            include: {
                socio: true,
                categoria: true,
                ubicacionSocio: true,
                lecturas: {
                    where: {
                        fechaLectura: {
                            gte: new Date(anioActual, mesActual, 1),
                            lt: new Date(anioActual, mesActual + 1, 1),
                        },
                    },
                    take: 1,
                    orderBy: { fechaLectura: 'desc' },
                },
            },
        });

        // 4️⃣ Formatear respuesta
        const infoMedidores = medidoresConLectura.map(m => {
            const lecturaActual = m.lecturas[0];

            return {
                idLectura: lecturaActual?.idLectura ?? 0,
                idMedidor: m.idMedidor,
                nombre: m.socio.nombre,
                apellido: m.socio.apellidos,
                direccion: m.ubicacionSocio?.direccion ?? 'Sin dirección',
                categoria: m.categoria.tipo,
                lecturaAnterior: lecturaActual?.lecturaAnterior ?? 0,
                lecturaActual: lecturaActual?.lecturaActual ?? 0,
                consumo: lecturaActual?.consumo ?? 0,
                estado: lecturaActual?.estado ?? 'PENDIENTE',
            };
        });

        res.status(200).json(infoMedidores);
    } catch (error) {
        console.error('Error al obtener medidores:', error);
        res.status(500).json({
            mensaje: 'Error al obtener medidores',
        });
    }
};


//Registrar nueva lectura
export const registrarLectura = async (req: RequestConUsuario, res: Response) => {
    try {
        const { idLectura, idMedidor, lecturaAnterior, lecturaActual, consumo, observaciones } = req.body;
        const operador = req.user?.idUsuario;

        if (!operador) {
            res.status(401).json({ mensaje: 'No autorizado. Inicie sesión nuevamente.' });
            return;
        }

        if (!idLectura || lecturaActual === undefined || lecturaAnterior === undefined || consumo === undefined) {
            res.status(400).json({ mensaje: 'Faltan datos obligatorios. Inténtalo de nuevo.' });
            return;
        }

        if (lecturaActual < lecturaAnterior) {
            res.status(400).json({
                mensaje: 'La lectura actual no puede ser menor a la lectura anterior.',
            });
            return;
        }

        const lecturaActualizada = await prisma.lectura.update({
            where: { idLectura },
            data: {
                lecturaAnterior,
                lecturaActual,
                consumo,
                observaciones: observaciones || null,
                fechaLectura: new Date(),
                estado: 'REGISTRADO',
            },
        });

        const comprobanteExistente = await prisma.comprobante.findUnique({
            where: { idLectura },
        });

        const medidor = await prisma.medidor.findUnique({
            where: { idMedidor },
            include: { categoria: true },
        });

        if (!medidor) {
            res.status(404).json({ mensaje: 'Medidor no encontrado.' });
            return;
        }

        const tarifaAdicional = Number(medidor.categoria.tarifaAdicional);
        const tarifaBasica = Number(medidor.categoria.tarifa);
        const limiteBasico = Number(medidor.categoria.limiteBasico);
        let montoAdicional = 0;
        if (consumo > limiteBasico) {
            montoAdicional = (consumo - limiteBasico) * tarifaAdicional;
        }
        const cantidadMesesAtrasado = await prisma.comprobante.count({
            where: {
                estadoPago: 'PENDIENTE',
                lectura: {
                    medidor: {
                        idMedidor: idMedidor, // aquí colocas el ID que quieres filtrar
                    },
                },
            },
        });
        let moraAcumulada = 0;
        if (cantidadMesesAtrasado > 3) {
            moraAcumulada = 2;
        }

        const totalPagar = tarifaBasica + montoAdicional + moraAcumulada;
        //Damos de plazo 3 meses para pagar 
        const fechaEmision = new Date(); 
        const fechaLimite = new Date(
            fechaEmision.getFullYear(),
            fechaEmision.getMonth() + 3, // sumas 3 meses
            fechaEmision.getDate()        // mismo día
        );

        if (!comprobanteExistente) {
            await prisma.comprobante.create({
                data: {
                    idLectura,
                    idOperador: operador,
                    montoBasico: tarifaBasica,
                    montoAdicional,
                    moraAcumulada,
                    totalPagar,
                    fechaLimite,
                    estadoPago: 'PENDIENTE',
                },
            });
        } else {
            await prisma.comprobante.update({
                where: { idLectura },
                data: {
                    idOperador: operador,
                    montoBasico: tarifaBasica,
                    montoAdicional,
                    moraAcumulada,
                    totalPagar,
                    fechaLimite,
                    estadoPago: 'PENDIENTE',
                },
            });
        }

        res.status(200).json({
            mensaje: 'Lectura registrada correctamente',
            lectura: lecturaActualizada,
        });
    } catch (error) {
        console.error('Error al registrar lectura:', error);
        res.status(500).json({
            mensaje: 'Error al registrar la lectura.',
        });
    }
};
