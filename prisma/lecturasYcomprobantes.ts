import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

export async function mainLecturas() {
    const medidores = await prisma.medidor.findMany({
        include: { categoria: true }
    });

    const operadores = await prisma.usuario.findMany({
        where: { roles: { some: { idRol: 3 } } } // operadores
    });

    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear() - 1, 0, 1); // enero año pasado
    const ultimoMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1); // primer día del mes actual
    ultimoMes.setDate(0);
    for (const medidor of medidores) {
        let lecturaAnterior = 0;

        for (let fecha = new Date(inicio); fecha <= ultimoMes; fecha.setMonth(fecha.getMonth() + 1)) {
            const consumo = Math.floor(Math.random() * 20) + 5; // consumo aleatorio
            const lecturaActual = lecturaAnterior + consumo;

            const lectura = await prisma.lectura.create({
                data: {
                    idMedidor: medidor.idMedidor,
                    lecturaAnterior,
                    lecturaActual,
                    consumo,
                    fechaLectura: new Date(fecha),
                    estado: 'REGISTRADO',
                },
            });

            // Crear comprobante
            const operador = operadores[Math.floor(Math.random() * operadores.length)];
            const montoBasico = medidor.categoria.tarifa;
            const montoAdicional = consumo > medidor.categoria.limiteBasico.toNumber() ? (consumo - medidor.categoria.limiteBasico.toNumber()) * medidor.categoria.tarifaAdicional.toNumber() : 0;
            const totalPagar = montoBasico.toNumber() + montoAdicional;

            await prisma.comprobante.create({
                data: {
                    idLectura: lectura.idLectura,
                    idOperador: operador.idUsuario,
                    montoBasico,
                    montoAdicional,
                    totalPagar: new Prisma.Decimal(totalPagar),
                    estadoPago: 'PENDIENTE',
                    fechaLimite: new Date(fecha.getFullYear(), fecha.getMonth() + 1, 10), // fecha límite
                },
            });

            lecturaAnterior = lecturaActual;
        }
    }

    console.log('✅ Lecturas históricas y comprobantes generados');
}
