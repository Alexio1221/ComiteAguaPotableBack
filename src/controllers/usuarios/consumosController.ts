import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { RequestConUsuario } from "../../middlewar/autenticacion";

const prisma = new PrismaClient();

export const obtenerConsumos = async (req: RequestConUsuario, res: Response) => {
    try {
        const idUsuario = req.user?.idUsuario;

        // Obtener los medidores del usuario con sus categorías y lecturas
        const medidores = await prisma.medidor.findMany({
            where: { idSocio: idUsuario },
            select: {
                idMedidor: true,
                categoria: {
                    select: {
                        tipo: true,
                        tarifa: true,
                        tarifaAdicional: true,
                        limiteBasico: true,
                    },
                },
                lecturas: {
                    where: { estado: "REGISTRADO" },
                    orderBy: { fechaLectura: "desc" },
                    select: {
                        idLectura: true,
                        consumo: true,
                        fechaLectura: true,
                        estado: true,
                        comprobante: {
                            select: {
                                estadoPago: true,
                            },
                        },
                    },
                },
            },
        });

        // Formatear los datos para la respuesta
        const resultado = medidores.map((m) => ({
            idMedidor: m.idMedidor,
            identificador: `Medidor #${m.idMedidor}`,
            categoria: m.categoria.tipo,
            tarifaBasica: Number(m.categoria.tarifa),
            limiteBasico: Number(m.categoria.limiteBasico),
            precioExcedente: Number(m.categoria.tarifaAdicional),
            consumos: m.lecturas.map((l) => ({   //Lecturas
                idConsumo: l.idLectura,
                mes: l.fechaLectura.toLocaleString("es-ES", { month: "long", year: "numeric" }),
                consumo: Number(l.consumo),
                estado: l.comprobante?.estadoPago,
            })),
        }));

        res.json(resultado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al obtener consumos" });
    }
};
