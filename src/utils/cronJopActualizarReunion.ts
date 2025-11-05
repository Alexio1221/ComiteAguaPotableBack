import cron from 'node-cron';
import prisma from '../config/client'; 

//todos los días a medianoche
cron.schedule('0 * * * *', async () => {
  console.log('Ejecutando revisión de reuniones vencidas:', new Date().toLocaleString());

  const ahora = new Date();

  try {
    const reunionesActualizadas = await prisma.reunion.updateMany({
      where: {
        fechaReunion: { lt: ahora },
        estado: { in: ['PENDIENTE', 'EN_PROCESO'] },
      },
      data: {
        estado: 'FINALIZADO',
      },
    });

    console.log(`Reuniones actualizadas: ${reunionesActualizadas.count}`);
  } catch (error) {
    console.error('Error al actualizar reuniones vencidas:', error);
  }
});
