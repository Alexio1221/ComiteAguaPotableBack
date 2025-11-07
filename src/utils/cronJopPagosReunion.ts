import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Ejecutar cada medianoche
cron.schedule("0 0 * * *", async () => {
  console.log("Ejecutando cron job de pagos automáticos...");

  try {
    // Buscar reuniones finalizadas
    const reuniones = await prisma.reunion.findMany({
      where: { estado: "FINALIZADO" },
      select: { idReunion: true },
    });

    for (const reunion of reuniones) {
      // Buscar asistencias AUSENTES sin pago
      const ausentes = await prisma.asistencia.findMany({
        where: {
          idReunion: reunion.idReunion,
          estado: "AUSENTE",
          pagos: { none: {} }, // no tienen ningún PagoReunion asociado
        },
        select: {
          idReunion: true,
          idUsuario: true,
        },
      });

      if (ausentes.length > 0) {
        await prisma.pagoReunion.createMany({
          data: ausentes.map(a => ({
            idReunion: a.idReunion,
            idUsuario: a.idUsuario,
            idCajero: 1, // o null si no hay cajero asignado
            estado: false,
          })),
          skipDuplicates: true, //  seguridad adicional
        });
        console.log(` Pagos creados para reunión ${reunion.idReunion}: ${ausentes.length}`);
      }
    }

    console.log("Cron job completado sin errores.");
  } catch (error) {
    console.error("Error en cron job:", error);
  }
});
