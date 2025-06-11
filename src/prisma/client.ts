import { PrismaClient } from '@prisma/client';

// Crear una instancia única de PrismaClient para usar en toda la app
const prisma = new PrismaClient();

export default prisma;
