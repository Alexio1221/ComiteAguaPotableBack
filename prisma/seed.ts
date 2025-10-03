import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Hashear una contraseña base
  const passwordHash = await bcrypt.hash("121212Alex", 10);

  // === Roles ===
  await prisma.rol.createMany({
    data: [
      { nombreRol: "Administrador", descripcion: "Acceso total al sistema" },
      { nombreRol: "Cajero", descripcion: "Gestión de cobros y pagos" },
      { nombreRol: "Operador", descripcion: "Gestión operativa del sistema" },
      { nombreRol: "Socio", descripcion: "Usuario con acceso limitado" },
    ],
    skipDuplicates: true,
  });

  // === Usuarios ===
  await prisma.usuario.createMany({
    data: [
      { nombre: "Alex", apellidos: "Garcia Colque", telefono: "67483408", ci: "12345678", usuario: "alexdev", contraseña: passwordHash },
      { nombre: "Carla", apellidos: "Aldapi", telefono: "70000002", ci: "12345679", usuario: "carla", contraseña: passwordHash },
      { nombre: "Carlos", apellidos: "Lopez", telefono: "70000003", ci: "12345680", usuario: "carlosg", contraseña: passwordHash },
      { nombre: "Ana", apellidos: "Torrez", telefono: "70000004", ci: "12345681", usuario: "anat", contraseña: passwordHash },
      { nombre: "Luis", apellidos: "Martinez", telefono: "70000005", ci: "12345682", usuario: "luism", contraseña: passwordHash },
      { nombre: "Laura", apellidos: "Fernandez", telefono: "70000006", ci: "12345683", usuario: "lauraf", contraseña: passwordHash },
      { nombre: "Pedro", apellidos: "Gutierrez", telefono: "70000007", ci: "12345684", usuario: "pedrog", contraseña: passwordHash },
      { nombre: "Sofia", apellidos: "Rodriguez", telefono: "70000008", ci: "12345685", usuario: "sofiar", contraseña: passwordHash },
      { nombre: "Diego", apellidos: "Suarez", telefono: "70000009", ci: "12345686", usuario: "diegos", contraseña: passwordHash },
      { nombre: "Camila", apellidos: "Mendoza", telefono: "70000010", ci: "12345687", usuario: "camilam", contraseña: passwordHash },
    ],
    skipDuplicates: true,
  });

  // === UsuarioRol ===
  await prisma.usuarioRol.createMany({
    data: [
      { idUsuario: 1, idRol: 4, estado: true },
      { idUsuario: 2, idRol: 4, estado: true },
      { idUsuario: 3, idRol: 4, estado: true },
      { idUsuario: 4, idRol: 4, estado: true },
      { idUsuario: 5, idRol: 4, estado: true },
      { idUsuario: 6, idRol: 4, estado: true },
      { idUsuario: 7, idRol: 4, estado: true },
      { idUsuario: 8, idRol: 4, estado: true },
      { idUsuario: 9, idRol: 4, estado: true },
      { idUsuario: 10, idRol: 4, estado: true },
      { idUsuario: 1, idRol: 1, estado: true }, // Admin + Socio
      { idUsuario: 2, idRol: 2, estado: true }, // Cajero + Socio
      { idUsuario: 3, idRol: 3, estado: true }, // Operador + Socio
    ],
    skipDuplicates: true,
  });

  // === Funciones ===
  await prisma.funcion.createMany({
    data: [
      { idRol: 1, nombreFuncion: "Usuarios", icono: "Users" },
      { idRol: 1, nombreFuncion: "Medidores", icono: "Gauge" },
      { idRol: 1, nombreFuncion: "Pagos", icono: "CreditCard" },
      { idRol: 1, nombreFuncion: "Reportes", icono: "BarChart" },
      { idRol: 1, nombreFuncion: "Incidencias", icono: "AlertTriangle" },
      { idRol: 1, nombreFuncion: "Avisos", icono: "Bell" },
      { idRol: 1, nombreFuncion: "Mapa", icono: "Map" },
      { idRol: 1, nombreFuncion: "Asambleas", icono: "ClipboardList" },
      { idRol: 1, nombreFuncion: "Estadísticas", icono: "Activity" },

      { idRol: 2, nombreFuncion: "Cobros", icono: "DollarSign" },
      { idRol: 2, nombreFuncion: "Comprobantes", icono: "FileText" },
      { idRol: 2, nombreFuncion: "Cuentas", icono: "BookOpen" },
      { idRol: 2, nombreFuncion: "Reportes", icono: "BarChart2" },
      { idRol: 2, nombreFuncion: "Consumo", icono: "Droplet" },
      { idRol: 2, nombreFuncion: "Avisos", icono: "Bell" },

      { idRol: 3, nombreFuncion: "Lecturas", icono: "Edit3" },
      { idRol: 3, nombreFuncion: "Mantenimiento", icono: "Wrench" },
      { idRol: 3, nombreFuncion: "Mapa", icono: "MapPin" },
      { idRol: 3, nombreFuncion: "Historial", icono: "Archive" },
      { idRol: 3, nombreFuncion: "Asistencia", icono: "CheckSquare" },

      { idRol: 4, nombreFuncion: "Consumo", icono: "Droplet" },
      { idRol: 4, nombreFuncion: "Pagos", icono: "CreditCard" },
      { idRol: 4, nombreFuncion: "Cuenta", icono: "Book" },
      { idRol: 4, nombreFuncion: "Avisos", icono: "Bell" },
      { idRol: 4, nombreFuncion: "Reclamos", icono: "AlertCircle" },
      { idRol: 4, nombreFuncion: "Reuniones", icono: "Calendar" },
      { idRol: 4, nombreFuncion: "Mapa", icono: "Map" },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    console.log("✅ Seed ejecutado con éxito");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error en seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
