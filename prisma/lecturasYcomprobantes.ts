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
  const inicio = new Date(hoy.getFullYear() - 1, 0, 1); // 1 de enero del año pasado
  const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0); // último día del mes anterior

  for (const medidor of medidores) {
    let lecturaAnterior = 0;

    // Iterar mes a mes desde inicio hasta fin
    for (
      let fecha = new Date(inicio);
      fecha <= fin;
      fecha = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 1)
    ) {
      const consumo = Math.floor(Math.random() * 20) + 5; // consumo aleatorio
      const lecturaActual = lecturaAnterior + consumo;

      const fechaLectura = new Date(fecha); // copia segura
      const fechaLimite = new Date(fechaLectura);
      fechaLimite.setMonth(fechaLimite.getMonth() + 3); // 3 meses después de la lectura

      const lectura = await prisma.lectura.create({
        data: {
          idMedidor: medidor.idMedidor,
          lecturaAnterior,
          lecturaActual,
          consumo,
          fechaLectura,
          estado: 'REGISTRADO',
        },
      });

      const operador = operadores[Math.floor(Math.random() * operadores.length)];
      const montoBasico = medidor.categoria.tarifa;
      const limiteBasico = medidor.categoria.limiteBasico.toNumber();
      const adicionalTarifa = medidor.categoria.tarifaAdicional.toNumber();

      const montoAdicional =
        consumo > limiteBasico ? (consumo - limiteBasico) * adicionalTarifa : 0;

      const totalPagar = montoBasico.toNumber() + montoAdicional;

      await prisma.comprobante.create({
        data: {
          idLectura: lectura.idLectura,
          idOperador: operador.idUsuario,
          montoBasico,
          montoAdicional,
          totalPagar: new Prisma.Decimal(totalPagar),
          estadoPago: 'PENDIENTE',
          fechaEmision: fechaLectura,
          fechaLimite,
        },
      });

      lecturaAnterior = lecturaActual;
    }
  }

  console.log('✅ Lecturas históricas y comprobantes generados correctamente');
}
