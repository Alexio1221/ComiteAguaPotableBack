// src/utils/tiposDatos.ts

export interface RegistroBody {
  nombre: string;
  apellidos: string;
  telefono: string;
  usuario: string;
  contraseña: string;
  ci: string;
  rolesIds: number[];
  estadosRoles: Record<string, boolean>;
}

export interface Medidor {
  idMedidor: number;
  ubicacionSocio?: {
    direccion?: string;
  };
}

export interface Lectura {
  medidor: Medidor;
}

export interface Comprobante {
  idComprobante: number;
  totalPagar: number;
  lectura: Lectura;
}
