// src/utils/tiposDatos.ts

export interface RegistroBody {
  nombre: string;
  apellidos: string;
  telefono: string;
  usuario: string;
  contraseña: string;
  rolesIds: number[];
  estadosRoles: Record<string, boolean>;
}

