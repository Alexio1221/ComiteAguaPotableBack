import { Request, Response } from 'express'
import prisma from '../../config/client'

// Obtener todas las figuras
export const obtenerFiguras = async (req: Request, res: Response) => {
    try {
        const figuras = await prisma.figura.findMany();
        res.json(figuras);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener las figuras" });
    }
};

// Crear una nueva figura
export const crearFigura = async (req: Request, res: Response) => {
    try {
        const { nombre, tipo, geojson } = req.body;

        console.log(nombre, tipo, geojson)

        if (!nombre || !tipo || !geojson) {
            res.status(400).json({ error: "Faltan datos requeridos" });
            return
        }

        console.log("Paso el primer if")

        const figura = await prisma.figura.create({
            data: { nombre, tipo, geojson },
        });

        console.log("Paso el create", figura)

        res.status(201).json(figura);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear la figura" });
    }
};

// Actualizar figura
export const actualizarFigura = async (req: Request, res: Response) => {
    try {
        const { idFigura } = req.params;
        const { nombre, geojson } = req.body;

        const figura = await prisma.figura.update({
            where: { idFigura: Number(idFigura) },
            data: { nombre, geojson },
        });

        res.json(figura);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar la figura" });
    }
};

// Eliminar figura
export const eliminarFigura = async (req: Request, res: Response) => {
    try {
        const { idFigura } = req.params;
        console.log(idFigura)
        await prisma.figura.delete({ where: { idFigura: Number(idFigura) } });
        res.json({ message: "Figura eliminada correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar la figura" });
    }
};
