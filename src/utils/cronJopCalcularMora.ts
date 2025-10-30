import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cron job: se ejecuta cada día a medianoche
cron.schedule('*/5 * * * *', async () => {
  console.log('Verificando moras...');

  const comprobantes = await prisma.comprobante.findMany({
    where: {
      estadoPago: 'PENDIENTE',
    },
    include: {
      lectura: {
        include: {
          medidor: {
            include: { categoria: true },
          },
        },
      },
    },
  });

  const hoy = new Date();

  for (const comprobante of comprobantes) {
    const { fechaLimite, idComprobante, lectura } = comprobante;

    if (hoy > fechaLimite) {
      // Buscar cuántos comprobantes anteriores del mismo medidor están en retraso
      const retrasosPrevios = await prisma.comprobante.count({
        where: {
          estadoPago: 'VENCIDO',
          lectura: { medidor: { idMedidor: lectura.idMedidor } },
        },
      });

      const tarifaAdicional = lectura.medidor.categoria.tarifaAdicional.toNumber();
      let mora = 0;
      if (lectura.medidor.categoria.moraExponencial == true) {
        console.log("Se esta aplicando la mora exponencial")
        // Calcular mora exponencial según cuántos retrasos tenga
        mora = Math.pow(tarifaAdicional, retrasosPrevios + 1);
      } else {
        console.log("No se esta aplicando la mora normal")
        mora = tarifaAdicional * (retrasosPrevios + 1);
      }
      
      await prisma.comprobante.update({
        where: { idComprobante },
        data: {
          estadoPago: 'VENCIDO',
          moraAcumulada: mora,
          totalPagar: comprobante.totalPagar.plus(mora),
        },
      });

      console.log(`Mora aplicada a comprobante ${idComprobante}: ${mora} Bs`);
    }
  }

  console.log('Actualización de moras completada');
});
