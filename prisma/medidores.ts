import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function mainMedidores() {
  const usuarios = await prisma.usuario.findMany({
    where: { roles: { some: { idRol: 4 } } } // solo socios
  });

  const categorias = await prisma.categoria.findMany();

  for (const usuario of usuarios) {
    const categoria = categorias[Math.floor(Math.random() * categorias.length)];

    // Coordenadas aleatorias dentro del rango
    const lat = Math.random() * (-17.40097 + 17.41546) - 17.41546;
    const lng = Math.random() * (-65.96821 + 65.99998) - 65.99998;

    const medidor = await prisma.medidor.create({
      data: {
        idSocio: usuario.idUsuario,
        idCategoria: categoria.idCategoria,
        fechaRegistro: new Date(),
        estado: 'ACTIVO',
        ubicacionSocio: {
          create: {
            direccion: 'Dirección de prueba',
            latitud: lat,
            longitud: lng,
            descripcion: 'Ubicación aleatoria',
          },
        },
      },
    });

    console.log('Medidor creado:', medidor.idMedidor);
  }
}
